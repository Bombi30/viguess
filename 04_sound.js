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

  function playClick() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Failed to play click sound:", e);
    }
  }

  function playCorrect() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      const playNote = (freq, time, duration) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);
        
        gainNode.gain.setValueAtTime(0, now + time);
        gainNode.gain.linearRampToValueAtTime(0.12, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + time + duration);
        
        osc.start(now + time);
        osc.stop(now + time + duration);
      };
      
      playNote(523.25, 0, 0.12);      // C5
      playNote(659.25, 0.08, 0.12);   // E5
      playNote(783.99, 0.16, 0.25);   // G5
    } catch (e) {
      console.warn("Failed to play correct sound:", e);
    }
  }

  function playIncorrect() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.35); // A2
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Failed to play incorrect sound:", e);
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
