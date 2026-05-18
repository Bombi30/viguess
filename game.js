// ViGuessr – Game Logic (Google Street View + Leaflet)
(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────────────
  const MAX_SCORE       = 5000;
  const MAX_DIST_KM     = 50;

  // ── State ─────────────────────────────────────────────────────────────────
  let apiKey        = localStorage.getItem('gmaps_api_key') || 'AIzaSyB2mM4F8GwDQe0OeAHk2iju2hxuMyhmWpI';
  let panorama      = null;
  let svService     = null;
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
  let gmapsLoaded   = false;
  let currentMode   = 'Mixed';

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
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  function init() {
    bindEvents();
    if (apiKey) {
      loadGoogleMaps(apiKey);
    } else {
      showScreen('token');
    }
  }

  function loadGoogleMaps(key) {
    if (gmapsLoaded) return;
    
    el.loadingView.style.display = 'flex';
    el.loadingText.textContent = 'Đang khởi tạo Google Maps...';

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,streetView&loading=async&callback=onGoogleMapsInit`;
    script.async = true;
    script.defer = true;
    window.onGoogleMapsInit = () => {
      gmapsLoaded = true;
      svService = new google.maps.StreetViewService();
      el.loadingView.style.display = 'none';
      showScreen('start');
    };
    script.onerror = () => {
      alert('Không thể tải Google Maps. Kiểm tra API Key của bạn!');
      showScreen('token');
    };
    document.head.appendChild(script);
  }

  function showScreen(name) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
    el.hud.style.display = 'none';
    if (name === 'token')  el.tokenScreen.classList.add('active');
    if (name === 'start')  el.startScreen.classList.add('active');
    if (name === 'result') el.resultOverlay.classList.add('active');
    if (name === 'final')  el.finalScreen.classList.add('active');
    if (name === 'game')   el.hud.style.display = 'flex';
  }

  // ── Events ────────────────────────────────────────────────────────────────
  function bindEvents() {
    // API Key input
    $('token-input').value = apiKey;
    $('btn-save-token').addEventListener('click', saveApiKey);
    $('token-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveApiKey(); });

    // Change API Key
    $('btn-change-token').addEventListener('click', () => showScreen('token'));

    // Mode buttons
    document.querySelectorAll('.btn-mode').forEach(btn =>
      btn.addEventListener('click', () => startGame(btn.dataset.city))
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
  }

  function saveApiKey() {
    const val = $('token-input').value.trim();
    if (!val) { alert('Vui lòng nhập Google Maps API Key!'); return; }
    apiKey = val;
    localStorage.setItem('gmaps_api_key', val);
    if (gmapsLoaded) {
      showScreen('start');
    } else {
      loadGoogleMaps(apiKey);
    }
  }

  // ── Game Flow ─────────────────────────────────────────────────────────────
  function startGame(mode) {
    currentMode  = mode;
    currentRound = 1;
    totalScore   = 0;
    hasGuessed   = false;
    gameActive   = true;

    // Pick locations
    const pool = mode === 'Mixed'
      ? [...LOCATIONS]
      : LOCATIONS.filter(l => l.city === mode);

    gameLocations = shuffle([...pool]);
    // Note: In endless mode, we just use the shuffled pool and reshuffle when empty

    updateHUD();
    showScreen('game');
    initGuessMap();
    initSVViewer();
    loadRound();
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
    // If we run out of locations in the pool, reshuffle
    if (currentRound > gameLocations.length) {
      const pool = currentMode === 'Mixed' ? [...LOCATIONS] : LOCATIONS.filter(l => l.city === currentMode);
      gameLocations.push(...shuffle([...pool]));
    }

    currentLoc = gameLocations[currentRound - 1];
    hasGuessed = false;

    // Clear guess
    if (guessMarker) { guessMap.removeLayer(guessMarker); guessMarker = null; }
    if (resultLine)  { guessMap.removeLayer(resultLine);  resultLine  = null; }
    el.btnGuess.disabled = true;

    // Reset map view to Vietnam
    guessMap.setView([16.0, 106.5], 5);

    $('city-badge').textContent = currentLoc.city === 'Hanoi' ? '🏛️ Hà Nội' : '🌆 Sài Gòn';
    updateHUD();

    // Load Street View
    el.loadingView.style.display = 'flex';
    el.loadingText.textContent   = 'Đang tải Google Street View...';
    loadSVImage(currentLoc);
  }

  function loadSVImage(loc) {
    const pos = { lat: loc.lat, lng: loc.lng };
    
    svService.getPanorama({
      location: pos,
      radius: 100, // Search within 100m
      source: google.maps.StreetViewSource.OUTDOOR
    }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK) {
        panorama.setPano(data.location.pano);
        panorama.setPov({ heading: 0, pitch: 0 });
        panorama.setVisible(true);
        el.loadingView.style.display = 'none';
      } else {
        console.error('Street View not found for this location:', status);
        el.loadingText.textContent = '⚠️ Không tìm thấy ảnh Street View tại đây, đang bỏ qua...';
        setTimeout(() => { if (gameActive) nextRound(); }, 2500);
      }
    });
  }

  // ── Guess & Scoring ───────────────────────────────────────────────────────
  function submitGuess() {
    if (!guessMarker || hasGuessed) return;
    hasGuessed = true;
    el.btnGuess.disabled = true;

    const guessLL  = guessMarker.getLatLng();
    const actualLL = L.latLng(currentLoc.lat, currentLoc.lng);
    const distKm   = guessLL.distanceTo(actualLL) / 1000;
    const score    = calcScore(distKm);
    totalScore    += score;

    showResult(distKm, score, guessLL, actualLL);
  }

  function calcScore(distKm) {
    if (distKm >= MAX_DIST_KM) return 0;
    return Math.min(MAX_SCORE, Math.round(MAX_SCORE * Math.exp(-distKm / 5)));
  }

  function showResult(distKm, score, guessLL, actualLL) {
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

  function nextRound() {
    currentRound++;
    showScreen('game');
    loadRound();
  }

  function showFinal() {
    $('final-total-score').textContent = totalScore.toLocaleString();
    const pct = totalScore / (MAX_SCORE * TOTAL_ROUNDS);
    let rating;
    if (pct >= 0.90) rating = '🥇 Bạn là chuyên gia địa lý Việt Nam!';
    else if (pct >= 0.70) rating = '🥈 Rất giỏi! Bạn biết VN rõ đấy!';
    else if (pct >= 0.50) rating = '🥉 Khá ổn! Luyện thêm nhé!';
    else if (pct >= 0.30) rating = '😅 Cần đi du lịch nhiều hơn!';
    else rating = '🗺️ Hãy khám phá Việt Nam thêm!';
    $('final-rating').textContent = rating;
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
    $('current-round').textContent = currentRound;
    $('total-score').textContent   = totalScore.toLocaleString();
  }

  // ── Google Street View ──────────────────────────────────────────────────
  function initSVViewer() {
    if (panorama) return; // Only init once
    
    panorama = new google.maps.StreetViewPanorama(
      document.getElementById("street-view"),
      {
        addressControl: false,
        showRoadLabels: false,
        zoomControl: true,
        panControl: true,
        enableCloseButton: false,
      }
    );
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
      if (hasGuessed) return;
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
