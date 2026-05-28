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
