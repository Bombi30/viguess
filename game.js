// ViGuessr – Game Logic (Mapillary + Leaflet)
(function () {
  'use strict';

  // ── Session Logger (xóa khi release) ─────────────────────────────────────
  (function setupLogger() {
    const logs = [];
    const t0 = Date.now();

    function log(type, data) {
      logs.push({ t: Date.now() - t0, type, ...data });
    }

    // Patch fetch — track từng Mapillary API call
    const _fetch = window.fetch;
    window.fetch = async function(url, opts) {
      if (typeof url === 'string' && url.includes('graph.mapillary.com/images')) {
        const bbox = url.match(/bbox=([^&]+)/)?.[1] ?? '';
        const t = Date.now();
        log('fetch_start', { url: url.substring(0, 120), bbox });
        try {
          const res = await _fetch(url, opts);
          const clone = res.clone();
          clone.json().then(d => {
            log('fetch_done', {
              bbox,
              status: res.status,
              count: d?.data?.length ?? 0,
              ms: Date.now() - t
            });
          }).catch(() => log('fetch_parse_err', { ms: Date.now() - t }));
          return res;
        } catch(e) {
          log('fetch_error', { bbox, error: e.message, ms: Date.now() - t });
          throw e;
        }
      }
      return _fetch(url, opts);
    };

    // Patch moveTo — track WebGL load time
    const waitViewer = setInterval(() => {
      if (typeof mlyViewer !== 'undefined' && mlyViewer?.moveTo) {
        clearInterval(waitViewer);
        const _moveTo = mlyViewer.moveTo.bind(mlyViewer);
        mlyViewer.moveTo = async function(imageId) {
          const t = Date.now();
          log('moveto_start', { imageId });
          try {
            const r = await _moveTo(imageId);
            log('moveto_done', { imageId, ms: Date.now() - t });
            return r;
          } catch(e) {
            log('moveto_error', { imageId, error: e.message, ms: Date.now() - t });
            throw e;
          }
        };
      }
    }, 500);

    // Export button — nổi góc dưới phải
    const btn = document.createElement('button');
    btn.textContent = '📋 Export Log';
    btn.style.cssText = `
      position:fixed; bottom:12px; right:12px; z-index:99999;
      background:#1a1a2e; color:#fff; border:1px solid #444;
      padding:6px 12px; border-radius:20px; font-size:12px;
      cursor:pointer; font-family:monospace;
    `;
    btn.onclick = () => {
      const json = JSON.stringify({ 
        generated: new Date().toISOString(),
        totalLocations: typeof LOCATIONS !== 'undefined' ? LOCATIONS.length : '?',
        sessionDuration: ((Date.now() - t0) / 1000).toFixed(1) + 's',
        events: logs 
      }, null, 2);

      // Download file
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `viguess_log_${Date.now()}.json`;
      a.click();

      btn.textContent = '✅ Đã tải!';
      setTimeout(() => btn.textContent = '📋 Export Log', 2000);
    };
    document.body.appendChild(btn);

    // Expose để game.js gọi được khi loadRound
    window.__vlog = log;
  })();
  // ── Config ────────────────────────────────────────────────────────────────
  const MAX_SCORE       = 5000;
  const MAX_DIST_KM     = 50;
  const TOTAL_ROUNDS    = 5;
  const ENDLESS_LIVES              = 3;     // số mạng trong Endless
  const ENDLESS_STREAK_THRESHOLD   = 2000;  // điểm tối thiểu để duy trì streak

  // ── State ─────────────────────────────────────────────────────────────────
  const DEFAULT_TOKENS = [
    'MLY|26275324248758064|7819d63bee8179a083cdd76e20557967',
    'MLY|26662189923404302|a46d03e9defbc7f605a2b05306f9dff2',
    'MLY|27778953475040760|b786b895882aee941ccc592124104490',
    'MLY|27070253085941789|2a08818d3f6a3fff2f80a131d92a397a',
    'MLY|27226548056949522|90ad5dcda0bb2725ac990af165ca7500',
    'MLY|27534714996120672|5b9cc69d341bf1c8982162c8a677cf1b',
    'MLY|27025498763758281|91078475dcc78870aab68328a2f157e5',
    'MLY|27431447656550246|7b781f2a8344deea7d6acbf4dc8ec8b2',
    'MLY|27042089485483851|0db89fa99829052f91d9ef81b7e33948',
    'MLY|27193082473649436|3d7da71561a4257e1698eb5f24670102'
  ];
  let tokenIndex = 0;
  function nextToken() {
    const token = DEFAULT_TOKENS[tokenIndex % DEFAULT_TOKENS.length];
    tokenIndex++;
    return token;
  }
  let mlyToken = localStorage.getItem('mapillary_client_token') || DEFAULT_TOKENS[0];
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

  const CITY_MAX_DISTANCES = {
    'Hanoi': 50,
    'Saigon': 50,
    'DaNang': 30,
    'DaLat': 30,
    'HoiAn': 20,
    'VungTau': 30,
    'NhaTrang': 30,
    'SaPa': 20,
    'Mixed': 1300
  };
  let retryAction = null;

  // ── Endless Mode State ─────────────────────────────────────────────────────
  let isEndless         = false;
  let endlessStreak     = 0;   // streak hiện tại
  let endlessLives      = ENDLESS_LIVES; // mạng còn lại
  let endlessBestStreak = 0;   // streak cao nhất trong session này
  let endlessRounds     = 0;   // số vòng đã chơi

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

  // ── Timer State ───────────────────────────────────────────────────────────
  let timerInterval = null;
  let timeLeft      = 180;
  let timerActive   = false;
  let currentGameSessionId = 0;



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

  // ── Sound Synthesizer (Web Audio API) ─────────────────────────────────────
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTick() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Failed to play tick sound:", e);
    }
  }

  function createNoiseBuffer(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function playExplosion(delay = 0) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      
      // 1. Boom
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.8);
      
      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.start(now);
      osc.stop(now + 0.8);
      
      // 2. Hiss
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 1.2);
      
      const noiseGain = ctx.createGain();
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      
      noise.start(now);
      noise.stop(now + 1.2);
      
      // 3. Crackles
      for (let i = 0; i < 6; i++) {
        const crackleTime = now + 0.2 + Math.random() * 0.5;
        const cOsc = ctx.createOscillator();
        const cGain = ctx.createGain();
        cOsc.connect(cGain);
        cGain.connect(ctx.destination);
        
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(1200 + Math.random() * 800, crackleTime);
        
        cGain.gain.setValueAtTime(0.02, crackleTime);
        cGain.gain.exponentialRampToValueAtTime(0.001, crackleTime + 0.03);
        
        cOsc.start(crackleTime);
        cOsc.stop(crackleTime + 0.03);
      }
    } catch (e) {
      console.warn("Failed to play explosion:", e);
    }
  }

  function playWinFanfare() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.15 },
        { freq: 783.99, time: 0.3 },
        { freq: 1046.50, time: 0.45, duration: 0.6 }
      ];
      
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
        
        const dur = note.duration || 0.2;
        gainNode.gain.setValueAtTime(0, ctx.currentTime + note.time);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + note.time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + dur);
        
        osc.start(ctx.currentTime + note.time);
        osc.stop(ctx.currentTime + note.time + dur);
      });
      
      playExplosion(0);
      playExplosion(0.35);
      playExplosion(0.7);
      playExplosion(1.1);
    } catch (e) {
      console.warn("Failed to play fanfare:", e);
    }
  }

  // ── Timer Logic ───────────────────────────────────────────────────────────
  function startTimer() {
    stopTimer();
    timeLeft = 180;
    timerActive = true;
    updateTimerHUD();
    
    timerInterval = setInterval(() => {
      if (!timerActive) return;
      timeLeft--;
      
      updateTimerHUD();
      
      if (isMultiplayer && isHost) {
        sendPeerMessage({ type: 'SYNC_TIMER', timeLeft });
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
      
      let html = '';
      history.forEach((game, idx) => {
        html += `
          <div class="leaderboard-item">
            <span class="leaderboard-rank">#${idx + 1}</span>
            <span class="leaderboard-mode">${getModeDisplayName(game.mode)}</span>
            <span class="leaderboard-score">${game.score.toLocaleString()}</span>
            <span class="leaderboard-date">${game.date}</span>
          </div>
        `;
      });
      
      const startList = $('start-leaderboard-list');
      const finalList = $('final-leaderboard-list');
      if (startList) startList.innerHTML = html;
      if (finalList) finalList.innerHTML = html;
    } catch (e) {
      console.error("Failed to render leaderboards:", e);
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
    btnMultiRestart: $('btn-multi-restart'),
    timerHud     : $('timer-hud'),
    btnRetryImg  : $('btn-retry-img')
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  function init() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('mly_empty_') || k.startsWith('mly_good_')) {
        localStorage.removeItem(k);
      }
    });
    bindEvents();
    renderLeaderboards();
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
          sequence: true
        }
      });

      mlyViewer.on('load', async () => {
        el.loadingView.style.display = 'none';
        
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
      renderLeaderboards();
    }
    if (name === 'lobby')  el.lobbyScreen.classList.add('active');
    if (name === 'result') el.resultOverlay.classList.add('active');
    if (name === 'final')  el.finalScreen.classList.add('active');
    if (name === 'game')   el.hud.style.display = 'flex';
  }

  // ── Events ────────────────────────────────────────────────────────────────
  function bindEvents() {
    $('token-input').value = mlyToken;
    $('btn-save-token').addEventListener('click', saveToken);
    $('token-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveToken(); });

    document.querySelectorAll('#solo-modes .btn-mode').forEach(btn =>
      btn.addEventListener('click', () => {
        getAudioContext();
        startEndlessGame(btn.dataset.city);
      })
    );

    el.btnShowMultiplayer.addEventListener('click', () => {
      showScreen('lobby');
      el.lobbyMenu.style.display = 'block';
      el.lobbyHostView.style.display = 'none';
    });
    
    el.btnLobbyBack.addEventListener('click', () => showScreen('start'));
    el.btnHostCancel.addEventListener('click', () => { cleanupPeer(); showScreen('start'); });
    
    el.btnCreateRoom.addEventListener('click', () => { getAudioContext(); createRoom(); });
    el.btnJoinRoom.addEventListener('click', () => { getAudioContext(); joinRoom(); });
    
    document.querySelectorAll('.host-mode').forEach(btn =>
      btn.addEventListener('click', () => { getAudioContext(); startMultiplayerGame(btn.dataset.city); })
    );

    const mapContainer = $('map-container');
    if (mapContainer) {
      mapContainer.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'width' || e.propertyName === 'height') {
          if (guessMap) {
            guessMap.invalidateSize();
          }
        }
      });
    }

    $('btn-quit').addEventListener('click', () => {
      if (confirm('Thoát game?')) { resetGame(); showScreen('start'); }
    });

    el.btnGuess.addEventListener('click', submitGuess);

    $('btn-next').addEventListener('click', nextRound);

    $('btn-restart').addEventListener('click', () => { resetGame(); showScreen('start'); });
    el.btnMultiRestart.addEventListener('click', () => {
        if (isMultiplayer && peerConnection && peerConnection.open) {
            sendPeerMessage({ type: 'GO_TO_LOBBY' });
            goToLobby();
        }
    });

    if (el.btnRetryImg) {
      el.btnRetryImg.addEventListener('click', () => {
        if (retryAction) {
          el.btnRetryImg.style.display = 'none';
          const spinner = el.loadingView.querySelector('.spinner');
          if (spinner) spinner.style.display = 'block';
          retryAction();
        }
      });
    }
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
    const pool = (mode === 'Mixed'
      ? [...LOCATIONS]
      : LOCATIONS.filter(l => l.city === mode))
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
        const deltas = [0.002, 0.008, 0.02];
        let hasTriedAndFoundNone = true;
        let hasNetworkError = false;

        for (const delta of deltas) {
          const bbox = `${(loc.lng - delta).toFixed(6)},${(loc.lat - delta).toFixed(6)},${(loc.lng + delta).toFixed(6)},${(loc.lat + delta).toFixed(6)}`;
          const url = `https://graph.mapillary.com/images?access_token=${nextToken()}&fields=id,geometry,is_pano&bbox=${bbox}&limit=100`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) {
              hasNetworkError = true;
              hasTriedAndFoundNone = false;
              if (res.status >= 500) break;
              continue;
            }
            const data = await res.json();
            if (data && data.data && data.data.length > 0) {
              hasTriedAndFoundNone = false;
              let panos = data.data.filter(img => img.is_pano === true);
              let flats = data.data.filter(img => img.is_pano !== true);
              const actualLL = L.latLng(loc.lat, loc.lng);
              const sortByDist = (a, b) =>
                actualLL.distanceTo(L.latLng(a.geometry.coordinates[1], a.geometry.coordinates[0])) -
                actualLL.distanceTo(L.latLng(b.geometry.coordinates[1], b.geometry.coordinates[0]));
              panos.sort(sortByDist);
              flats.sort(sortByDist);

              ids = [...panos.slice(0, 7), ...flats.slice(0, 3)].map(img => img.id);
              localStorage.setItem('mly_cache_v2_' + loc.id, JSON.stringify({ ids, ts: Date.now() }));
              console.log(`[prefetchSingle] Cached ${ids.length} ảnh cho: ${loc.name}`);
              break;
            }
          } catch(e) {
            clearTimeout(timeoutId);
            hasNetworkError = true;
            hasTriedAndFoundNone = false;
            break;
          }
        }

        if (hasTriedAndFoundNone && !hasNetworkError) {
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

    const pool = (currentMode === 'Mixed'
      ? [...LOCATIONS]
      : LOCATIONS.filter(l => l.city === currentMode))
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
            const validModes = ['Hanoi', 'Saigon', 'DaNang', 'DaLat', 'HoiAn', 'VungTau', 'NhaTrang', 'SaPa', 'Mixed'];
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

            currentGameSessionId++;
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
                        loadRound();
                    }, 1500);
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
    el.multiScoreHud.style.display = 'flex';
    
    // Pick exactly 5 random locations for both, filtering out empty ones
    const pool = (mode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === mode))
                 .filter(l => !localStorage.getItem('mly_empty_' + l.id));
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
    // In endless mode we never stop for TOTAL_ROUNDS; in classic we do
    if (!isEndless && currentRound > TOTAL_ROUNDS) { showFinal(); return; }

    // If we run out of locations in the pool, reshuffle
    if (currentRound > gameLocations.length) {
      const pool = (currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode))
                   .filter(l => !localStorage.getItem('mly_empty_' + l.id));
      gameLocations.push(...shuffleLocations([...pool]));
    }

    currentLoc = gameLocations[currentRound - 1];
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
      
      // Optimize: Use fewer, larger bounding box steps. 0.002 (approx. 200m) finds images immediately for ~95% of locations.
      // 0.008 (approx. 800m) covers the rest. Client-side sorting guarantees we still pick the closest image.
      const deltas = [0.002, 0.008, 0.02];
      let foundData = null;
      let hasNetworkError = false;

      for (const delta of deltas) {
          if (sessionId !== currentGameSessionId) return;
          const bbox = `${(loc.lng - delta).toFixed(6)},${(loc.lat - delta).toFixed(6)},${(loc.lng + delta).toFixed(6)},${(loc.lat + delta).toFixed(6)}`;
          const url = `https://graph.mapillary.com/images?access_token=${nextToken()}&fields=id,geometry,is_pano&bbox=${bbox}&limit=100`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
              const res = await fetch(url, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (sessionId !== currentGameSessionId) return;
              if (res.status === 200) {
                  const data = await res.json();
                  if (sessionId !== currentGameSessionId) return;
                  if (data && data.data && data.data.length > 0) {
                      console.log(`Successfully found ${data.data.length} images at delta ${delta}`);
                      foundData = data.data;
                      break;
                  }
              } else {
                  console.warn(`Mapillary API non-200 status (${res.status}) at delta ${delta}`);
                  hasNetworkError = true;
                  if (res.status >= 500) break;
              }
          } catch (err) {
              clearTimeout(timeoutId);
              if (sessionId !== currentGameSessionId) return;
              console.warn(`Fetch error at delta ${delta}:`, err);
              hasNetworkError = true;
              break;
          }
      }

      if (!foundData) {
          console.error('Mapillary error: No images found or fetch failed');
          if (!isMultiplayer) {
              if (!hasNetworkError) {
                  try {
                      localStorage.setItem('mly_empty_' + loc.id, 'true');
                      localStorage.removeItem('mly_good_' + loc.id);
                  } catch(e){}
                  console.log(`[loadSVImage] Blacklisted empty location: ${loc.name}`);
                  el.loadingText.textContent = '⚠️ Khu vực này không có ảnh, đang tìm điểm khác...';
              } else {
                  el.loadingText.textContent = '⚠️ Máy chủ Mapillary đang lỗi hoặc quá tải, đang thử lại...';
              }
              setTimeout(() => {
                  if (sessionId !== currentGameSessionId) return;
                  const pool = (currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode))
                               .filter(l => !localStorage.getItem('mly_empty_' + l.id));
                  gameLocations[currentRound - 1] = pool[Math.floor(Math.random() * pool.length)];
                  loadRound();
              }, hasNetworkError ? 2000 : 1000);
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
                      const pool = (currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode))
                                   .filter(l => !localStorage.getItem('mly_empty_' + l.id));
                      const newLoc = pool[Math.floor(Math.random() * pool.length)];
                      gameLocations[currentRound - 1] = newLoc;
                      sendPeerMessage({ type: 'SWAP_LOCATION', round: currentRound, newLocation: newLoc });
                      loadRound();
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
      const moveToPromise = mlyViewer.moveTo(randomId);
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout loading image")), 8000)
      );

      await Promise.race([moveToPromise, timeoutPromise]);
      if (sessionId !== currentGameSessionId) return;
      el.loadingView.style.display = 'none';
      try { localStorage.setItem('mly_good_' + loc.id, '1'); } catch(e) {}
      if (isMultiplayer && isHost) {
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
        
        if (!isMultiplayer) {
            el.loadingText.textContent = '⚠️ Ảnh này bị lỗi tải quá lâu, đang đổi điểm khác...';
            setTimeout(() => {
                if (sessionId !== currentGameSessionId) return;
                const pool = currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode);
                gameLocations[currentRound - 1] = pool[Math.floor(Math.random() * pool.length)];
                loadRound();
            }, 1000);
        } else {
            const spinner = el.loadingView.querySelector('.spinner');
            if (spinner) spinner.style.display = 'none';
            el.loadingText.textContent = '⚠️ Ảnh này bị lỗi hoặc tải quá lâu.';
            if (el.btnRetryImg) {
                el.btnRetryImg.textContent = 'Thử ảnh khác';
                el.btnRetryImg.style.display = 'inline-block';
            }
            retryAction = () => {
                if (sessionId !== currentGameSessionId) return;
                loadSVImage(loc, 1);
            };
            
            if (!isHost) {
                if (peerConnection && peerConnection.open) {
                    sendPeerMessage({ type: 'IMAGE_LOAD_ERROR', round: currentRound });
                }
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
      const deltas = [0.002, 0.008, 0.02];
      for (const delta of deltas) {
        if (sessionId !== currentGameSessionId) return;
        const bbox = `${(nextLoc.lng - delta).toFixed(6)},${(nextLoc.lat - delta).toFixed(6)},${(nextLoc.lng + delta).toFixed(6)},${(nextLoc.lat + delta).toFixed(6)}`;
        const url = `https://graph.mapillary.com/images?access_token=${nextToken()}&fields=id,geometry,is_pano&bbox=${bbox}&limit=100`;
        
        const res = await fetch(url);
        if (sessionId !== currentGameSessionId) return;
        if (!res.ok) continue;
        const data = await res.json();
        if (sessionId !== currentGameSessionId) return;
        if (!data?.data?.length) continue;

        let panos = data.data.filter(img => img.is_pano === true);
        let flats = data.data.filter(img => img.is_pano !== true);
        const actualLL = L.latLng(nextLoc.lat, nextLoc.lng);
        const sortByDist = (a, b) =>
          actualLL.distanceTo(L.latLng(a.geometry.coordinates[1], a.geometry.coordinates[0])) -
          actualLL.distanceTo(L.latLng(b.geometry.coordinates[1], b.geometry.coordinates[0]));
        panos.sort(sortByDist);
        flats.sort(sortByDist);

        const ids = [...panos.slice(0, 7), ...flats.slice(0, 3)].map(img => img.id);
        localStorage.setItem('mly_cache_v2_' + nextLoc.id, JSON.stringify({ ids, ts: Date.now() }));
        console.log(`[Prefetch] Đã cache ${ids.length} ảnh cho: ${nextLoc.name}`);
        break;
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
          const deltas = [0.002, 0.008, 0.02];
          let hasTriedAndFoundNone = true;
          let hasNetworkError = false;

          for (const delta of deltas) {
            if (sessionId !== currentGameSessionId) return;
            const bbox = `${(loc.lng - delta).toFixed(6)},${(loc.lat - delta).toFixed(6)},${(loc.lng + delta).toFixed(6)},${(loc.lat + delta).toFixed(6)}`;
            const url = `https://graph.mapillary.com/images?access_token=${nextToken()}&fields=id,geometry,is_pano&bbox=${bbox}&limit=100`;
            
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              const res = await fetch(url, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (sessionId !== currentGameSessionId) return;
              if (!res.ok) {
                hasNetworkError = true;
                hasTriedAndFoundNone = false;
                if (res.status >= 500) break;
                continue;
              }
              const data = await res.json();
              if (sessionId !== currentGameSessionId) return;
              if (data && data.data && data.data.length > 0) {
                hasTriedAndFoundNone = false;
                let panos = data.data.filter(img => img.is_pano === true);
                let flats = data.data.filter(img => img.is_pano !== true);
                const actualLL = L.latLng(loc.lat, loc.lng);
                const sortByDist = (a, b) =>
                  actualLL.distanceTo(L.latLng(a.geometry.coordinates[1], a.geometry.coordinates[0])) -
                  actualLL.distanceTo(L.latLng(b.geometry.coordinates[1], b.geometry.coordinates[0]));
                panos.sort(sortByDist);
                flats.sort(sortByDist);

                ids = [...panos.slice(0, 7), ...flats.slice(0, 3)].map(img => img.id);
                localStorage.setItem('mly_cache_v2_' + loc.id, JSON.stringify({ ids, ts: Date.now() }));
                console.log(`[Batch prefetch] Cached ${ids.length} ảnh cho: ${loc.name}`);
                break;
              }
            } catch(e) {
              hasNetworkError = true;
              hasTriedAndFoundNone = false;
              break;
            }
          }

          if (sessionId !== currentGameSessionId) return;
          if (hasTriedAndFoundNone && !hasNetworkError) {
            try {
              localStorage.setItem('mly_empty_' + loc.id, 'true');
              localStorage.removeItem('mly_good_' + loc.id);
            } catch(e){}
            console.log(`[Batch prefetch] Blacklisted empty location: ${loc.name}`);
          }
          if (hasNetworkError) {
            console.warn('[Batch prefetch] Dừng prefetch vì gặp lỗi mạng từ Mapillary.');
            return; // Abort the rest of the batch to avoid spamming 500s
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

      // Delay nhỏ để giải phóng luồng chính trước khi gọi WebGL API
      await new Promise(resolve => setTimeout(resolve, 500));
      if (sessionId !== currentGameSessionId) return;

      try {
          const moveToPromise = mlyViewer.moveTo(imageId);
          const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Timeout loading image")), 8000)
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
    const max = CITY_MAX_DISTANCES[currentMode] || 50;
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
    $('result-landmark-name').textContent = currentLoc.name;
    $('result-landmark-desc').textContent = currentLoc.desc || '';

    if (isEndless) {
        // Build Endless-specific result title
        const lostLife = score < ENDLESS_STREAK_THRESHOLD;
        let title = lostLife
            ? `💔 Mất mạng! Còn ${endlessLives} mạng`
            : endlessStreak >= 5 ? `🔥 STREAK x${endlessStreak}! Đàng cốt!`
            : endlessStreak >= 2 ? `⭐ Streak x${endlessStreak}! Tiếp tục!`
            : '✅ Vòng qua!';
        $('result-title').textContent = title;
        $('btn-next-text').textContent = endlessLives <= 0 ? 'Xem kết quả' : 'Tiếp tục ♾️ →';
    } else {
        $('result-title').textContent = getRating(score);
        $('btn-next-text').textContent = 'Tiếp tục →';
    }

    $('result-distance').textContent = distKm < 1
      ? `${Math.round(distKm * 1000)} m`
      : `${distKm.toFixed(1)} km`;

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

  function showFinal() {
    stopTimer();
    playWinFanfare();
    if (isMultiplayer) {
        $('final-total-score').textContent = myMultiScore.toLocaleString();
        let finalStatus = '';
        if (myMultiScore > oppMultiScore) finalStatus = '🏆 CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG!';
        else if (myMultiScore < oppMultiScore) finalStatus = '💀 BẠN ĐÃ THUA CUỘC!';
        else finalStatus = '🤝 HÒA NHAU!';
        $('final-rating').textContent = `${finalStatus} (Đối thủ: ${oppMultiScore})`;
        $('btn-restart').textContent = 'Về trang chủ';
        el.btnMultiRestart.style.display = 'block';
        saveGameResult(myMultiScore, 'Multiplayer');
    } else if (isEndless) {
        $('final-total-score').textContent = totalScore.toLocaleString();
        $('final-rating').textContent =
            `♾️ ${endlessRounds} vòng • Best Streak 🔥${endlessBestStreak} • Tổng điểm: ${totalScore.toLocaleString()}`;
        $('btn-restart').textContent = 'Chơi lại';
        el.btnMultiRestart.style.display = 'none';
        saveGameResult(totalScore, 'Endless_' + currentMode);
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
        $('total-score').textContent = totalScore.toLocaleString();
    } else {
        $('current-round').textContent = currentRound;
        $('total-score').textContent   = totalScore.toLocaleString();
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

  function shuffleLocations(pool) {
    return shuffle(pool);
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
