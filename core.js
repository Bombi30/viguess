  // ── Game Flow ─────────────────────────────────────────────────────────────
  function startGame(mode) {
    currentGameSessionId++;
    const sessionId = currentGameSessionId;
    currentMode  = mode;
    currentRound = 1;
    totalScore   = 0;
    hasGuessed   = false;
    gameActive   = true;

    isMultiplayer = false;
    el.multiScoreHud.style.display = 'none';
    
    if (mlyViewer) setTimeout(() => mlyViewer.resize(), 50);

    // Pick locations, filtering out empty ones from previous searches
    const pool = getModePool(mode)
      .filter(l => !localStorage.getItem('mly_empty_' + l.id));

    gameLocations = shuffleLocations([...pool]);

    updateHUD();
    showScreen('game');
    initGuessMap();

    // Hiển thị overlay tải ngay lập tức để ẩn đi hình ảnh cũ
    el.loadingView.style.display = 'flex';
    el.loadingText.textContent   = 'Đang chuẩn bị màn chơi...';

    // Prefetch location[0] trước (await) → loadRound hit cache ngay, không chờ API
    // Sau đó prefetch phần còn lại ngầm, không tranh băng thông với moveTo WebGL
    prefetchSingle(gameLocations[0]).then(() => {
      if (sessionId !== currentGameSessionId) return;
      loadRound();
      setTimeout(() => {
        if (sessionId !== currentGameSessionId) return;
        prefetchBatch(gameLocations.slice(1), 3);
      }, 5000);
    });
  }

  // Helper to query Mapillary for images around a location using safe, small bounding boxes.
  // This avoids Mapillary's HTTP 500 error on dense coordinates by never querying large bboxes.
  async function fetchImagesForLocation(loc) {
    if (activeFetches.has(loc.id)) {
      console.log(`[Deduplicate] Found active fetch for ${loc.name}, reusing promise.`);
      return activeFetches.get(loc.id);
    }

    const fetchPromise = (async () => {
      async function queryBBox(lat, lng, delta) {
        const bbox = `${(lng - delta).toFixed(6)},${(lat - delta).toFixed(6)},${(lng + delta).toFixed(6)},${(lat + delta).toFixed(6)}`;
        const url = `https://graph.mapillary.com/images?access_token=${nextToken()}&fields=id,geometry,is_pano&bbox=${bbox}&limit=100`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.status === 200) {
            const data = await res.json();
            return data?.data || [];
          }
        } catch (e) {
          clearTimeout(timeoutId);
        }
        return [];
      }

      // 1. Query center first (delta = 0.0005)
      let images = await queryBBox(loc.lat, loc.lng, 0.0005);
      
      // 2. If empty, query 4 small offsets in parallel (approx 90m radius)
      if (images.length === 0) {
        const offset = 0.0008;
        const results = await Promise.all([
          queryBBox(loc.lat + offset, loc.lng, 0.0005),
          queryBBox(loc.lat - offset, loc.lng, 0.0005),
          queryBBox(loc.lat, loc.lng + offset, 0.0005),
          queryBBox(loc.lat, loc.lng - offset, 0.0005)
        ]);
        images = results.flat();
      }
      
      // 3. If still empty, query 4 further offsets in parallel (approx 180m radius)
      if (images.length === 0) {
        const offset = 0.0016;
        const results = await Promise.all([
          queryBBox(loc.lat + offset, loc.lng, 0.0005),
          queryBBox(loc.lat - offset, loc.lng, 0.0005),
          queryBBox(loc.lat, loc.lng + offset, 0.0005),
          queryBBox(loc.lat, loc.lng - offset, 0.0005)
        ]);
        images = results.flat();
      }

      if (images.length === 0) return null;

      // Remove duplicates
      const seen = new Set();
      const uniqueImages = [];
      for (const img of images) {
        if (!seen.has(img.id)) {
          seen.add(img.id);
          uniqueImages.push(img);
        }
      }

      // Sort by distance to the origin coordinate
      const actualLL = L.latLng(loc.lat, loc.lng);
      const sortByDist = (a, b) =>
        actualLL.distanceTo(L.latLng(a.geometry.coordinates[1], a.geometry.coordinates[0])) -
        actualLL.distanceTo(L.latLng(b.geometry.coordinates[1], b.geometry.coordinates[0]));

      let panos = uniqueImages.filter(img => img.is_pano === true).sort(sortByDist);
      let flats = uniqueImages.filter(img => img.is_pano !== true).sort(sortByDist);

      return [...panos.slice(0, 7), ...flats.slice(0, 3)].map(img => img.id);
    })();

    activeFetches.set(loc.id, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      activeFetches.delete(loc.id);
    }
  }

  // Prefetch duy nhất 1 location, await được — dùng trước loadRound để hit cache tức thì
  async function prefetchSingle(loc) {
    if (!loc) return;
    let ids = [];
    try {
      const storedStr = localStorage.getItem('mly_cache_v2_' + loc.id);
      if (storedStr) {
        const stored = JSON.parse(storedStr);
        if (stored?.ids?.length > 0) ids = stored.ids;
      }
    } catch(e) {}

    if (ids.length === 0) {
      try {
        const resultIds = await fetchImagesForLocation(loc);
        if (resultIds && resultIds.length > 0) {
          ids = resultIds;
          localStorage.setItem('mly_cache_v2_' + loc.id, JSON.stringify({ ids, ts: Date.now() }));
          console.log(`[prefetchSingle] Cached ${ids.length} ảnh cho: ${loc.name}`);
        } else {
          try {
            localStorage.setItem('mly_empty_' + loc.id, 'true');
            localStorage.removeItem('mly_good_' + loc.id);
          } catch(e){}
          console.log(`[prefetchSingle] Blacklisted empty location: ${loc.name}`);
        }
      } catch(e) {
        console.warn('[prefetchSingle] Thất bại, loadRound sẽ tự fetch:', e);
      }
    }

    if (ids.length > 0) {
      loc.preloadedId = ids[Math.floor(Math.random() * ids.length)];
      preloadImageTile(loc.preloadedId);
    }
  }

  // Fetch URL thumbnail từ Mapillary Graph API và preload vào browser cache
  async function preloadImageTile(imageId) {
    if (!imageId) return;
    try {
      const url = `https://graph.mapillary.com/${imageId}?access_token=${nextToken()}&fields=thumb_256_url,thumb_1024_url`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const data = await res.json();
      
      const thumbUrl = data.thumb_1024_url || data.thumb_256_url;
      if (thumbUrl) {
        const img = new Image();
        img.src = thumbUrl;
        console.log(`[preloadTile] Preloading thumbnail cho: ${imageId}`);
      }
    } catch(e) {
      // Không quan trọng nếu fail — moveTo() vẫn hoạt động bình thường
    }
  }

  function startEndlessGame(city) {
    currentGameSessionId++;
    const sessionId = currentGameSessionId;
    isEndless     = true;
    currentMode   = city || 'Mixed';
    currentRound  = 1;
    totalScore    = 0;
    hasGuessed    = false;
    gameActive    = true;
    endlessStreak = 0;
    endlessLives  = ENDLESS_LIVES;
    endlessRounds = 0;

    isMultiplayer = false;
    el.multiScoreHud.style.display = 'none';
    
    if (mlyViewer) setTimeout(() => mlyViewer.resize(), 50);

    const pool = getModePool(currentMode)
      .filter(l => !localStorage.getItem('mly_empty_' + l.id));

    gameLocations = shuffleLocations([...pool]);

    updateHUD();
    updateEndlessHUD();
    showScreen('game');
    initGuessMap();

    // Hiển thị overlay tải ngay lập tức để ẩn đi hình ảnh cũ
    el.loadingView.style.display = 'flex';
    el.loadingText.textContent   = 'Đang chuẩn bị màn chơi...';

    // Prefetch location[0] trước (await) → loadRound hit cache ngay, không chờ API
    // Sau đó prefetch phần còn lại ngầm, không tranh băng thông với moveTo WebGL
    prefetchSingle(gameLocations[0]).then(() => {
      if (sessionId !== currentGameSessionId) return;
      loadRound();
      setTimeout(() => {
        if (sessionId !== currentGameSessionId) return;
        prefetchBatch(gameLocations.slice(1), 3);
      }, 5000);
    });
  }

  function updateEndlessHUD() {
    if ($('hud-round-block')) $('hud-round-block').style.display = 'none';
    if ($('hud-lives-block')) $('hud-lives-block').style.display = 'flex';
    if ($('hud-streak-block')) $('hud-streak-block').style.display = 'flex';

    const livesString = '❤️'.repeat(Math.max(0, endlessLives)) || '💀';
    if ($('hud-lives')) $('hud-lives').textContent = livesString;
    if ($('hud-streak')) $('hud-streak').textContent = `${endlessStreak}🔥`;
  }

  function cleanupPeer() {
    stopHeartbeat();
    if (peerConnection) { peerConnection.close(); peerConnection = null; }
    if (peer) { peer.destroy(); peer = null; }
    isMultiplayer = false;
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatInterval = setInterval(() => {
        if (peerConnection && peerConnection.open) {
            sendPeerMessage({ type: 'PING' });
        }
    }, 5000);
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
  }

  function createRoom() {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    el.lobbyMenu.style.display = 'none';
    el.lobbyHostView.style.display = 'block';
    el.hostRoomCode.textContent = code;
    el.hostStatus.textContent = "Đang khởi tạo phòng...";
    el.hostControls.style.display = 'none';

    const roundsSelect = $('lobby-rounds-select');
    const timerSelect = $('lobby-timer-select');
    if (roundsSelect) { roundsSelect.value = "5"; roundsSelect.disabled = false; }
    if (timerSelect) { timerSelect.value = "180"; timerSelect.disabled = false; }
    
    peer = new Peer('viguessr-' + code, {
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }]
        }
    });
    peer.on('disconnected', () => {
        console.log('Mất kết nối với signaling server. Đang kết nối lại...');
        peer.reconnect();
    });
    peer.on('open', () => {
        el.hostStatus.textContent = "Đang chờ đối thủ tham gia mã: " + code;
    });
    peer.on('connection', conn => {
        peerConnection = conn;
        isHost = true;
        setupConnection();
        el.hostStatus.textContent = "Đối thủ đang kết nối...";
    });
    peer.on('error', err => {
        alert("Lỗi tạo phòng: " + err.message);
        showScreen('start');
    });
  }

  function joinRoom() {
    const code = el.roomCodeInput.value.toUpperCase().trim();
    if (!code) return;
    el.lobbyMenu.style.display = 'none';
    el.lobbyHostView.style.display = 'block';
    el.hostRoomCode.textContent = "ĐANG TÌM...";
    el.hostStatus.textContent = "Đang kết nối đến " + code;
    el.hostControls.style.display = 'none';

    const roundsSelect = $('lobby-rounds-select');
    const timerSelect = $('lobby-timer-select');
    if (roundsSelect) { roundsSelect.value = "5"; roundsSelect.disabled = true; }
    if (timerSelect) { timerSelect.value = "180"; timerSelect.disabled = true; }

    peer = new Peer({
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }]
        }
    });
    peer.on('disconnected', () => {
        console.log('Mất kết nối với signaling server. Đang kết nối lại...');
        peer.reconnect();
    });
    peer.on('open', () => {
        peerConnection = peer.connect('viguessr-' + code);
        isHost = false;
        setupConnection();
    });
    peer.on('error', err => {
        alert("Không tìm thấy phòng: " + err.message);
        showScreen('start');
    });
  }

  function syncLobbySettings() {
    if (!isHost) return;
    const roundsSelect = $('lobby-rounds-select');
    const timerSelect = $('lobby-timer-select');
    if (!roundsSelect || !timerSelect) return;
    
    const roundsVal = parseInt(roundsSelect.value, 10);
    const timerVal = parseInt(timerSelect.value, 10);
    
    TOTAL_ROUNDS = roundsVal;
    roundTimerLimit = timerVal;
    
    if (peerConnection && peerConnection.open) {
        sendPeerMessage({
            type: 'SYNC_SETTINGS',
            rounds: roundsVal,
            timer: timerVal
        });
    }
  }

  function goToLobby() {
    currentRound = 1;
    myMultiScore = 0;
    oppMultiScore = 0;
    
    TOTAL_ROUNDS = 5;
    roundTimerLimit = 180;

    const roundsSelect = $('lobby-rounds-select');
    const timerSelect = $('lobby-timer-select');
    if (roundsSelect) roundsSelect.value = "5";
    if (timerSelect) timerSelect.value = "180";

    if (isHost) {
        if (roundsSelect) roundsSelect.disabled = false;
        if (timerSelect) timerSelect.disabled = false;
    } else {
        if (roundsSelect) roundsSelect.disabled = true;
        if (timerSelect) timerSelect.disabled = true;
    }
    
    if (guessMarker) { guessMap && guessMap.removeLayer(guessMarker); guessMarker = null; }
    if (resultLine)  { guessMap && guessMap.removeLayer(resultLine);  resultLine  = null; }

    showScreen('lobby');
    el.lobbyMenu.style.display = 'none';
    el.lobbyHostView.style.display = 'block';

    if (isHost) {
        el.hostStatus.textContent = "Đối thủ đã kết nối!";
        el.hostControls.style.display = 'block';
    } else {
        el.hostRoomCode.textContent = 'ĐÃ KẾT NỐI';
        el.hostStatus.textContent = 'Đang chờ chủ phòng chọn map...';
        el.hostControls.style.display = 'none';
    }
  }

  function setupConnection() {
    function handleConnectionOpen() {
        if (isHost) {
            el.hostStatus.textContent = "Đối thủ đã kết nối! Đang chờ đồng bộ...";
            syncLobbySettings();
        } else {
            el.hostRoomCode.textContent = 'ĐÃ KẾT NỐI';
            el.hostStatus.textContent = 'Đang chờ chủ phòng chọn map...';
            // Also hide controls explicitly for guest just in case
            el.hostControls.style.display = 'none';
            // Send READY to host
            sendPeerMessage({ type: 'GUEST_READY' });
        }
        startHeartbeat();
    }

    if (peerConnection.open) {
        handleConnectionOpen();
    }

    peerConnection.on('open', () => {
        handleConnectionOpen();
    });

    peerConnection.on('error', err => {
        console.error("Lỗi kết nối đối thủ:", err);
    });

    peerConnection.on('data', data => {
        if (!data || typeof data !== 'object') return;

        if (data.type === 'PING') {
            if (peerConnection && peerConnection.open) {
                sendPeerMessage({ type: 'PONG' });
            }
            return;
        }

        if (data.type === 'PONG') {
            return;
        }

        if (data.type === 'GUEST_READY' && isHost) {
            el.hostStatus.textContent = "Đối thủ đã sẵn sàng!";
            el.hostControls.style.display = 'block';
            return;
        }

        if (data.type === 'SYNC_SETTINGS') {
            if (typeof data.rounds !== 'number' || typeof data.timer !== 'number') return;
            TOTAL_ROUNDS = data.rounds;
            roundTimerLimit = data.timer;
            
            const roundsSelect = $('lobby-rounds-select');
            const timerSelect = $('lobby-timer-select');
            if (roundsSelect) roundsSelect.value = String(data.rounds);
            if (timerSelect) timerSelect.value = String(data.timer);
            
            el.hostStatus.textContent = `Đã đồng bộ cài đặt: ${data.rounds} vòng, ${data.timer}s/vòng.`;
            return;
        }

        if (data.type === 'START_GAME') {
            const validModes = ['Hanoi', 'Saigon', 'DaNang', 'DaLat', 'HoiAn', 'VungTau', 'NhaTrang', 'SaPa', 'Mixed'];
            let errorMsg = '';
            if (!validModes.includes(data.mode)) {
                errorMsg = 'Lỗi chế độ chơi không hợp lệ: ' + data.mode;
            } else if (!Array.isArray(data.locations) || data.locations.length !== TOTAL_ROUNDS) {
                errorMsg = 'Lỗi danh sách địa điểm không hợp lệ.';
            } else {
                for (const loc of data.locations) {
                    if (!loc || typeof loc !== 'object' || typeof loc.id !== 'string' ||
                        typeof loc.lat !== 'number' || isNaN(loc.lat) || loc.lat < 8 || loc.lat > 24 ||
                        typeof loc.lng !== 'number' || isNaN(loc.lng) || loc.lng < 102 || loc.lng > 110 ||
                        typeof loc.name !== 'string' || typeof loc.city !== 'string') {
                        errorMsg = 'Lỗi thông tin địa điểm không hợp lệ.';
                        break;
                    }
                }
            }

            if (errorMsg) {
                console.error(errorMsg, data);
                alert(errorMsg + ' Đang quay lại phòng chờ...');
                cleanupPeer();
                showScreen('start');
                return;
            }

            currentGameSessionId++;
            currentMode = data.mode;
            gameLocations = data.locations;
            currentRound = 1;
            myMultiScore = 0;
            oppMultiScore = 0;
            isMultiplayer = true;
            isEndless = false;
            el.multiScoreHud.style.display = 'flex';
            
            showScreen('game');
            initGuessMap();
            startMultiplayerRound();
        } else if (data.type === 'GUESS') {
            const g = data.guess;
            if (!g || typeof g !== 'object') return;
            if (typeof g.lat !== 'number' || isNaN(g.lat)) return;
            if (typeof g.lng !== 'number' || isNaN(g.lng)) return;
            if (typeof g.distKm !== 'number' || isNaN(g.distKm) || g.distKm < 0) return;
            if (typeof g.score !== 'number' || isNaN(g.score) || g.score < 0 || g.score > MAX_SCORE) return;

            oppGuessData = g;
            oppMultiScore += g.score;
            checkMultiplayerRoundOver();
        } else if (data.type === 'NEXT_ROUND') {
            if (currentRound >= TOTAL_ROUNDS) return;
            currentRound++;
            startMultiplayerRound();
        } else if (data.type === 'SHOW_FINAL') {
            showFinal();
        } else if (data.type === 'SYNC_IMAGE') {
            if (typeof data.imageId !== 'string' && typeof data.imageId !== 'number') return;
            currentImageId = data.imageId;
            syncMapillaryImage(data.imageId);
        } else if (data.type === 'SKILL_MUSTARD') {
            const sv = $('street-view');
            if (sv) {
                sv.style.transition = 'filter 0.5s';
                sv.style.filter = 'blur(15px) sepia(1) hue-rotate(50deg) saturate(3)';
                setTimeout(() => {
                    sv.style.filter = 'none';
                }, 4000);
            }

        } else if (data.type === 'SWAP_LOCATION') {
            if (data.round === currentRound) {
                console.log("[SWAP_LOCATION] Received new location from host:", data.newLocation.name);
                gameLocations[currentRound - 1] = data.newLocation;
                currentLoc = data.newLocation;
                resetRoundUI();
                el.loadingView.style.display = 'flex';
                el.loadingText.textContent = '⚠️ Chủ phòng đang đổi sang điểm khác...';
            }
        } else if (data.type === 'SYNC_TIMER') {
            if (typeof data.timeLeft !== 'number' || isNaN(data.timeLeft)) return;
            if (!isHost) {
                timeLeft = data.timeLeft;
                updateTimerHUD();
                
                // Fallback: Nếu miss packet SYNC_IMAGE nhưng nhận được heartbeat timer
                if (data.imageId && currentImageId !== data.imageId) {
                    console.log("[SYNC_TIMER] Phục hồi packet SYNC_IMAGE bị mất cho ID:", data.imageId);
                    currentImageId = data.imageId;
                    syncMapillaryImage(data.imageId);
                }

                if (timeLeft <= 15 && timeLeft > 0) {
                    if (el.timerHud) el.timerHud.classList.add('timer-low');
                    playTick();
                } else {
                    if (el.timerHud) el.timerHud.classList.remove('timer-low');
                }
                if (timeLeft <= 0) {
                    stopTimer();
                    autoSubmitGuess();
                }
            }
        } else if (data.type === 'GO_TO_LOBBY') {
            goToLobby();
        } else if (data.type === 'IMAGE_LOAD_ERROR') {
            if (data.round === currentRound) {
                console.warn("Đối thủ báo lỗi tải ảnh ở vòng:", data.round);
                if (isHost) {
                    if (timerActive) {
                        console.warn("Host đang chơi, bỏ qua lỗi tải ảnh của đối thủ để không làm gián đoạn vòng.");
                    } else {
                        const sessionId = currentGameSessionId;
                        el.loadingView.style.display = 'flex';
                        el.loadingText.textContent = '⚠️ Đối thủ lỗi tải ảnh, đang đổi điểm khác...';
                        setTimeout(() => {
                            if (sessionId !== currentGameSessionId) return;
                            const pool = (currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode))
                                         .filter(l => !localStorage.getItem('mly_empty_' + l.id));
                            const newLoc = pool[Math.floor(Math.random() * pool.length)];
                            gameLocations[currentRound - 1] = newLoc;
                            sendPeerMessage({ type: 'SWAP_LOCATION', round: currentRound, newLocation: newLoc });
                            currentLoc = newLoc;
                            resetRoundUI();
                            loadSVImage(newLoc);
                        }, 1500);
                    }
                }
            }
        }
    });
    peerConnection.on('close', () => {
        stopHeartbeat();
        alert("Mất kết nối với đối thủ!");
        resetGame();
        showScreen('start');
    });
  }

  function startMultiplayerGame(mode) {
    currentGameSessionId++;
    currentMode = mode;
    currentRound = 1;
    myMultiScore = 0;
    oppMultiScore = 0;
    isMultiplayer = true;
    isEndless = false;
    el.multiScoreHud.style.display = 'flex';
    
    // Pick exactly 5 random locations for both, filtering out empty ones
    const pool = getModePool(mode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
    gameLocations = shuffleLocations([...pool]).slice(0, TOTAL_ROUNDS);
    
    sendPeerMessage({
        type: 'START_GAME',
        mode: currentMode,
        locations: gameLocations
    });
    
    showScreen('game');
    initGuessMap();
    startMultiplayerRound();
  }

  function startMultiplayerRound() {
    hasGuessed = false;
    oppGuessData = null;
    myGuessTemp = null;
    gameActive = true;
    updateHUD();
    
    // Resize viewer just in case
    setTimeout(() => {
        if (mlyViewer) mlyViewer.resize();
    }, 50);
    
    // Reset UI
    el.multiWaitingText.style.display = 'none';
    const btnSkill = $('btn-skill-mustard');
    if (btnSkill) {
        btnSkill.style.display = 'inline-block';
        btnSkill.disabled = false;
    }

    currentLoc = gameLocations[currentRound - 1];
    
    resetRoundUI();

    showScreen('game');
    
    el.loadingView.style.display = 'flex';
    if (isHost) {
        el.loadingText.textContent = 'Đang tải ảnh đường phố...';
        loadSVImage(currentLoc);
    } else {
        el.loadingText.textContent = 'Đang đồng bộ ảnh với Chủ phòng...';
    }
  }

  function resetRoundUI() {
    if (guessMarker && guessMap) { guessMap.removeLayer(guessMarker); }
    guessMarker = null;
    if (resultLine && guessMap)  { guessMap.removeLayer(resultLine); }
    resultLine  = null;
    el.btnGuess.disabled = true;
    el.btnGuess.style.display = 'block';
    if (window.gsap && el.btnGuess) {
      gsap.killTweensOf(el.btnGuess);
      gsap.set(el.btnGuess, { scale: 1 });
    }

    if (guessMap) {
      guessMap.setView([16.0, 106.5], 5);
    }

    retryAction = null;
    if (el.btnRetryImg) {
      el.btnRetryImg.style.display = 'none';
    }
    const spinner = el.loadingView.querySelector('.spinner');
    if (spinner) {
      spinner.style.display = 'block';
    }

    const cityBadgeEl = $('city-badge');
    if (currentMode === 'Mixed') {
      if (cityBadgeEl) cityBadgeEl.style.display = 'none';
    } else {
      if (cityBadgeEl) cityBadgeEl.style.display = '';
      let badge = '🗺️ Việt Nam';
      if (currentLoc) {
        if (currentLoc.city === 'Hanoi') badge = '🏛️ Hà Nội';
        else if (currentLoc.city === 'Saigon') badge = '🌆 Sài Gòn';
        else if (currentLoc.city === 'DaNang') badge = '🌉 Đà Nẵng';
        else if (currentLoc.city === 'DaLat') badge = '🌸 Đà Lạt';
        else if (currentLoc.city === 'HoiAn') badge = '⛩️ Hội An';
        else if (currentLoc.city === 'VungTau') badge = '🏖️ Vũng Tàu';
        else if (currentLoc.city === 'NhaTrang') badge = '🏝️ Nha Trang';
        else if (currentLoc.city === 'SaPa') badge = '🏔️ Sa Pa';
      }
      if (cityBadgeEl) cityBadgeEl.textContent = badge;
    }
  }

  function resetGame() {
    currentGameSessionId++;
    stopTimer();
    gameActive    = false;
    isEndless     = false;
    currentRound  = 1;
    totalScore    = 0;
    endlessStreak = 0;
    endlessLives  = ENDLESS_LIVES;
    endlessRounds = 0;
    if (guessMarker && guessMap) { guessMap.removeLayer(guessMarker); }
    guessMarker = null;
    if (resultLine && guessMap)  { guessMap.removeLayer(resultLine); }
    resultLine  = null;
    if (guessMap) {
      try {
        guessMap.remove();
      } catch (e) {
        console.warn("Error removing guessMap:", e);
      }
      guessMap = null;
    }
    if (resultMap) {
      try {
        resultMap.remove();
      } catch (e) {
        console.warn("Error removing resultMap:", e);
      }
      resultMap = null;
    }
    el.btnGuess.disabled = true;
    $('total-score').textContent   = '0';
    $('current-round').textContent = '1';
    // Restore HUD to classic state
    if ($('hud-round-block')) $('hud-round-block').style.display = 'flex';
    if ($('hud-lives-block')) $('hud-lives-block').style.display = 'none';
    if ($('hud-streak-block')) $('hud-streak-block').style.display = 'none';
  }

  function loadRound() {
    if (!gameActive) return;
    
    const btnSkill = $('btn-skill-mustard');
    if (btnSkill) {
        if (isEndless) {
            btnSkill.style.display = 'inline-block';
            btnSkill.disabled = false;
        } else if (!isMultiplayer) {
            btnSkill.style.display = 'none';
        }
    }

    // In endless mode we never stop for TOTAL_ROUNDS; in classic we do
    if (!isEndless && currentRound > TOTAL_ROUNDS) { showFinal(); return; }

    // If we run out of locations in the pool, reshuffle
    if (currentRound > gameLocations.length) {
      const pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
      gameLocations.push(...shuffleLocations([...pool]));
    }

    // Skip blacklisted empty locations (e.g. from background prefetch)
    while (currentRound <= gameLocations.length) {
      currentLoc = gameLocations[currentRound - 1];
      if (!currentLoc || !localStorage.getItem('mly_empty_' + currentLoc.id)) {
        break;
      }
      console.log(`[loadRound] Skipping blacklisted empty location: ${currentLoc.name}`);
      const pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
      if (pool.length > 0) {
        currentLoc = pool[Math.floor(Math.random() * pool.length)];
        gameLocations[currentRound - 1] = currentLoc;
      } else {
        break;
      }
    }

    hasGuessed = false;

    if (window.__vlog && currentLoc) {
      window.__vlog('round_start', { 
        id: currentLoc.id, name: currentLoc.name, 
        city: currentLoc.city, lat: currentLoc.lat, lng: currentLoc.lng 
      });
    }

    resetRoundUI();
    updateHUD();
    if (isEndless) updateEndlessHUD();

    // Load Street View
    el.loadingView.style.display = 'flex';
    el.loadingText.textContent   = 'Đang tải ảnh đường phố...';
    loadSVImage(currentLoc);
  }

  async function loadSVImage(loc, attempt = 1) {
    const sessionId = currentGameSessionId;
    if (el.btnRetryImg) el.btnRetryImg.style.display = 'none';
    const spinner = el.loadingView.querySelector('.spinner');
    if (spinner) spinner.style.display = 'block';
    el.loadingView.style.display = 'flex';

    if (mlyViewer) {
      mlyViewer.setAccessToken(nextToken());
    }

    el.loadingText.textContent   = 'Đang tải ảnh đường phố...';

    // Thử lấy mảng ID ảnh từ bộ nhớ đệm (Cache V2) để tăng tốc và đa dạng hóa
    let cachedIds = [];
    try {
      const storedStr = localStorage.getItem('mly_cache_v2_' + loc.id);
      if (storedStr) {
        const stored = JSON.parse(storedStr);
        if (Array.isArray(stored)) {
          cachedIds = stored;
        } else if (stored && stored.ids && stored.ts) {
          const ageDays = (Date.now() - stored.ts) / (1000 * 60 * 60 * 24);
          if (ageDays < 7) {
            cachedIds = stored.ids;
          } else {
            localStorage.removeItem('mly_cache_v2_' + loc.id);
          }
        }
      }
    } catch(e) {}

    const hadCache = cachedIds && cachedIds.length > 0;
    if (!cachedIds || cachedIds.length === 0) {
      el.loadingText.textContent = 'Đang tìm kiếm ảnh quanh khu vực này...';
      
      let resultIds = null;
      try {
        resultIds = await fetchImagesForLocation(loc);
      } catch (err) {
        console.warn(`Fetch error for ${loc.name}:`, err);
      }

      if (sessionId !== currentGameSessionId) return;

      if (resultIds && resultIds.length > 0) {
          cachedIds = resultIds;
          localStorage.setItem('mly_cache_v2_' + loc.id, JSON.stringify({ ids: cachedIds, ts: Date.now() }));
          console.log(`[loadSVImage] Successfully found & cached ${cachedIds.length} images for ${loc.name}`);
      } else {
          console.error('Mapillary error: No images found or fetch failed');
          if (!isMultiplayer) {
              try {
                  localStorage.setItem('mly_empty_' + loc.id, 'true');
                  localStorage.removeItem('mly_good_' + loc.id);
              } catch(e){}
              console.log(`[loadSVImage] Blacklisted empty location: ${loc.name}`);
              el.loadingText.textContent = '⚠️ Khu vực này không có ảnh, đang tìm điểm khác...';
              setTimeout(() => {
                  if (sessionId !== currentGameSessionId) return;
                  let pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
                  if (pool.length === 0) {
                      pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
                  }
                  if (pool.length > 0) {
                      gameLocations[currentRound - 1] = pool[Math.floor(Math.random() * pool.length)];
                      loadRound();
                  } else {
                      console.error("Critical error: No locations available.");
                      alert("Lỗi: Không tìm thấy địa điểm khả dụng.");
                      showScreen('start');
                  }
              }, 1000);
          } else {
              if (isHost) {
                  try {
                      localStorage.setItem('mly_empty_' + loc.id, 'true');
                      localStorage.removeItem('mly_good_' + loc.id);
                  } catch(e){}
                  console.log(`[loadSVImage] (Multiplayer) Blacklisted empty location: ${loc.name}`);
                  el.loadingText.textContent = '⚠️ Khu vực này không có ảnh, đang đổi điểm khác...';
                  setTimeout(() => {
                      if (sessionId !== currentGameSessionId) return;
                      let pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
                      if (pool.length === 0) {
                          pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
                      }
                      if (pool.length > 0) {
                          const newLoc = pool[Math.floor(Math.random() * pool.length)];
                          gameLocations[currentRound - 1] = newLoc;
                          sendPeerMessage({ type: 'SWAP_LOCATION', round: currentRound, newLocation: newLoc });
                          currentLoc = newLoc;
                          resetRoundUI();
                          loadSVImage(newLoc);
                      } else {
                          console.error("Critical error: No locations available for swap.");
                          alert("Lỗi: Không tìm thấy địa điểm khả dụng để thay thế.");
                          cleanupPeer();
                          showScreen('start');
                      }
                  }, 1500);
              } else {
                  const spinner = el.loadingView.querySelector('.spinner');
                  if (spinner) spinner.style.display = 'none';
                  el.loadingText.textContent = '⚠️ Không tìm thấy ảnh Mapillary tại đây.';
                  if (el.btnRetryImg) {
                      el.btnRetryImg.textContent = 'Thử tìm lại';
                      el.btnRetryImg.style.display = 'inline-block';
                  }
                  retryAction = () => {
                      if (sessionId !== currentGameSessionId) return;
                      loadSVImage(loc, attempt);
                  };
              }
          }
          return;
      }
    }

    // Chọn ID đã được preload (nếu có), hoặc chọn ngẫu nhiên từ mảng cache
    const randomId = loc.preloadedId || cachedIds[Math.floor(Math.random() * cachedIds.length)];

    if (!mlyViewer) {
        console.error("mlyViewer chưa sẵn sàng");
        return;
    }

    // Delay nhỏ để giải phóng luồng chính trước khi WebGL xử lý tải ảnh (tránh treo DataConnection)
    await new Promise(resolve => setTimeout(resolve, hadCache ? 0 : (isMultiplayer ? 100 : 30)));
    if (sessionId !== currentGameSessionId) return;

    try {
      const moveToPromise = mlyViewer.moveTo(randomId).then(() => {
          try { if (mlyViewer.setCenter) mlyViewer.setCenter([0.5, 0.5]); } catch(e) {}
      });
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout loading image")), 15000)
      );

      await Promise.race([moveToPromise, timeoutPromise]);
      if (sessionId !== currentGameSessionId) return;
      el.loadingView.style.display = 'none';
      try { localStorage.setItem('mly_good_' + loc.id, '1'); } catch(e) {}
      if (isMultiplayer && isHost) {
          currentImageId = randomId;
          sendPeerMessage({ type: 'SYNC_IMAGE', imageId: randomId });
      }
      startTimer();
    } catch (err) {
      if (sessionId !== currentGameSessionId) return;
      console.error(`Lỗi khi tải hình ảnh ID (lần thử ${attempt}):`, err);
      // Xóa ID bị lỗi khỏi cache
      cachedIds = cachedIds.filter(id => id !== randomId);
      
      if (cachedIds.length > 0 && attempt < 2) {
        localStorage.setItem('mly_cache_v2_' + loc.id, JSON.stringify({
          ids: cachedIds,
          ts: Date.now()
        }));
        // Thử load lại vòng này với ID khác (tối đa 1 lần thử lại)
        loadSVImage(loc, attempt + 1);
      } else {
        localStorage.removeItem('mly_cache_v2_' + loc.id);
        localStorage.removeItem('mly_good_' + loc.id);
        
        if (!isMultiplayer || isHost) {
            el.loadingText.textContent = '⚠️ Ảnh này bị lỗi tải quá lâu, đang đổi điểm khác...';
            setTimeout(() => {
                if (sessionId !== currentGameSessionId) return;
                let pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
                if (pool.length === 0) {
                    pool = getModePool(currentMode).filter(l => !localStorage.getItem('mly_empty_' + l.id));
                }
                if (pool.length > 0) {
                    const newLoc = pool[Math.floor(Math.random() * pool.length)];
                    gameLocations[currentRound - 1] = newLoc;
                    if (isMultiplayer && isHost && peerConnection && peerConnection.open) {
                        sendPeerMessage({ type: 'SWAP_LOCATION', round: currentRound, newLocation: newLoc });
                    }
                    loadRound();
                } else {
                    console.error("Critical error: No locations available on timeout fallback.");
                    alert("Lỗi: Không tìm thấy địa điểm khả dụng.");
                    showScreen('start');
                }
            }, 1000);
        } else {
            const spinner = el.loadingView.querySelector('.spinner');
            if (spinner) spinner.style.display = 'none';
            el.loadingText.textContent = '⚠️ Ảnh bị lỗi, đang chờ chủ phòng đổi điểm...';
            if (el.btnRetryImg) {
                el.btnRetryImg.style.display = 'none';
            }
            
            if (peerConnection && peerConnection.open) {
                sendPeerMessage({ type: 'IMAGE_LOAD_ERROR', round: currentRound });
            }
        }
      }
    }
  }

  // Prefetch: chỉ fetch & cache imageIds, KHÔNG moveTo (không tốn WebGL)
  async function prefetchNextLocation() {
    if (isMultiplayer) return; // multiplayer tự sync riêng
    if (!isEndless && currentRound >= TOTAL_ROUNDS) return; // classic đã hết vòng
    const sessionId = currentGameSessionId;

    // Tính index vòng tiếp theo
    let nextIdx = currentRound; // currentRound là 1-based, nên nextIdx = currentRound trỏ đến vòng kế
    
    // Endless: pool có thể cần mở rộng
    if (nextIdx >= gameLocations.length) {
      const pool = (currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode))
                   .filter(l => !localStorage.getItem('mly_empty_' + l.id));
      gameLocations.push(...shuffleLocations([...pool]));
    }

    const nextLoc = gameLocations[nextIdx];
    if (!nextLoc) return;

    // Nếu đã có cache thì bỏ qua
    try {
      const storedStr = localStorage.getItem('mly_cache_v2_' + nextLoc.id);
      if (storedStr) {
        const stored = JSON.parse(storedStr);
        if (stored && stored.ids && stored.ids.length > 0) return; // đã có cache
      }
    } catch(e) {}

    // Fetch nhẹ, không block UI
    try {
      const resultIds = await fetchImagesForLocation(nextLoc);
      if (sessionId !== currentGameSessionId) return;
      if (resultIds && resultIds.length > 0) {
        localStorage.setItem('mly_cache_v2_' + nextLoc.id, JSON.stringify({ ids: resultIds, ts: Date.now() }));
        console.log(`[Prefetch] Đã cache ${resultIds.length} ảnh cho: ${nextLoc.name}`);
      }
    } catch(e) {
      console.warn('[Prefetch] Thất bại, bỏ qua:', e);
    }
  }

  // Chạy ngầm khi user ở start screen, cache trước N locations
  async function prefetchBatch(locations, count = 5) {
    const sessionId = currentGameSessionId;
    const targets = locations.slice(0, count);
    
    for (const loc of targets) {
      if (sessionId !== currentGameSessionId) return;
      let ids = [];
      // Kiểm tra cache trước
      try {
        const storedStr = localStorage.getItem('mly_cache_v2_' + loc.id);
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          if (stored?.ids?.length > 0) ids = stored.ids;
        }
      } catch(e) {}

      if (ids.length === 0) {
        // Fetch nhẹ
        try {
          const resultIds = await fetchImagesForLocation(loc);
          if (sessionId !== currentGameSessionId) return;
          if (resultIds && resultIds.length > 0) {
            ids = resultIds;
            localStorage.setItem('mly_cache_v2_' + loc.id, JSON.stringify({ ids, ts: Date.now() }));
            console.log(`[Batch prefetch] Cached ${ids.length} ảnh cho: ${loc.name}`);
          } else {
            try {
              localStorage.setItem('mly_empty_' + loc.id, 'true');
              localStorage.removeItem('mly_good_' + loc.id);
            } catch(e){}
            console.log(`[Batch prefetch] Blacklisted empty location: ${loc.name}`);
          }
        } catch(e) {
          console.warn('[Batch prefetch] Thất bại:', loc.name);
        }
      }

      if (ids.length > 0) {
        loc.preloadedId = ids[Math.floor(Math.random() * ids.length)];
        preloadImageTile(loc.preloadedId);
      }

      if (sessionId !== currentGameSessionId) return;
      // Nghỉ 800ms giữa mỗi request để không spam API
      await new Promise(r => setTimeout(r, 800));
    }
  }

  async function syncMapillaryImage(imageId, attempt = 1) {
      if (!gameActive || !isMultiplayer) return;
      const sessionId = currentGameSessionId;

      if (el.btnRetryImg) el.btnRetryImg.style.display = 'none';
      const spinner = el.loadingView.querySelector('.spinner');
      if (spinner) spinner.style.display = 'block';

      if (!mlyViewer) {
          console.warn("Viewer chưa sẵn sàng, thử lại sau 1s...");
          setTimeout(() => {
              if (sessionId !== currentGameSessionId) return;
              syncMapillaryImage(imageId, attempt);
          }, 1000);
          return;
      }
      
      mlyViewer.setAccessToken(nextToken());

      // Delay nhỏ để giải phóng luồng chính trước khi gọi WebGL API
      await new Promise(resolve => setTimeout(resolve, 500));
      if (sessionId !== currentGameSessionId) return;

      try {
          const moveToPromise = mlyViewer.moveTo(imageId).then(() => {
              try { if (mlyViewer.setCenter) mlyViewer.setCenter([0.5, 0.5]); } catch(e) {}
          });
          const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Timeout loading image")), 15000)
          );

          await Promise.race([moveToPromise, timeoutPromise]);
          if (sessionId !== currentGameSessionId) return;
          el.loadingView.style.display = 'none';
          startTimer();
      } catch (err) {
          if (sessionId !== currentGameSessionId) return;
          console.error(`Lỗi đồng bộ ảnh Mapillary (lần thử ${attempt}):`, err);
          if (attempt < 2) {
              el.loadingText.textContent = '⚠️ Thử kết nối lại ảnh...';
              setTimeout(() => {
                  if (sessionId !== currentGameSessionId) return;
                  syncMapillaryImage(imageId, attempt + 1);
              }, 2000);
          } else {
              if (spinner) spinner.style.display = 'none';
              el.loadingText.textContent = '⚠️ Lỗi tải ảnh đồng bộ.';
              if (el.btnRetryImg) {
                  el.btnRetryImg.textContent = 'Thử lại';
                  el.btnRetryImg.style.display = 'inline-block';
              }
              retryAction = () => {
                  if (sessionId !== currentGameSessionId) return;
                  syncMapillaryImage(imageId, 1);
              };
              if (peerConnection && peerConnection.open) {
                  sendPeerMessage({ type: 'IMAGE_LOAD_ERROR', round: currentRound });
              }
          }
      }
  }

  function submitGuess() {
    if (!guessMarker || hasGuessed) return;
    hasGuessed = true;
    stopTimer();
    el.btnGuess.disabled = true;
    if (window.gsap && el.btnGuess) {
      gsap.killTweensOf(el.btnGuess);
      gsap.set(el.btnGuess, { scale: 1 });
    }

    const guessLL  = guessMarker.getLatLng();
    const actualLL = L.latLng(currentLoc.lat, currentLoc.lng);
    const distKm   = guessLL.distanceTo(actualLL) / 1000;
    const score    = calcScore(distKm);

    // Tải trước ảnh vòng kế tiếp trong lúc user đang xem kết quả
    if (!isMultiplayer) prefetchNextLocation();

    if (isMultiplayer) {
        myMultiScore += score;
        sendPeerMessage({
            type: 'GUESS',
            guess: { lat: guessLL.lat, lng: guessLL.lng, distKm, score }
        });
        el.multiWaitingText.style.display = 'block';
        el.btnGuess.style.display = 'none';
        myGuessTemp = { guessLL, actualLL, distKm, score };
        checkMultiplayerRoundOver();
    } else {
        totalScore += score;

        // Endless Mode: update streak and lives
        if (isEndless) {
            endlessRounds++;
            if (score >= ENDLESS_STREAK_THRESHOLD) {
                endlessStreak++;
                if (endlessStreak > endlessBestStreak) endlessBestStreak = endlessStreak;
            } else {
                endlessStreak = 0;
                endlessLives--;
            }
            updateEndlessHUD();
        }

        showResult(distKm, score, guessLL, actualLL);
    }
  }

  function checkMultiplayerRoundOver() {
      if (hasGuessed && oppGuessData) {
          showMultiplayerResult();
      }
  }

  function showMultiplayerResult() {
      el.soloResultBadge.style.display = 'none';
      el.multiResultBadge.style.display = 'flex';
      
      el.multiMyScore.textContent = myGuessTemp.score.toLocaleString();
      el.multiOppScore.textContent = oppGuessData.score.toLocaleString();
      
      document.querySelector('.result-stats').style.display = 'none'; // hide solo distance card
      
      const isWinner = myGuessTemp.score > oppGuessData.score;
      if (isWinner) {
          playCorrect();
      } else if (myGuessTemp.score < oppGuessData.score) {
          playIncorrect();
      } else {
          playCorrect();
      }

      $('result-title').textContent = isWinner ? 'Thắng vòng này!' : (myGuessTemp.score < oppGuessData.score ? 'Thua vòng này!' : 'Hòa!');
      $('result-landmark-name').textContent = currentLoc.name;
      $('result-landmark-desc').textContent = currentLoc.desc || '';

      if (isHost) {
          $('btn-next-text').textContent = currentRound < TOTAL_ROUNDS ? 'Vòng Tiếp →' : 'Xem Kết Quả Cuối';
          $('btn-next').style.display = 'block';
      } else {
          $('btn-next').style.display = 'none'; // Waiting for host
      }

      updateHUD();
      showScreen('result');
      checkNonPopup(myGuessTemp.distKm, myGuessTemp.score, true);
      checkHackmapPopup(myGuessTemp.distKm);
      initMultiplayerResultMap(myGuessTemp, oppGuessData);
  }

  function calcScore(distKm) {
    if (distKm <= 0.05) return MAX_SCORE; // Dưới 50m được tuyệt đối 5000 điểm

    const max = CITY_MAX_DISTANCES[currentMode] || 50;
    if (distKm >= max) return 0;
    
    // Sử dụng công thức đường cong dốc hơn (bậc 4) để phạt nặng sai số
    let score = MAX_SCORE * Math.pow((max - distKm) / max, 4);
    return Math.round(score);
  }

  function animateScoreCount(element, start, end, duration) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentScore = Math.floor(easeProgress * (end - start) + start);
      element.textContent = currentScore.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = end.toLocaleString();
      }
    };
    window.requestAnimationFrame(step);
  }

  function showResult(distKm, score, guessLL, actualLL) {
    el.soloResultBadge.style.display = 'block';
    el.multiResultBadge.style.display = 'none';
    document.querySelector('.result-stats').style.display = 'flex';
    $('btn-next').style.display = 'block';

    animateScoreCount($('result-score'), 0, score, 1500);
    animateScoreCount($('result-score2'), 0, score, 1500);
    $('result-landmark-name').textContent = currentLoc.name;
    $('result-landmark-desc').textContent = currentLoc.desc || '';

    if (isEndless) {
        // Build Endless-specific result title
        const lostLife = score < ENDLESS_STREAK_THRESHOLD;
        if (lostLife) {
            playIncorrect();
        } else {
            playCorrect();
        }
        let title = lostLife
            ? `💔 Mất mạng! Còn ${endlessLives} mạng`
            : endlessStreak >= 5 ? `🔥 STREAK x${endlessStreak}! Đàng cốt!`
            : endlessStreak >= 2 ? `⭐ Streak x${endlessStreak}! Tiếp tục!`
            : '✅ Vòng qua!';
        $('result-title').textContent = title;
        $('btn-next-text').textContent = endlessLives <= 0 ? 'Xem kết quả' : 'Tiếp tục ♾️ →';
    } else {
        if (score >= 4500) {
            if (typeof playWinFanfare === 'function') playWinFanfare();
        } else if (score >= 1000) {
            playCorrect();
        } else {
            playIncorrect();
        }
        $('result-title').textContent = getRating(score);
        $('btn-next-text').textContent = 'Tiếp tục →';
    }

    $('result-distance').textContent = distKm < 1
      ? `${Math.round(distKm * 1000)} m`
      : `${distKm.toFixed(1)} km`;

    updateHUD();
    showScreen('result');

    checkNonPopup(distKm, score, false);
    checkHackmapPopup(distKm);

    // Build the result map showing guess vs actual
    initResultMap(guessLL, actualLL, distKm);
  }

  function checkNonPopup(distKm, score, isMulti) {
    let show = false;
    if (isMulti) {
        if (score === 0) show = true;
    } else if (isEndless) {
        if (score < ENDLESS_STREAK_THRESHOLD) show = true;
    } else {
        if (score === 0) show = true;
    }

    if (show) {
        const nonPopup = $('non-popup');
        if (nonPopup) {
            nonPopup.classList.add('show');
            setTimeout(() => {
                nonPopup.classList.remove('show');
            }, 1500);
        }
    }
  }

  function checkHackmapPopup(distKm) {
    if (distKm <= 0.05) {
        const popup = $('hackmap-popup');
        if (popup) {
            popup.classList.add('show');
            setTimeout(() => {
                popup.classList.remove('show');
            }, 4000);
        }
    }
  }

  function initResultMap(guessLL, actualLL, distKm) {
    // Destroy previous result map
    if (resultMap) { resultMap.remove(); resultMap = null; }

    resultMap = L.map('result-map', {
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(resultMap);

    // Guess marker (red)
    L.marker(guessLL, {
      icon: L.divIcon({
        className: '', iconSize: [28, 28], iconAnchor: [14, 28],
        html: '<div class="result-pin guess-pin">🔴</div>',
      })
    }).addTo(resultMap).bindTooltip('Bạn đoán', { permanent: false, direction: 'top' });

    // Actual marker (green)
    L.marker(actualLL, {
      icon: L.divIcon({
        className: '', iconSize: [28, 28], iconAnchor: [14, 28],
        html: '<div class="result-pin actual-pin">🟢</div>',
      })
    }).addTo(resultMap).bindTooltip('Vị trí đúng', { permanent: false, direction: 'top' });

    // Dashed line between them
    L.polyline([guessLL, actualLL], {
      color: '#3b82f6', weight: 3, dashArray: '8, 6',
      opacity: 0.9,
    }).addTo(resultMap);

    // Distance label at midpoint
    const midLat = (guessLL.lat + actualLL.lat) / 2;
    const midLng = (guessLL.lng + actualLL.lng) / 2;
    const distText = distKm < 1
      ? `${Math.round(distKm * 1000)} m`
      : `${distKm.toFixed(1)} km`;
    L.marker([midLat, midLng], {
      icon: L.divIcon({
        className: 'distance-label',
        html: `<span>${distText}</span>`,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      })
    }).addTo(resultMap);

    // Fit both markers into view
    resultMap.fitBounds(L.latLngBounds([guessLL, actualLL]), { padding: [40, 40] });
  }

  function initMultiplayerResultMap(my, opp) {
    if (resultMap) { resultMap.remove(); resultMap = null; }
    resultMap = L.map('result-map', { zoomControl: true, attributionControl: false, dragging: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(resultMap);

    const actualLL = my.actualLL;
    const oppLL = L.latLng(opp.lat, opp.lng);
    const myLL = my.guessLL;

    // Actual marker (green)
    L.marker(actualLL, {
      icon: L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 28], html: '<div class="result-pin actual-pin">🟢</div>' })
    }).addTo(resultMap).bindTooltip('Vị trí đúng', { permanent: false, direction: 'top' });

    // My marker (blue)
    L.marker(myLL, {
      icon: L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 28], html: '<div class="result-pin">🔵</div>' })
    }).addTo(resultMap).bindTooltip('Bạn', { permanent: true, direction: 'top' });
    
    // Opp marker (red)
    L.marker(oppLL, {
      icon: L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 28], html: '<div class="result-pin">🔴</div>' })
    }).addTo(resultMap).bindTooltip('Đối thủ', { permanent: true, direction: 'top' });

    // Lines
    L.polyline([myLL, actualLL], { color: '#3b82f6', weight: 3, dashArray: '8, 6' }).addTo(resultMap);
    L.polyline([oppLL, actualLL], { color: '#ef4444', weight: 3, dashArray: '8, 6' }).addTo(resultMap);

    resultMap.fitBounds(L.latLngBounds([myLL, oppLL, actualLL]), { padding: [40, 40] });
  }

  function showFinal() {
    stopTimer();
    playWinFanfare();
    if (isMultiplayer) {
        animateScoreCount($('final-total-score'), 0, myMultiScore, 2000);
        let finalStatus = '';
        if (myMultiScore > oppMultiScore) finalStatus = '🏆 CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG!';
        else if (myMultiScore < oppMultiScore) finalStatus = '💀 BẠN ĐÃ THUA CUỘC!';
        else finalStatus = '🤝 HÒA NHAU!';
        $('final-rating').textContent = `${finalStatus} (Đối thủ: ${oppMultiScore})`;
        $('btn-restart').textContent = 'Về trang chủ';
        el.btnMultiRestart.style.display = 'block';
        saveGameResult(myMultiScore, 'Multiplayer');
    } else if (isEndless) {
        animateScoreCount($('final-total-score'), 0, totalScore, 2000);
        $('final-rating').textContent =
            `♾️ ${endlessRounds} vòng • Best Streak 🔥${endlessBestStreak} • Tổng điểm: ${totalScore.toLocaleString()}`;
        $('btn-restart').textContent = 'Chơi lại';
        el.btnMultiRestart.style.display = 'none';
        saveGameResult(totalScore, 'Endless_' + currentMode);
    } else {
        animateScoreCount($('final-total-score'), 0, totalScore, 2000);
        const pct = totalScore / (MAX_SCORE * TOTAL_ROUNDS);
        let rating;
        if (pct >= 0.90) rating = '🥇 Bạn là chuyên gia địa lý Việt Nam!';
        else if (pct >= 0.70) rating = '🥈 Rất giỏi! Bạn biết VN rõ đấy!';
        else if (pct >= 0.50) rating = '🥉 Khá ổn! Luyện thêm nhé!';
        else if (pct >= 0.30) rating = '😅 Cần đi du lịch nhiều hơn!';
        else rating = '🗺️ Hãy khám phá Việt Nam thêm!';
        $('final-rating').textContent = rating;
        $('btn-restart').textContent = 'Chơi lại';
        el.btnMultiRestart.style.display = 'none';
        saveGameResult(totalScore, currentMode);
    }
    showScreen('final');
  }

  function nextRound() {
    if (isMultiplayer) {
        if (!isHost) return;
        if (currentRound >= TOTAL_ROUNDS) {
            sendPeerMessage({ type: 'SHOW_FINAL' });
            showFinal();
        } else {
            sendPeerMessage({ type: 'NEXT_ROUND' });
            currentRound++;
            startMultiplayerRound();
        }
    } else if (isEndless) {
        // Game Over khi hết mạng
        if (endlessLives <= 0) {
            showFinal();
        } else {
            currentRound++;
            showScreen('game');
            loadRound();
        }
    } else {
        if (currentRound >= TOTAL_ROUNDS) {
            showFinal();
        } else {
            currentRound++;
            showScreen('game');
            loadRound();
        }
    }
  }

  function getRating(score) {
    if (score >= 4500) return '🎯 Hoàn hảo!';
    if (score >= 3500) return '🔥 Xuất sắc!';
    if (score >= 2500) return '👍 Tốt lắm!';
    if (score >= 1500) return '🤔 Tạm được...';
    if (score >= 500)  return '😅 Hơi xa rồi!';
    return '💀 Lạc đường rồi!';
  }

  function updateHUD() {
    if (isMultiplayer) {
        $('current-round').textContent = `${currentRound}/${TOTAL_ROUNDS}`;
        $('total-score').textContent   = myMultiScore.toLocaleString();
        $('hud-my-score').textContent  = myMultiScore.toLocaleString();
        $('hud-opp-score').textContent = oppMultiScore.toLocaleString();
    } else if (isEndless) {
        $('current-round').textContent = currentRound;
        $('total-score').textContent = totalScore.toLocaleString();
    } else {
        $('current-round').textContent = currentRound;
        $('total-score').textContent   = totalScore.toLocaleString();
    }
  }

