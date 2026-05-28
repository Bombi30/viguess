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
    
    let activeOverlay = null;
    if (name === 'token') { el.tokenScreen.classList.add('active'); activeOverlay = el.tokenScreen; }
    if (name === 'start') {
      el.startScreen.classList.add('active');
      activeOverlay = el.startScreen;
      cleanupPeer();
      renderLeaderboards();
    }
    if (name === 'lobby')  { el.lobbyScreen.classList.add('active'); activeOverlay = el.lobbyScreen; }
    if (name === 'result') { el.resultOverlay.classList.add('active'); activeOverlay = el.resultOverlay; }
    if (name === 'final')  { el.finalScreen.classList.add('active'); activeOverlay = el.finalScreen; }
    if (name === 'game')   { el.hud.style.display = 'flex'; }

    // GSAP Modal transitions
    if (activeOverlay && window.gsap) {
      const content = activeOverlay.querySelector('.overlay-content');
      if (content) {
        gsap.killTweensOf(content);
        gsap.fromTo(content, 
          { opacity: 0, scale: 0.88, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.3)", clearProps: "transform,opacity" }
        );
      }
    }
    
    // GSAP HUD transition
    if (name === 'game' && window.gsap && el.hud) {
      gsap.killTweensOf(el.hud);
      gsap.fromTo(el.hud,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", clearProps: "transform,opacity" }
      );
    }
  }
