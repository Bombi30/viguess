// ViGuessr – Game Logic (Mapillary + Leaflet)
(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────────────
  const MAX_SCORE       = 5000;
  const MAX_DIST_KM     = 50;
  const TOTAL_ROUNDS    = 5;

  // ── State ─────────────────────────────────────────────────────────────────
  let mlyToken      = localStorage.getItem('mapillary_client_token') || 'MLY|26275324248758064|7819d63bee8179a083cdd76e20557967';
  let mlyViewer     = null;
  let guessMap      = null;
  let resultMap     = null;
  let guessMarker   = null;
  let resultLine    = null;
  let currentRound  = 1;
  let totalScore    = 0;
  let gameLocations = [];
  let currentLoc    = null;
  let hasGuessed    = false;
  let gameActive    = false;
  let currentMode   = 'Mixed';

  // ── Multiplayer State ─────────────────────────────────────────────────────
  let isMultiplayer = false;
  let peer = null;
  let peerConnection = null;
  let isHost = false;
  let myMultiScore = 0;
  let oppMultiScore = 0;
  let oppGuessData = null; 
  let myGuessTemp = null;
  let heartbeatInterval = null;


  async function warmupMapillary(token) {
      try {
          // Fetch a default image near Hanoi Center to warm up WebGL silently
          const lat = 21.0285;
          const lng = 105.8522;
          const delta = 0.01;
          const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
          const url = `https://graph.mapillary.com/images?access_token=${token}&fields=id&bbox=${bbox}&limit=1`;
          
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.data && data.data.length > 0) {
              const imageId = data.data[0].id;
              console.log("Warming up Mapillary WebGL with image:", imageId);
              if (mlyViewer) {
                  try {
                      await mlyViewer.moveTo(imageId);
                      console.log("Mapillary WebGL warmed up successfully.");
                  } catch (err) {
                      console.warn("Mapillary warmup moveTo failed:", err);
                  }
              }
          }
      } catch (e) {
          console.warn("Mapillary warmup failed:", e);
      }
  }

  function sendPeerMessage(data) {
      if (peerConnection && peerConnection.open) {
          try {
              peerConnection.send(data);
          } catch (e) {
              console.error("Lỗi gửi dữ liệu:", e);
          }
      } else {
          console.warn("Kết nối chưa mở, không thể gửi:", data);
      }
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────
  const $  = id => document.getElementById(id);
  const el = {
    tokenScreen  : $('token-screen'),
    startScreen  : $('start-screen'),
    resultOverlay: $('result-overlay'),
    finalScreen  : $('final-screen'),
    hud          : $('hud'),
    loadingView  : $('loading-view'),
    loadingText  : $('loading-text'),
    btnGuess     : $('btn-guess'),
    btnShowMultiplayer: $('btn-show-multiplayer'),
    lobbyScreen  : $('lobby-screen'),
    btnCreateRoom: $('btn-create-room'),
    btnJoinRoom  : $('btn-join-room'),
    btnLobbyBack : $('btn-lobby-back'),
    roomCodeInput: $('room-code-input'),
    lobbyMenu    : $('lobby-menu'),
    lobbyHostView: $('lobby-host-view'),
    hostRoomCode : $('host-room-code'),
    hostStatus   : $('host-status'),
    hostControls : $('host-controls'),
    btnHostCancel: $('btn-host-cancel'),
    multiScoreHud: $('multi-score-hud'),
    hudMyScore   : $('hud-my-score'),
    hudOppScore  : $('hud-opp-score'),
    multiWaitingText: $('multi-waiting-text'),
    soloResultBadge: $('solo-result-badge'),
    multiResultBadge: $('multi-result-badge'),
    multiMyScore : $('multi-my-score'),
    multiOppScore: $('multi-opp-score'),
    btnMultiRestart: $('btn-multi-restart')
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  function init() {
    bindEvents();
    if (mlyToken) {
      initMapillary(mlyToken);
    } else {
      showScreen('token');
    }
  }

  function initMapillary(token) {
    if (mlyViewer) return;
    
    el.loadingView.style.display = 'flex';
    el.loadingText.textContent = 'Đang khởi tạo Mapillary...';

    try {
      mlyViewer = new mapillary.Viewer({
        accessToken: token,
        container: 'street-view',
        component: {
          cover: false,
          direction: true,
          imagePlane: true,
          sequence: true,
        }
      });

      mlyViewer.on('load', async () => {
        await warmupMapillary(token);
        el.loadingView.style.display = 'none';
        
        // Chỉ về lại màn hình start nếu người chơi đang ở màn hình nhập token
        // Nếu người chơi đã bấm "Tạo phòng" (đang ở Lobby) thì không được gọi showScreen('start') 
        // vì hàm showScreen('start') sẽ kích hoạt cleanupPeer() làm mất kết nối.
        if (el.tokenScreen.classList.contains('active')) {
            showScreen('start');
        }
      });
    } catch (err) {
      console.error(err);
      alert('Không thể khởi tạo Mapillary. Kiểm tra Token của bạn!');
      showScreen('token');
    }
  }

  function showScreen(name) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    el.hud.style.display = 'none';
    if (name === 'token')  el.tokenScreen.classList.add('active');
    if (name === 'start') {
      el.startScreen.classList.add('active');
      cleanupPeer();
    }
    if (name === 'lobby')  el.lobbyScreen.classList.add('active');
    if (name === 'result') el.resultOverlay.classList.add('active');
    if (name === 'final')  el.finalScreen.classList.add('active');
    if (name === 'game')   el.hud.style.display = 'flex';
  }

  // ── Events ────────────────────────────────────────────────────────────────
  function bindEvents() {
    // API Key input
    $('token-input').value = mlyToken;
    $('btn-save-token').addEventListener('click', saveToken);
    $('token-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveToken(); });



    // Solo Mode buttons
    document.querySelectorAll('#solo-modes .btn-mode').forEach(btn =>
      btn.addEventListener('click', () => startGame(btn.dataset.city))
    );

    // Multiplayer triggers
    el.btnShowMultiplayer.addEventListener('click', () => {
      showScreen('lobby');
      el.lobbyMenu.style.display = 'block';
      el.lobbyHostView.style.display = 'none';
    });
    
    el.btnLobbyBack.addEventListener('click', () => showScreen('start'));
    el.btnHostCancel.addEventListener('click', () => { cleanupPeer(); showScreen('start'); });
    
    el.btnCreateRoom.addEventListener('click', createRoom);
    el.btnJoinRoom.addEventListener('click', joinRoom);
    
    // Host Mode buttons
    document.querySelectorAll('.host-mode').forEach(btn =>
      btn.addEventListener('click', () => startMultiplayerGame(btn.dataset.city))
    );

    // Quit
    $('btn-quit').addEventListener('click', () => {
      if (confirm('Thoát game?')) { resetGame(); showScreen('start'); }
    });

    // Submit guess
    el.btnGuess.addEventListener('click', submitGuess);

    // Next round
    $('btn-next').addEventListener('click', nextRound);

    // Restart
    $('btn-restart').addEventListener('click', () => { resetGame(); showScreen('start'); });
    el.btnMultiRestart.addEventListener('click', () => {
        if (isMultiplayer && peerConnection && peerConnection.open) {
            sendPeerMessage({ type: 'GO_TO_LOBBY' });
            goToLobby();
        }
    });
  }

  function saveToken() {
    const val = $('token-input').value.trim();
    if (!val) { alert('Vui lòng nhập Mapillary Client Token!'); return; }
    mlyToken = val;
    localStorage.setItem('mapillary_client_token', val);
    if (!mlyViewer) {
      initMapillary(mlyToken);
    } else {
      mlyViewer.setAccessToken(mlyToken);
      showScreen('start');
    }
  }

  // ── Game Flow ─────────────────────────────────────────────────────────────
  function startGame(mode) {
    currentMode  = mode;
    currentRound = 1;
    totalScore   = 0;
    hasGuessed   = false;
    gameActive   = true;

    isMultiplayer = false;
    el.multiScoreHud.style.display = 'none';
    
    if (mlyViewer) setTimeout(() => mlyViewer.resize(), 50);

    // Pick locations
    const pool = mode === 'Mixed'
      ? [...LOCATIONS]
      : LOCATIONS.filter(l => l.city === mode);

    gameLocations = shuffle([...pool]);

    updateHUD();
    showScreen('game');
    initGuessMap();
    loadRound();
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

  function goToLobby() {
    currentRound = 1;
    myMultiScore = 0;
    oppMultiScore = 0;
    
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
            // We will show hostControls when receiving GUEST_READY
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

        if (data.type === 'START_GAME') {
            const validModes = ['Hanoi', 'Saigon', 'Mixed'];
            if (!validModes.includes(data.mode)) {
                console.error('Invalid game mode received:', data.mode);
                return;
            }
            if (!Array.isArray(data.locations) || data.locations.length !== TOTAL_ROUNDS) {
                console.error('Invalid locations length received:', data.locations);
                return;
            }
            for (const loc of data.locations) {
                if (!loc || typeof loc !== 'object' || typeof loc.id !== 'string') return;
                if (typeof loc.lat !== 'number' || isNaN(loc.lat) || loc.lat < 8 || loc.lat > 24) return;
                if (typeof loc.lng !== 'number' || isNaN(loc.lng) || loc.lng < 102 || loc.lng > 110) return;
                if (typeof loc.name !== 'string' || typeof loc.city !== 'string') return;
            }

            currentMode = data.mode;
            gameLocations = data.locations;
            currentRound = 1;
            myMultiScore = 0;
            oppMultiScore = 0;
            isMultiplayer = true;
            el.multiScoreHud.style.display = 'flex';
            
            showScreen('game');
            initGuessMap();
            startMultiplayerRound();
        } else if (data.type === 'GUESS') {
            const g = data.guess;
            if (!g || typeof g !== 'object') return;
            if (typeof g.lat !== 'number' || isNaN(g.lat) || g.lat < 8 || g.lat > 24) return;
            if (typeof g.lng !== 'number' || isNaN(g.lng) || g.lng < 102 || g.lng > 110) return;
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
            syncMapillaryImage(data.imageId);
        } else if (data.type === 'GO_TO_LOBBY') {
            goToLobby();
        } else if (data.type === 'IMAGE_LOAD_ERROR') {
            if (data.round === currentRound) {
                console.warn("Đối thủ báo lỗi tải ảnh ở vòng:", data.round);
                if (isHost) {
                    el.loadingView.style.display = 'flex';
                    el.loadingText.textContent = '⚠️ Đối thủ không tải được ảnh. Tự động qua vòng tiếp theo...';
                    setTimeout(() => {
                        if (gameActive) nextRound();
                    }, 2500);
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
    currentMode = mode;
    currentRound = 1;
    myMultiScore = 0;
    oppMultiScore = 0;
    isMultiplayer = true;
    el.multiScoreHud.style.display = 'flex';
    
    // Pick exactly 5 random locations for both
    const pool = mode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === mode);
    gameLocations = shuffle([...pool]).slice(0, TOTAL_ROUNDS);
    
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
    if (guessMarker) { guessMap.removeLayer(guessMarker); guessMarker = null; }
    if (resultLine)  { guessMap.removeLayer(resultLine);  resultLine  = null; }
    el.btnGuess.disabled = true;
    el.btnGuess.style.display = 'block';

    if (guessMap) {
      guessMap.setView([16.0, 106.5], 5);
    }

    let badge = '🗺️ Việt Nam';
    if (currentLoc && currentLoc.city === 'Hanoi') badge = '🏛️ Hà Nội';
    else if (currentLoc && currentLoc.city === 'Saigon') badge = '🌆 Sài Gòn';
    $('city-badge').textContent = badge;
  }

  function resetGame() {
    gameActive = false;
    currentRound = 1;
    totalScore   = 0;
    if (guessMarker) { guessMap && guessMap.removeLayer(guessMarker); guessMarker = null; }
    if (resultLine)  { guessMap && guessMap.removeLayer(resultLine);  resultLine  = null; }
    el.btnGuess.disabled = true;
    $('total-score').textContent   = '0';
    $('current-round').textContent = '1';
  }

  function loadRound() {
    if (currentRound > TOTAL_ROUNDS) { showFinal(); return; }

    // If we run out of locations in the pool, reshuffle
    if (currentRound > gameLocations.length) {
      const pool = currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode);
      gameLocations.push(...shuffle([...pool]));
    }

    currentLoc = gameLocations[currentRound - 1];
    hasGuessed = false;

    resetRoundUI();
    updateHUD();

    // Load Street View
    el.loadingView.style.display = 'flex';
    el.loadingText.textContent   = 'Đang tải ảnh đường phố...';
    loadSVImage(currentLoc);
  }

  async function loadSVImage(loc, attempt = 1) {
    el.loadingView.style.display = 'flex';
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

    if (!cachedIds || cachedIds.length === 0) {
      el.loadingText.textContent = 'Đang mở rộng tìm kiếm ảnh quanh đây...';
      
      const deltas = [0.0005, 0.002, 0.01]; // Tương đương ~50m, ~200m, ~1km
      let foundData = null;

      for (const delta of deltas) {
          const bbox = `${loc.lng - delta},${loc.lat - delta},${loc.lng + delta},${loc.lat + delta}`;
          const url = `https://graph.mapillary.com/images?access_token=${mlyToken}&fields=id,geometry,is_pano&bbox=${bbox}&limit=50`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout cho mỗi lần fetch

          try {
              const res = await fetch(url, { signal: controller.signal });
              clearTimeout(timeoutId);
              const data = await res.json();
              
              if (data && data.data && data.data.length > 0) {
                  foundData = data.data;
                  break; // Tìm thấy ảnh, thoát vòng lặp
              }
          } catch (err) {
              clearTimeout(timeoutId);
              console.warn(`Fetch error for delta ${delta}:`, err);
          }
      }

      if (!foundData) {
          console.error('Mapillary error: No images found after expanding search radius');
          el.loadingText.textContent = '⚠️ Không tìm thấy ảnh Mapillary tại đây, đang bỏ qua...';
          setTimeout(() => { if (gameActive) nextRound(); }, 2500);
          return;
      }
      
      let panos = foundData.filter(img => img.is_pano === true);
      let flats = foundData.filter(img => img.is_pano !== true);
      
      const actualLL = L.latLng(loc.lat, loc.lng);
      const sortByDist = (a, b) => {
         const da = actualLL.distanceTo(L.latLng(a.geometry.coordinates[1], a.geometry.coordinates[0]));
         const db = actualLL.distanceTo(L.latLng(b.geometry.coordinates[1], b.geometry.coordinates[0]));
         return da - db;
      };
      panos.sort(sortByDist);
      flats.sort(sortByDist);

      // Trộn ngẫu nhiên: ưu tiên lấy top 7 pano và top 3 flat gần nhất
      const mixed = [...panos.slice(0, 7), ...flats.slice(0, 3)];
      cachedIds = mixed.map(img => img.id);
      
      // Lưu mảng ID vào Cache
      localStorage.setItem('mly_cache_v2_' + loc.id, JSON.stringify({
        ids: cachedIds,
        ts: Date.now()
      }));
    }

    // Chọn ngẫu nhiên 1 góc ảnh (có thể là flat hoặc 360) từ mảng cache
    const randomId = cachedIds[Math.floor(Math.random() * cachedIds.length)];

    if (!mlyViewer) {
        console.error("mlyViewer chưa sẵn sàng");
        return;
    }

    // Delay nhỏ để giải phóng luồng chính trước khi WebGL xử lý tải ảnh (tránh treo DataConnection)
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const moveToPromise = mlyViewer.moveTo(randomId);
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout loading image")), 10000)
      );

      await Promise.race([moveToPromise, timeoutPromise]);
      el.loadingView.style.display = 'none';
      if (isMultiplayer && isHost) {
          sendPeerMessage({ type: 'SYNC_IMAGE', imageId: randomId });
      }
    } catch (err) {
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
        el.loadingText.textContent = '⚠️ Ảnh này bị lỗi. Tự động bỏ qua...';
        
        if (!isMultiplayer || isHost) {
            setTimeout(() => { if (gameActive) nextRound(); }, 2000);
        } else {
            el.loadingText.textContent = '⚠️ Lỗi tải ảnh. Đang báo cho Chủ phòng...';
            if (peerConnection && peerConnection.open) {
                sendPeerMessage({ type: 'IMAGE_LOAD_ERROR', round: currentRound });
            }
        }
      }
    }
  }

  async function syncMapillaryImage(imageId, attempt = 1) {
      if (!mlyViewer) {
          console.warn("Viewer chưa sẵn sàng, thử lại sau 1s...");
          setTimeout(() => syncMapillaryImage(imageId, attempt), 1000);
          return;
      }

      // Delay nhỏ để giải phóng luồng chính trước khi gọi WebGL API
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
          const moveToPromise = mlyViewer.moveTo(imageId);
          const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Timeout loading image")), 12000)
          );

          await Promise.race([moveToPromise, timeoutPromise]);
          el.loadingView.style.display = 'none';
      } catch (err) {
          console.error(`Lỗi đồng bộ ảnh Mapillary (lần thử ${attempt}):`, err);
          if (attempt < 2) {
              el.loadingText.textContent = '⚠️ Thử kết nối lại ảnh...';
              setTimeout(() => syncMapillaryImage(imageId, attempt + 1), 2000);
          } else {
              el.loadingText.textContent = '⚠️ Lỗi đồng bộ ảnh! Đang báo cho Chủ phòng...';
              if (peerConnection && peerConnection.open) {
                  sendPeerMessage({ type: 'IMAGE_LOAD_ERROR', round: currentRound });
              }
          }
      }
  }

  function submitGuess() {
    if (!guessMarker || hasGuessed) return;
    hasGuessed = true;
    el.btnGuess.disabled = true;

    const guessLL  = guessMarker.getLatLng();
    const actualLL = L.latLng(currentLoc.lat, currentLoc.lng);
    const distKm   = guessLL.distanceTo(actualLL) / 1000;
    const score    = calcScore(distKm);

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
      
      $('result-title').textContent = myGuessTemp.score > oppGuessData.score ? 'Thắng vòng này!' : (myGuessTemp.score < oppGuessData.score ? 'Thua vòng này!' : 'Hòa!');
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
      initMultiplayerResultMap(myGuessTemp, oppGuessData);
  }

  function calcScore(distKm) {
    const max = currentMode === 'Mixed' ? 1800 : 50;
    if (distKm >= max) return 0;
    
    // Sử dụng công thức đường cong lõm để tính điểm mượt mà hơn
    // Tối đa 5000đ khi khoảng cách là 0
    let score = MAX_SCORE * Math.pow((max - distKm) / max, 2);
    return Math.round(score);
  }

  function showResult(distKm, score, guessLL, actualLL) {
    el.soloResultBadge.style.display = 'block';
    el.multiResultBadge.style.display = 'none';
    document.querySelector('.result-stats').style.display = 'flex';
    $('btn-next').style.display = 'block';

    $('result-score').textContent    = score.toLocaleString();
    $('result-score2').textContent   = score.toLocaleString();
    $('result-title').textContent    = getRating(score);
    $('result-distance').textContent = distKm < 1
      ? `${Math.round(distKm * 1000)} m`
      : `${distKm.toFixed(1)} km`;
    $('result-landmark-name').textContent = currentLoc.name;
    $('result-landmark-desc').textContent = currentLoc.desc || '';

    $('btn-next-text').textContent = 'Tiếp tục →';

    updateHUD();
    showScreen('result');

    // Build the result map showing guess vs actual
    initResultMap(guessLL, actualLL, distKm);
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

  function showFinal() {
    if (isMultiplayer) {
        $('final-total-score').textContent = myMultiScore.toLocaleString();
        let finalStatus = '';
        if (myMultiScore > oppMultiScore) finalStatus = '🏆 CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG!';
        else if (myMultiScore < oppMultiScore) finalStatus = '💀 BẠN ĐÃ THUA CUỘC!';
        else finalStatus = '🤝 HÒA NHAU!';
        $('final-rating').textContent = `${finalStatus} (Đối thủ: ${oppMultiScore})`;
        $('btn-restart').textContent = 'Về trang chủ';
        el.btnMultiRestart.style.display = 'block';
    } else {
        $('final-total-score').textContent = totalScore.toLocaleString();
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
    }
    showScreen('final');
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
    } else {
        $('current-round').textContent = currentRound;
        $('total-score').textContent   = totalScore.toLocaleString();
    }
  }

  // ── Leaflet Guess Map ─────────────────────────────────────────────────────
  function initGuessMap() {
    if (guessMap) { guessMap.remove(); guessMap = null; }

    guessMap = L.map('map', {
      center: [16.0, 106.5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(guessMap);

    L.control.zoom({ position: 'bottomright' }).addTo(guessMap);

    guessMap.on('click', e => {
      if (hasGuessed || !gameActive) return;
      if (el.loadingView.style.display === 'flex') return; // Prevent blind guessing while loading

      if (guessMarker) guessMap.removeLayer(guessMarker);
      guessMarker = L.marker(e.latlng, {
        icon: L.divIcon({
          className: '', iconSize: [32, 32], iconAnchor: [16, 32],
          html: '<div class="map-pin guess">🎯</div>',
        }),
      }).addTo(guessMap);
      el.btnGuess.disabled = false;
    });
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
