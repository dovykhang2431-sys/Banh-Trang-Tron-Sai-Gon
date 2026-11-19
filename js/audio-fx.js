/**
 * Hệ Thống Âm Thanh Web Audio API Acoustic Lo-fi Chill & Hiệu Ứng Hạt / Toast
 */
    // ================= 3. HỆ THỐNG ÂM THANH ACOUSTIC LO-FI CHILL =================
    let audioCtx = null, audioEnabled = true, bgmInterval = null, bgmStep = 0, masterGainNode = null, bgmFilterNode = null;

    function initAudio() {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          audioCtx = new AC();
          masterGainNode = audioCtx.createGain();
          masterGainNode.gain.setValueAtTime(1.8, audioCtx.currentTime);
          bgmFilterNode = audioCtx.createBiquadFilter();
          bgmFilterNode.type = "lowpass";
          bgmFilterNode.frequency.setValueAtTime(920, audioCtx.currentTime);
          bgmFilterNode.connect(masterGainNode);
          masterGainNode.connect(audioCtx.destination);
        }
      }
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    }

    function toggleAudioSystem() {
      audioEnabled = !audioEnabled;
      const icon = document.getElementById("audio-icon");
      if (audioEnabled) {
        initAudio(); startChillBGM();
        if (icon) icon.textContent = "🎵";
        showToast("🎵 Bật nhạc Lo-Fi Chill!");
      } else {
        stopChillBGM();
        if (icon) icon.textContent = "🔇";
        showToast("🔇 Đã tắt âm thanh.");
      }
    }

    const CHILL_RHODES_CHORDS = [
      { pad: [174.61, 220.00, 261.63, 329.63], melody: [523.25, 659.25, 587.33] },
      { pad: [164.81, 196.00, 246.94, 293.66], melody: [493.88, 587.33, 440.00] },
      { pad: [146.83, 174.61, 220.00, 261.63], melody: [440.00, 523.25, 392.00] },
      { pad: [130.81, 164.81, 196.00, 246.94], melody: [392.00, 440.00, 523.25] }
    ];

    function startChillBGM() {
      if (bgmInterval) clearInterval(bgmInterval);
      if (!audioEnabled) return;
      bgmInterval = setInterval(() => {
        if (!audioEnabled || !audioCtx || !document.getElementById("login-screen").classList.contains("hidden")) return;
        try {
          if (audioCtx.state === "suspended") return;
          const now = audioCtx.currentTime;
          const barIdx = Math.floor(bgmStep / 4) % CHILL_RHODES_CHORDS.length;
          const beatInBar = bgmStep % 4;
          const currentChord = CHILL_RHODES_CHORDS[barIdx];
          const dest = bgmFilterNode || masterGainNode || audioCtx.destination;

          if (beatInBar === 0) {
            currentChord.pad.forEach((freq, idx) => {
              const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
              osc.type = "sine"; osc.frequency.setValueAtTime(freq, now);
              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.linearRampToValueAtTime(0.022, now + 0.35 + idx * 0.04);
              gain.gain.exponentialRampToValueAtTime(0.0008, now + 3.4);
              osc.connect(gain); gain.connect(dest); osc.start(now); osc.stop(now + 3.5);
            });
          }
          if (beatInBar === 2 || (beatInBar === 3 && Math.random() < 0.45)) {
            const noteFreq = currentChord.melody[bgmStep % currentChord.melody.length];
            const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
            osc.type = "triangle"; osc.frequency.setValueAtTime(noteFreq, now);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.014, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.45);
            osc.connect(gain); gain.connect(dest); osc.start(now); osc.stop(now + 1.5);
          }
          bgmStep++;
        } catch (e) {}
      }, 920);
    }

    function stopChillBGM() { if (bgmInterval) clearInterval(bgmInterval); bgmInterval = null; }

    function playSFX(type) {
      if (!audioEnabled) return;
      try {
        initAudio(); if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const targetOutput = masterGainNode || audioCtx.destination;

        if (type === "snip") {
          const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
          osc.type = "triangle"; osc.frequency.setValueAtTime(780, now); osc.frequency.exponentialRampToValueAtTime(1450, now + 0.045);
          g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.002, now + 0.055);
          osc.connect(g); g.connect(targetOutput); osc.start(now); osc.stop(now + 0.06);
        } else if (type === "sauce" || type === "mix") {
          const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
          osc.type = "sine"; osc.frequency.setValueAtTime(type === "mix" ? 920 : 580, now);
          g.gain.setValueAtTime(0.09, now); g.gain.exponentialRampToValueAtTime(0.002, now + 0.11);
          osc.connect(g); g.connect(targetOutput); osc.start(now); osc.stop(now + 0.12);
        } else if (type === "cash") {
          [783.99, 1046.50].forEach((f, i) => {
            const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
            osc.type = "sine"; osc.frequency.setValueAtTime(f, now + i * 0.075);
            g.gain.setValueAtTime(0.11, now + i * 0.075); g.gain.exponentialRampToValueAtTime(0.002, now + i * 0.075 + 0.24);
            osc.connect(g); g.connect(targetOutput); osc.start(now + i * 0.075); osc.stop(now + i * 0.075 + 0.25);
          });
        } else if (type === "step" || type === "bike") {
          const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
          osc.type = "sine"; osc.frequency.setValueAtTime(type === "bike" ? 410 : 280, now);
          g.gain.setValueAtTime(0.06, now); g.gain.exponentialRampToValueAtTime(0.002, now + 0.08);
          osc.connect(g); g.connect(targetOutput); osc.start(now); osc.stop(now + 0.09);
        } else if (type === "whistle") {
          const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
          osc.type = "sine"; osc.frequency.setValueAtTime(1250, now); osc.frequency.setValueAtTime(1580, now + 0.08);
          g.gain.setValueAtTime(0.09, now); g.gain.exponentialRampToValueAtTime(0.002, now + 0.2);
          osc.connect(g); g.connect(targetOutput); osc.start(now); osc.stop(now + 0.22);
        } else if (type === "win") {
          [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
            osc.type = "triangle"; osc.frequency.setValueAtTime(f, now + i * 0.065);
            g.gain.setValueAtTime(0.10, now + i * 0.065); g.gain.exponentialRampToValueAtTime(0.002, now + i * 0.065 + 0.22);
            osc.connect(g); g.connect(targetOutput); osc.start(now + i * 0.065); osc.stop(now + i * 0.065 + 0.23);
          });
        }
      } catch (e) {}
    }

    function spawnParticleBurst(emojis = ["🥭", "✂️", "✨"]) {
      const layer = document.getElementById("particle-burst-layer");
      if (!layer) return;
      const eqFxId = state.equippedDecors?.particles;
      if (eqFxId) {
        const fxObj = DECOR_CATALOG.find(x => x.id === eqFxId);
        if (fxObj && Array.isArray(fxObj.burstEmojis) && fxObj.burstEmojis.length > 0) {
          emojis = fxObj.burstEmojis;
        }
      }
      for (let i = 0; i < 6; i++) {
        const sp = document.createElement("span");
        sp.className = "particle-fx text-sm";
        sp.textContent = emojis[i % emojis.length];
        const angle = (Math.PI * 2 * i) / 6 + (Math.random() * 0.4 - 0.2);
        const dist = 28 + Math.random() * 24;
        sp.style.setProperty("--tx", `${Math.round(Math.cos(angle) * dist)}px`);
        sp.style.setProperty("--ty", `${Math.round(Math.sin(angle) * dist - 10)}px`);
        sp.style.setProperty("--rot", `${Math.round(Math.random() * 90 - 45)}deg`);
        layer.appendChild(sp);
        setTimeout(() => sp.remove(), 680);
      }
    }


    function spawnFloatingFX(text, colorTheme = "gold") {
      const c = document.getElementById("floating-fx-container"); if (!c) return;
      const el = document.createElement("div");
      const colorMap = {
        gold: "text-yellow-300",
        green: "text-emerald-300",
        orange: "text-orange-300",
        blue: "text-sky-300",
        purple: "text-purple-300",
        red: "text-rose-400"
      };
      el.className = `arcade-float-text text-sm sm:text-base ${colorMap[colorTheme] || "text-yellow-300"}`;
      el.style.setProperty("--arc-x", `${Math.round(Math.random() * 44 - 22)}px`);
      el.style.setProperty("--arc-rot", `${Math.round(Math.random() * 16 - 8)}deg`);
      el.textContent = text;
      c.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }

    let toastTimeout = null;
    function showToast(msg) {
      const box = document.getElementById("toast-box"), content = document.getElementById("toast-content");
      if (!box || !content) return; content.textContent = msg;
      box.classList.remove("opacity-0", "-translate-y-3"); box.classList.add("opacity-100", "translate-y-0");
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => { box.classList.add("opacity-0", "-translate-y-3"); box.classList.remove("opacity-100", "translate-y-0"); }, 2500);
    }


