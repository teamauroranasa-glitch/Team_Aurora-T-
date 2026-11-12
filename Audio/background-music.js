(() => {
  const resolveAudioSource = () => {
    try {
      const script = document.currentScript || document.querySelector("script[src$='background-music.js']");
      if (script && script.src) {
        return new URL("Piano.mp3", script.src).toString();
      }
    } catch (error) {
      console.warn("Unable to resolve background music path, falling back to the local audio file.", error);
    }
    return "./Piano.mp3";
  };

  const music = document.getElementById("backgroundMusic") || new Audio(resolveAudioSource());
  const enabledStorageKey = "museumBackgroundMusicEnabled";
  const positionStorageKey = "museumBackgroundMusicPosition";
  const controls = [];
  const savedPosition = Number(sessionStorage.getItem(positionStorageKey));
  let enabled = sessionStorage.getItem(enabledStorageKey) !== "false";
  let positionRestored = false;
  let playRequest = null;

  music.loop = true;
  music.muted = false;
  music.volume = 0.3;
  music.preload = "auto";
  music.id = "backgroundMusic";
  if (!music.isConnected) document.body.appendChild(music);

  const existingToggle = document.getElementById("soundToggleBtn");
  if (existingToggle) {
    controls.push(existingToggle);
  } else {
    const toggle = document.createElement("button");
    toggle.className = "background-music-toggle";
    toggle.type = "button";
    toggle.addEventListener("click", toggleMusic);
    document.body.appendChild(toggle);
    controls.push(toggle);
  }

  function updateControls() {
    const isPlaying = !music.paused;
    controls.forEach(control => {
      control.setAttribute("aria-pressed", String(enabled));
      control.querySelector("#soundOnIcon")?.classList.toggle("hidden", !isPlaying);
      control.querySelector("#soundOffIcon")?.classList.toggle("hidden", isPlaying);
      control.setAttribute(
        "aria-label",
        enabled ? (isPlaying ? "Mute background music" : "Play background music") : "Play background music"
      );

      const status = control.querySelector("#soundStatusText");
      if (status) {
        status.textContent = isPlaying ? "Sound On" : (enabled ? "Play Music" : "Sound Off");
      } else {
        control.textContent = isPlaying ? "Sound On" : (enabled ? "Play Background Music" : "Sound Off");
      }
    });
  }

  function restorePosition() {
    if (positionRestored || music.readyState < HTMLMediaElement.HAVE_METADATA) return;

    if (Number.isFinite(savedPosition) && savedPosition > 0 && Number.isFinite(music.duration) && music.duration > 0) {
      music.currentTime = savedPosition % music.duration;
    }

    positionRestored = true;
    sessionStorage.removeItem(positionStorageKey);
  }

  function removeInteractionListeners() {
    document.removeEventListener("pointerdown", startOnInteraction);
    document.removeEventListener("keydown", startOnInteraction);
  }

  function startMusic() {
    if (!enabled) return Promise.resolve(false);
    if (!music.paused) return Promise.resolve(true);
    if (playRequest) return playRequest;

    music.muted = false;
    music.volume = 0.3;
    restorePosition();
    playRequest = music.play().then(() => {
      playRequest = null;
      removeInteractionListeners();
      updateControls();
      return true;
    }).catch(error => {
      playRequest = null;
      if (error.name === "NotAllowedError") {
        updateControls();
        return false;
      }

      if (error.name === "AbortError") {
        updateControls();
        return false;
      }

      controls.forEach(control => {
        control.textContent = "Music Unavailable";
        control.setAttribute("aria-label", "Background music unavailable");
      });
      console.error("Background music could not be played.", error);
      return false;
    });
    updateControls();
    return playRequest;
  }

  function setEnabled(value) {
    enabled = value;
    sessionStorage.setItem(enabledStorageKey, String(enabled));

    if (enabled) {
      startMusic();
    } else {
      music.pause();
    }

    updateControls();
  }

  function toggleMusic() {
    if (enabled && music.paused) {
      startMusic();
      return true;
    }

    setEnabled(!enabled);
    return enabled;
  }

  music.addEventListener("playing", updateControls);
  music.addEventListener("pause", updateControls);
  music.addEventListener("loadedmetadata", restorePosition, { once: true });
  window.addEventListener("pagehide", () => {
    if (Number.isFinite(music.currentTime)) {
      sessionStorage.setItem(positionStorageKey, String(music.currentTime));
    }
  });

  function startOnInteraction(event) {
    if (event.target instanceof Element && event.target.closest("#soundToggleBtn, .background-music-toggle")) return;
    startMusic();
  }

  document.addEventListener("pointerdown", startOnInteraction);
  document.addEventListener("keydown", startOnInteraction);
  window.backgroundMusic = {
    isEnabled: () => enabled,
    setEnabled,
    toggle: toggleMusic
  };

  updateControls();
  startMusic();
})();
