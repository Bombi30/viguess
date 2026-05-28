  // ── Session Logger (xóa khi release) ─────────────────────────────────────
  (function setupLogger() {
    const isDebug = localStorage.getItem('viguess_debug') === 'true' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isDebug) return;

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



    // Expose để game.js gọi được khi loadRound
    window.__vlog = log;
  })();