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

