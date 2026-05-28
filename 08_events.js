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
      const btnLobby = $('btn-confirm-quit-lobby');
      if (btnLobby) {
          btnLobby.style.display = (typeof isMultiplayer !== 'undefined' && isMultiplayer === true) ? 'block' : 'none';
      }
    });

    const btnConfirmQuitYes = $('btn-confirm-quit-yes');
    if (btnConfirmQuitYes) {
      btnConfirmQuitYes.addEventListener('click', () => {
        const modal = $('confirm-quit-screen');
        if (modal) modal.classList.remove('active');
        if (typeof isMultiplayer !== 'undefined' && isMultiplayer === true && typeof sendPeerMessage === 'function') {
            sendPeerMessage({ type: 'OPPONENT_QUIT' });
            if (typeof cleanupPeer === 'function') cleanupPeer();
        }
        resetGame();
        showScreen('start');
      });
    }

    const btnConfirmQuitLobby = $('btn-confirm-quit-lobby');
    if (btnConfirmQuitLobby) {
      btnConfirmQuitLobby.addEventListener('click', () => {
        const modal = $('confirm-quit-screen');
        if (modal) modal.classList.remove('active');
        if (typeof sendPeerMessage === 'function') {
            sendPeerMessage({ type: 'RETURN_TO_LOBBY' });
        }
        if (typeof resetGame === 'function') resetGame();
        if (typeof goToLobby === 'function') goToLobby();
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

    const btnSkillDizzy = $('btn-skill-dizzy');
    if (btnSkillDizzy) {
      btnSkillDizzy.addEventListener('click', () => {
        btnSkillDizzy.style.display = 'none';
        if (isMultiplayer && peerConnection && peerConnection.open) {
          sendPeerMessage({ type: 'SKILL_DIZZY' });
        } else {
          // Local test
          const sv = $('street-view');
          if (sv) {
              sv.classList.add('skill-dizzy');
              setTimeout(() => { sv.classList.remove('skill-dizzy'); }, 5000);
          }
        }
      });
    }

    const btnSkillTunnel = $('btn-skill-tunnel');
    if (btnSkillTunnel) {
      btnSkillTunnel.addEventListener('click', () => {
        btnSkillTunnel.style.display = 'none';
        if (isMultiplayer && peerConnection && peerConnection.open) {
          sendPeerMessage({ type: 'SKILL_TUNNEL' });
        } else {
          // Local test
          const sv = $('street-view');
          if (sv) {
              sv.style.transition = 'clip-path 0.5s';
              sv.style.clipPath = 'circle(15% at center)';
              setTimeout(() => { sv.style.clipPath = 'none'; }, 7000);
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
