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

  // ── Events ────────────────────────────────────────────────────────────────
  function bindEvents() {
    $('token-input').value = mlyToken;
    $('btn-save-token').addEventListener('click', saveToken);
    $('token-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveToken(); });

    const btnTutorial = $('btn-tutorial');
    const tutorialModal = $('tutorial-modal');
    const btnCloseTutorial = $('btn-close-tutorial');
    if (btnTutorial && tutorialModal && btnCloseTutorial) {
        btnTutorial.addEventListener('click', () => {
            tutorialModal.style.display = 'flex';
        });
        btnCloseTutorial.addEventListener('click', () => {
            tutorialModal.style.display = 'none';
        });
    }

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
      mapContainer.addEventListener('mouseenter', () => {
        mapContainer.classList.add('active');
      });
      mapContainer.addEventListener('mouseleave', () => {
        if (!isMapInteracting) {
          mapContainer.classList.remove('active');
        }
      });
    }

    $('btn-quit').addEventListener('click', () => {
      const modal = $('confirm-quit-screen');
      if (modal) modal.classList.add('active');
    });

    const btnConfirmQuitYes = $('btn-confirm-quit-yes');
    if (btnConfirmQuitYes) {
      btnConfirmQuitYes.addEventListener('click', () => {
        const modal = $('confirm-quit-screen');
        if (modal) modal.classList.remove('active');
        resetGame();
        showScreen('start');
      });
    }

    const btnConfirmQuitCancel = $('btn-confirm-quit-cancel');
    if (btnConfirmQuitCancel) {
      btnConfirmQuitCancel.addEventListener('click', () => {
        const modal = $('confirm-quit-screen');
        if (modal) modal.classList.remove('active');
      });
    }

    el.btnGuess.addEventListener('click', submitGuess);
    
    const btnSkill = $('btn-skill-mustard');
    if (btnSkill) {
      btnSkill.addEventListener('click', () => {
        btnSkill.disabled = true;
        if (isMultiplayer && peerConnection && peerConnection.open) {
          sendPeerMessage({ type: 'SKILL_MUSTARD' });
        } else {
          const sv = $('street-view');
          if (sv) {
              sv.style.transition = 'filter 0.3s';
              sv.style.filter = 'blur(15px) sepia(1) hue-rotate(50deg) saturate(3)';
              setTimeout(() => {
                  sv.style.filter = 'none';
              }, 4000);
          }
        }
      });
    }

    const btnSkillFreeze = $('btn-skill-freeze');
    if (btnSkillFreeze) {
      btnSkillFreeze.addEventListener('click', () => {
        btnSkillFreeze.disabled = true;
        if (isMultiplayer && peerConnection && peerConnection.open) {
          sendPeerMessage({ type: 'SKILL_FREEZE' });
        } else {
          // Local test for freeze
          const sv = $('street-view');
          const freezeOverlay = $('freeze-overlay');
          if (sv && freezeOverlay) {
            sv.classList.add('frozen-map');
            freezeOverlay.classList.add('active');
            setTimeout(() => {
                sv.classList.remove('frozen-map');
                freezeOverlay.classList.remove('active');
            }, 5000);
          }
        }
      });
    }

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

    const roundsSelect = $('lobby-rounds-select');
    const timerSelect = $('lobby-timer-select');
    if (roundsSelect) roundsSelect.addEventListener('change', syncLobbySettings);
    if (timerSelect) timerSelect.addEventListener('change', syncLobbySettings);

    document.addEventListener('click', e => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.closest('.btn-mode') || target.closest('.toggle-btn') || target.closest('.play-card')) {
        playClick();
      }
    });

    document.addEventListener('mouseover', e => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.closest('.btn-mode') || target.closest('.toggle-btn') || target.closest('.play-card')) {
        if (!target.disabled) {
          playTick();
        }
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

  // ── Start ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);



