  // ── Timer Logic ───────────────────────────────────────────────────────────
  function startTimer() {
    stopTimer();
    timeLeft = roundTimerLimit;
    timerActive = true;
    updateTimerHUD();
    
    timerInterval = setInterval(() => {
      if (!timerActive) return;
      timeLeft--;
      
      updateTimerHUD();
      
      if (isMultiplayer && isHost) {
        sendPeerMessage({ type: 'SYNC_TIMER', timeLeft, imageId: currentImageId });
      }
      
      if (timeLeft <= 5 && timeLeft > 0) {
        if (el.timerHud) el.timerHud.classList.add('timer-low');
        if (typeof playTick === 'function') playTick();
      } else {
        if (el.timerHud) el.timerHud.classList.remove('timer-low');
      }
      
      if (timeLeft <= 0) {
        stopTimer();
        autoSubmitGuess();
      }
    }, 1000);
  }

  function stopTimer() {
    timerActive = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (el.timerHud) {
      el.timerHud.classList.remove('timer-low');
    }
  }

  function updateTimerHUD() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const valSpan = $('timer-value');
    if (valSpan) {
      valSpan.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
  }

  function autoSubmitGuess() {
    if (hasGuessed) return;
    if (!guessMarker) {
      guessMarker = L.marker([0, 0]);
    }
    submitGuess();
  }

  // ── Leaderboard Logic (localStorage) ──────────────────────────────────────
  function getModeDisplayName(mode) {
    const mapping = {
      'Hanoi': '🏛️ Hà Nội',
      'Saigon': '🌆 Sài Gòn',
      'DaNang': '🌉 Đà Nẵng',
      'DaLat': '🌸 Đà Lạt',
      'HoiAn': '⛩️ Hội An',
      'VungTau': '🏖️ Vũng Tàu',
      'NhaTrang': '🏝️ Nha Trang',
      'SaPa': '🏔️ Sa Pa',
      'Mixed': '🔀 Toàn Quốc',
      'Endless': '♾️ Vô Tận',
      'Endless_Hanoi': '♾️ Vô Tận - Hà Nội',
      'Endless_Saigon': '♾️ Vô Tận - Sài Gòn',
      'Endless_DaNang': '♾️ Vô Tận - Đà Nẵng',
      'Endless_Mixed': '♾️ Vô Tận - Toàn Quốc',
      'Multiplayer': '⚔️ Đối Kháng',
      'Đối Kháng': '⚔️ Đối Kháng'
    };
    return mapping[mode] || mode;
  }

  function saveGameResult(score, mode) {
    try {
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem('viguess_history') || '[]');
      } catch (e) {
        history = [];
      }
      if (!Array.isArray(history)) history = [];
      
      const newGame = {
        score: score,
        mode: mode,
        date: new Date().toLocaleDateString('vi-VN', { 
          day: 'numeric', 
          month: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      history.unshift(newGame);
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      localStorage.setItem('viguess_history', JSON.stringify(history));
      renderLeaderboards();
    } catch (e) {
      console.error("Failed to save game result:", e);
    }
  }

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, m => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return map[m];
    });
  }

  function renderLeaderboards() {
    try {
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem('viguess_history') || '[]');
      } catch (e) {
        history = [];
      }
      if (!Array.isArray(history)) history = [];

      const startSection = $('start-leaderboard');
      const finalSection = $('final-leaderboard');
      
      if (history.length === 0) {
        if (startSection) startSection.style.display = 'none';
        if (finalSection) finalSection.style.display = 'none';
        return;
      }
      
      if (startSection) startSection.style.display = 'block';
      if (finalSection) finalSection.style.display = 'block';
      
      const startList = $('start-leaderboard-list');
      const finalList = $('final-leaderboard-list');
      if (startList) startList.textContent = '';
      if (finalList) finalList.textContent = '';

      history.forEach((game, idx) => {
        const createItem = () => {
          const div = document.createElement('div');
          div.className = 'leaderboard-item';
          
          const rank = document.createElement('span');
          rank.className = 'leaderboard-rank';
          rank.textContent = '#' + (idx + 1);
          
          const mode = document.createElement('span');
          mode.className = 'leaderboard-mode';
          mode.textContent = getModeDisplayName(game.mode);
          
          const score = document.createElement('span');
          score.className = 'leaderboard-score';
          score.textContent = game.score.toLocaleString();
          
          const date = document.createElement('span');
          date.className = 'leaderboard-date';
          date.textContent = game.date;
          
          div.appendChild(rank);
          div.appendChild(mode);
          div.appendChild(score);
          div.appendChild(date);
          return div;
        };
        
        if (startList) startList.appendChild(createItem());
        if (finalList) finalList.appendChild(createItem());
      });
    } catch (e) {
      console.error("Failed to render leaderboards:", e);
    }
  }

  // ── Leaflet Guess Map ─────────────────────────────────────────────────────
  function initGuessMap() {
    if (guessMap) {
      if (guessMarker) { guessMap.removeLayer(guessMarker); guessMarker = null; }
      if (resultLine)  { guessMap.removeLayer(resultLine);  resultLine  = null; }
      guessMap.setView([16.0, 106.5], 5);
      return;
    }

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

    // Setup ResizeObserver for guessMap
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        guessMap.invalidateSize();
      });
      const mapEl = document.getElementById('map');
      if (mapEl) {
        resizeObserver.observe(mapEl);
      }
    }

    // Protect active state during dragging
    guessMap.on('dragstart', () => {
      isMapInteracting = true;
      const mapContainer = $('map-container');
      if (mapContainer) {
        mapContainer.classList.add('active');
      }
    });

    guessMap.on('dragend', () => {
      isMapInteracting = false;
      const mapContainer = $('map-container');
      if (mapContainer) {
        const hasHover = window.matchMedia('(hover: hover)').matches;
        if (hasHover && !mapContainer.matches(':hover')) {
          mapContainer.classList.remove('active');
        }
      }
    });

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
      if (typeof playTick === 'function') playTick();
      el.btnGuess.disabled = false;
      if (window.gsap && el.btnGuess) {
        gsap.killTweensOf(el.btnGuess);
        gsap.fromTo(el.btnGuess, 
          { scale: 1 }, 
          { scale: 1.05, duration: 0.5, repeat: -1, yoyo: true, ease: "sine.inOut" }
        );
      }
    });
  }

