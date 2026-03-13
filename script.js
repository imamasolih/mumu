"use strict";

const storyStages = [
  {
    eyebrow: "For you",
    title: "Some hearts arrive quietly, and then nothing in the world feels ordinary again.",
    body: "That is what loving you has done to my days.",
    imageKey: "blossoms"
  },
  {
    eyebrow: "A little closer",
    title: "With you, even simple evenings feel dressed in warm light.",
    body: "You make calm feel beautiful and joy feel easy.",
    imageKey: "bouquet"
  },
  {
    eyebrow: "The truest thing",
    title: "So here is the future my heart keeps reaching for with complete certainty.",
    body: "My favorite life is the one that keeps beginning with us.",
    imageKey: "bokeh"
  }
];

const proposalStage = {
  eyebrow: "One last page",
  title: "Muchinam, will you marry me?",
  body: "However gently I say it, it is still the truest thing I know.",
  imageKey: "bouquet"
};

const noStages = [
  {
    note: "Then let me ask it a little more softly.",
    body: "Because loving you has never made me impatient, only sure.",
    primaryLabel: "Yes, because it’s you",
    secondaryLabel: "Ask a little sweeter"
  },
  {
    note: "Fair. I had another tender line ready anyway.",
    body: "I would still choose you on the quiet days, the bright ones, and every in-between.",
    primaryLabel: "Yes, my love",
    secondaryLabel: "One more gentle try"
  },
  {
    note: "You make even suspense feel beautiful.",
    body: "The answer already sounds warmer when it is wrapped in your smile.",
    primaryLabel: "Yes, forever",
    secondaryLabel: "I’m almost there"
  },
  {
    note: "There you are. Your no only took the scenic route.",
    body: "Whatever version of yes you choose, I will treasure it.",
    primaryLabel: "Yes",
    secondaryLabel: "Yes, my love",
    secondaryAccepts: true
  }
];

const celebrationStage = {
  eyebrow: "Forever, with joy",
  title: "You just made the future glow.",
  body: "I will keep loving you with patience, laughter, and the kind of tenderness that feels like home.",
  note: "Now let us make a beautiful life of it.",
  imageKey: "bokeh"
};

const mediaMap = {
  blossoms: "./assets/images/pink-blossoms-dream.jpg",
  bouquet: "./assets/images/bouquet-evening.jpg",
  bokeh: "./assets/images/warm-bokeh-glow.jpg"
};

const state = {
  stageIndex: 0,
  noStage: 0,
  celebrating: false
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const compactViewport = window.matchMedia("(max-width: 47.99rem)");
const failedImages = new Set();

const pageShell = document.querySelector(".page-shell");
const storyCard = document.getElementById("story-card");
const progressDots = document.getElementById("progress-dots");
const storyVisual = document.getElementById("story-visual");
const storyImage = document.getElementById("story-image");
const storyEyebrow = document.getElementById("story-eyebrow");
const storyTitle = document.getElementById("story-title");
const storyBody = document.getElementById("story-body");
const storyNote = document.getElementById("story-note");
const storyScript = document.getElementById("story-script");
const storyActions = document.getElementById("story-actions");
const tapHint = document.getElementById("tap-hint");
const celebrationLayer = document.getElementById("celebration-layer");
const backdrops = Array.from(document.querySelectorAll(".backdrop"));
const backdropImages = Array.from(document.querySelectorAll(".backdrop__image"));
const audio = document.getElementById("our-song");
const soundToggle = document.getElementById("sound-toggle");
const audioTracks = {
  story: audio?.dataset.storySrc || audio?.getAttribute("src") || "",
  celebration: audio?.dataset.celebrationSrc || audio?.dataset.storySrc || audio?.getAttribute("src") || ""
};
const audioState = {
  activeTrack: "story",
  autoplayAttempted: false,
  autoplayBlocked: false,
  muted: false,
  userActivated: false,
  pendingReadyRetry: false
};

function removeGestureAutoplay() {
  document.removeEventListener("pointerdown", resumeAudioOnFirstGesture, true);
  document.removeEventListener("touchstart", resumeAudioOnFirstGesture, true);
  document.removeEventListener("click", resumeAudioOnFirstGesture, true);
  document.removeEventListener("keydown", resumeAudioOnFirstGesture, true);
}

async function playCurrentAudio(options = {}) {
  if (!audio) {
    return false;
  }

  const { restart = false } = options;

  audio.loop = true;
  audio.muted = audioState.muted;

  if (restart) {
    try {
      audio.currentTime = 0;
    } catch (_error) {}
  }

  try {
    await audio.play();
    audioState.autoplayBlocked = false;
    removeGestureAutoplay();
    return true;
  } catch (_error) {
    audioState.autoplayBlocked = true;
    return false;
  }
}

function setAudioTrack(trackKey) {
  if (!audio) {
    return false;
  }

  const source = audioTracks[trackKey];

  if (!source) {
    return false;
  }

  const hasChanged = audio.dataset.track !== trackKey || audio.getAttribute("src") !== source;

  audio.loop = true;
  audio.muted = audioState.muted;
  audioState.activeTrack = trackKey;

  if (hasChanged) {
    audio.pause();
    audio.dataset.track = trackKey;
    audio.src = source;
    audio.load();
  }

  return hasChanged;
}

async function activateAudioTrack(trackKey, options = {}) {
  const { restart = false } = options;
  const hasChanged = setAudioTrack(trackKey);

  return playCurrentAudio({ restart: restart && !hasChanged });
}

function scheduleAudioReadyRetry() {
  if (!audio || audioState.pendingReadyRetry) {
    return;
  }

  audioState.pendingReadyRetry = true;

  const retryPlayback = async () => {
    if (!audio) {
      return;
    }

    audio.removeEventListener("loadeddata", retryPlayback);
    audio.removeEventListener("canplay", retryPlayback);
    audio.removeEventListener("canplaythrough", retryPlayback);
    audioState.pendingReadyRetry = false;

    if (!audioState.userActivated || !audio.paused) {
      return;
    }

    await activateAudioTrack(audioState.activeTrack);
  };

  audio.addEventListener("loadeddata", retryPlayback);
  audio.addEventListener("canplay", retryPlayback);
  audio.addEventListener("canplaythrough", retryPlayback);
}

async function resumeAudioOnFirstGesture() {
  if (!audio) {
    return;
  }

  audioState.userActivated = true;

  if (!audio.paused) {
    return;
  }

  audioState.autoplayAttempted = true;

  if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) {
    audio.load();
  }

  const hasStarted = await activateAudioTrack(audioState.activeTrack);

  if (!hasStarted && audio.paused) {
    scheduleAudioReadyRetry();
  }
}

function updateSoundToggleUi() {
  if (!soundToggle || !audio) {
    return;
  }

  const isMuted = audio.muted;
  soundToggle.dataset.muted = String(isMuted);
  soundToggle.setAttribute("aria-pressed", String(isMuted));
  soundToggle.setAttribute("aria-label", isMuted ? "Turn sound on" : "Turn sound off");
}

async function toggleSoundMuted() {
  if (!audio) {
    return;
  }

  audioState.muted = !audioState.muted;
  audio.muted = audioState.muted;
  updateSoundToggleUi();

  if (!audioState.muted && audio.paused) {
    await resumeAudioOnFirstGesture();
  }
}

function getCelebrationProfile() {
  const useLiteProfile = coarsePointer.matches || compactViewport.matches;

  return {
    useLiteProfile,
    count: useLiteProfile ? 16 : 30,
    size: useLiteProfile ? 28 : 35,
    depthSpread: useLiteProfile ? 220 : 400,
    driftBase: useLiteProfile ? 24 : 42,
    driftRange: useLiteProfile ? 18 : 34,
    rotateZMax: useLiteProfile ? 110 : 180,
    rotateXMax: useLiteProfile ? 0 : 360,
    rotateYMax: useLiteProfile ? 0 : 360,
    rotateLiteMax: useLiteProfile ? 120 : 0
  };
}

function createProgressDots() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 4; index += 1) {
    const dot = document.createElement("span");
    if (index === 0) {
      dot.classList.add("is-active");
    }
    fragment.appendChild(dot);
  }

  progressDots.appendChild(fragment);
}

function updateProgress() {
  const dots = progressDots.querySelectorAll("span");
  const activeIndex = state.celebrating ? 3 : Math.min(state.stageIndex, 3);

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });
}

function setBackdrop(imageKey) {
  backdrops.forEach((backdrop) => {
    backdrop.classList.toggle("is-active", backdrop.dataset.backdrop === imageKey);
  });
}

function updateStoryImage(imageKey) {
  const source = mediaMap[imageKey];

  storyVisual.dataset.image = imageKey;

  if (!source || failedImages.has(source)) {
    storyVisual.classList.add("is-fallback");
    storyImage.removeAttribute("src");
    return;
  }

  storyVisual.classList.remove("is-fallback");

  if (storyImage.getAttribute("src") !== source) {
    storyImage.src = source;
  }
}

function buildButton(label, variant, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `story-button story-button--${variant}`;
  button.textContent = label;
  button.dataset.action = action;
  return button;
}

function renderActions() {
  storyActions.innerHTML = "";
  storyActions.hidden = false;

  if (state.celebrating) {
    storyActions.hidden = true;
    return;
  }

  if (state.stageIndex < storyStages.length) {
    storyActions.appendChild(buildButton("Continue", "primary", "next"));
    return;
  }

  const row = document.createElement("div");
  row.className = "button-row";

  if (state.noStage === 0) {
    row.appendChild(buildButton("Yes", "primary", "accept"));
    row.appendChild(buildButton("No", "secondary", "soft-no"));
  } else {
    const activeNoStage = noStages[state.noStage - 1];
    row.appendChild(buildButton(activeNoStage.primaryLabel, "primary", "accept"));
    row.appendChild(buildButton(activeNoStage.secondaryLabel, "secondary", "soft-no"));
  }

  storyActions.appendChild(row);
}

function canGoBackOnePage() {
  if (state.celebrating) {
    return true;
  }

  if (state.stageIndex >= storyStages.length && state.noStage > 0) {
    return true;
  }

  return state.stageIndex > 0;
}

function updateStoryVisualState() {
  if (!storyVisual) {
    return;
  }

  const canGoBack = canGoBackOnePage();
  storyVisual.disabled = !canGoBack;
  storyVisual.setAttribute(
    "aria-label",
    canGoBack ? "Go to the previous page" : "Story image"
  );
}

function renderStory() {
  const activeStory = storyStages[state.stageIndex];

  storyCard.dataset.mode = "story";
  storyCard.dataset.noStage = "0";
  storyEyebrow.textContent = activeStory.eyebrow;
  storyTitle.textContent = activeStory.title;
  storyBody.textContent = activeStory.body;
  storyNote.hidden = true;
  storyScript.hidden = true;
  storyNote.textContent = "";
  storyScript.textContent = "";
  tapHint.classList.remove("is-hidden");
  tapHint.textContent = "Tap the card or use Continue.";

  updateStoryImage(activeStory.imageKey);
  setBackdrop(activeStory.imageKey);
  renderActions();
}

function renderProposal() {
  const activeNoStage = state.noStage > 0 ? noStages[state.noStage - 1] : null;

  storyCard.dataset.mode = "proposal";
  storyCard.dataset.noStage = String(state.noStage);
  storyEyebrow.textContent = proposalStage.eyebrow;
  storyTitle.textContent = proposalStage.title;
  storyBody.textContent = activeNoStage ? activeNoStage.body : proposalStage.body;
  storyNote.hidden = !activeNoStage;
  storyNote.textContent = activeNoStage ? activeNoStage.note : "";
  storyScript.hidden = true;
  storyScript.textContent = "";
  tapHint.classList.toggle("is-hidden", state.noStage > 0);
  tapHint.textContent = state.noStage > 0 ? "" : "Take your time.";

  updateStoryImage(proposalStage.imageKey);
  setBackdrop(proposalStage.imageKey);
  renderActions();
}

function renderCelebration() {
  storyCard.dataset.mode = "celebration";
  storyCard.dataset.noStage = String(state.noStage);
  storyEyebrow.textContent = celebrationStage.eyebrow;
  storyTitle.textContent = celebrationStage.title;
  storyBody.textContent = celebrationStage.body;
  storyNote.hidden = true;
  storyNote.textContent = "";
  storyScript.hidden = false;
  storyScript.textContent = celebrationStage.note;
  tapHint.classList.add("is-hidden");
  tapHint.textContent = "";

  updateStoryImage(celebrationStage.imageKey);
  setBackdrop(celebrationStage.imageKey);
  renderActions();
}

function render() {
  updateProgress();

  if (state.celebrating) {
    renderCelebration();
    updateStoryVisualState();
    return;
  }

  if (state.stageIndex < storyStages.length) {
    renderStory();
    updateStoryVisualState();
    return;
  }

  renderProposal();
  updateStoryVisualState();
}

function moveToNextStage() {
  if (!state.celebrating && state.stageIndex < storyStages.length) {
    state.stageIndex += 1;
    render();
  }
}

function createCelebrationParticles(count = null) {
  celebrationLayer.innerHTML = "";

  const fragment = document.createDocumentFragment();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const profile = getCelebrationProfile();
  const particleCount = count ?? profile.count;
  const size = profile.size;
  const edgePadding = Math.max(24, Math.round(width * 0.04));
  const safeWidth = Math.max(size, width - edgePadding * 2 - size);

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const drift = document.createElement("span");
    const shape = document.createElement("span");
    const depth = -(profile.depthSpread / 2) + Math.random() * profile.depthSpread;
    const fallDuration = 6 + Math.random() * 9;
    const swayDuration = profile.useLiteProfile ? 5 + Math.random() * 3 : 4 + Math.random() * 4;
    const spinDuration = profile.useLiteProfile ? 3.2 + Math.random() * 3.4 : 2 + Math.random() * 6;
    const originX = edgePadding + Math.random() * safeWidth;
    const preferredDrift =
      (Math.random() < 0.5 ? -1 : 1) *
      (profile.driftBase + Math.random() * profile.driftRange);
    const maxLeftDrift = -(originX - edgePadding);
    const maxRightDrift = width - edgePadding - size - originX;
    const driftX = Math.max(maxLeftDrift, Math.min(maxRightDrift, preferredDrift));

    particle.className = profile.useLiteProfile ? "petal petal--lite" : "petal";
    drift.className = "petal__drift";
    shape.className = "petal__shape";

    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--origin-x", `${originX.toFixed(1)}px`);
    particle.style.setProperty("--origin-y", `${(-200 + Math.random() * 50).toFixed(1)}px`);
    particle.style.setProperty("--origin-z", `${depth.toFixed(0)}px`);
    particle.style.setProperty("--viewport-height", `${height}px`);
    particle.style.setProperty("--fall-duration", `${fallDuration.toFixed(2)}s`);
    particle.style.setProperty("--fall-delay", "-15s");
    particle.style.setProperty("--drift-x", `${driftX.toFixed(1)}px`);
    particle.style.setProperty("--petal-layer", depth > 100 ? "4" : depth > -40 ? "3" : "2");
    particle.style.setProperty("--sway-duration", `${swayDuration.toFixed(2)}s`);
    particle.style.setProperty("--spin-duration", `${spinDuration.toFixed(2)}s`);
    particle.style.setProperty("--spin-delay", "-5s");
    particle.style.setProperty("--rotate-z-end", `${(Math.random() * profile.rotateZMax).toFixed(0)}deg`);
    particle.style.setProperty("--rotate-x-end", `${(Math.random() * profile.rotateXMax).toFixed(0)}deg`);
    particle.style.setProperty("--rotate-y-end", `${(Math.random() * profile.rotateYMax).toFixed(0)}deg`);
    particle.style.setProperty("--rotate-lite-end", `${(Math.random() * profile.rotateLiteMax).toFixed(0)}deg`);

    drift.appendChild(shape);
    particle.appendChild(drift);
    fragment.appendChild(particle);
  }

  celebrationLayer.appendChild(fragment);
}

function beginCelebration() {
  state.celebrating = true;
  pageShell.classList.add("is-celebrating");
  render();
  void activateAudioTrack("celebration", { restart: true });

  if (!reduceMotion.matches) {
    createCelebrationParticles();
  }
}

function handleSoftNo() {
  if (state.celebrating) {
    return;
  }

  if (state.noStage === 0) {
    state.noStage = 1;
    render();
    return;
  }

  const activeNoStage = noStages[state.noStage - 1];

  if (activeNoStage.secondaryAccepts) {
    beginCelebration();
    return;
  }

  state.noStage = Math.min(state.noStage + 1, noStages.length);
  render();
}

function resetExperience() {
  state.stageIndex = 0;
  state.noStage = 0;
  state.celebrating = false;
  pageShell.classList.remove("is-celebrating");
  celebrationLayer.innerHTML = "";
  render();
  void activateAudioTrack("story", { restart: true });
}

function goBackOnePage() {
  if (!canGoBackOnePage()) {
    return;
  }

  if (state.celebrating) {
    state.celebrating = false;
    pageShell.classList.remove("is-celebrating");
    celebrationLayer.innerHTML = "";
    render();
    void activateAudioTrack("story");
    return;
  }

  if (state.stageIndex >= storyStages.length) {
    if (state.noStage > 0) {
      state.noStage -= 1;
    } else {
      state.stageIndex = storyStages.length - 1;
    }

    render();
    return;
  }

  state.stageIndex = Math.max(0, state.stageIndex - 1);
  render();
}

function handleAction(action) {
  void resumeAudioOnFirstGesture();

  switch (action) {
    case "next":
      moveToNextStage();
      break;
    case "accept":
      beginCelebration();
      break;
    case "soft-no":
      handleSoftNo();
      break;
    default:
      break;
  }
}

function handleCardAdvance(event) {
  if (state.celebrating || state.stageIndex >= storyStages.length) {
    return;
  }

  if (event.target.closest("button")) {
    return;
  }

  void resumeAudioOnFirstGesture();
  moveToNextStage();
}

function handleImageError(target) {
  if (!(target instanceof HTMLImageElement)) {
    return;
  }

  const source = target.getAttribute("src");

  if (source) {
    failedImages.add(source);
  }

  const wrapper = target.closest(".story-visual, .backdrop");

  if (wrapper) {
    wrapper.classList.add("is-fallback");
  }
}

function setupImageFallbacks() {
  backdropImages.forEach((image) => {
    image.addEventListener("error", () => handleImageError(image));
  });

  storyImage.addEventListener("error", () => handleImageError(storyImage));
}

function setupAudio() {
  if (!audio) {
    return;
  }

  audioState.muted = false;
  audioState.userActivated = false;
  audioState.pendingReadyRetry = false;
  audio.volume = 0.55;
  audio.muted = false;
  audio.loop = true;
  setAudioTrack("story");
  updateSoundToggleUi();

  const attachGestureAutoplay = () => {
    document.addEventListener("pointerdown", resumeAudioOnFirstGesture, { passive: true, capture: true });
    document.addEventListener("touchstart", resumeAudioOnFirstGesture, { passive: true, capture: true });
    document.addEventListener("click", resumeAudioOnFirstGesture, { passive: true, capture: true });
    document.addEventListener("keydown", resumeAudioOnFirstGesture, true);
  };

  const attemptAutoplay = async () => {
    if (audioState.autoplayAttempted) {
      return;
    }

    audioState.autoplayAttempted = true;
    await activateAudioTrack("story");
  };

  const onReady = () => {
    void attemptAutoplay();
  };

  audio.addEventListener("loadedmetadata", onReady, { once: true });
  audio.addEventListener("canplay", onReady, { once: true });
  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    void playCurrentAudio();
  });
  audio.addEventListener("volumechange", updateSoundToggleUi);
  attachGestureAutoplay();

  if (audio.readyState >= 1) {
    void attemptAutoplay();
  }
}

function setupEvents() {
  storyActions.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    handleAction(target.dataset.action);
  });

  storyCard.addEventListener("click", handleCardAdvance);
  storyVisual.addEventListener("click", goBackOnePage);

  if (soundToggle) {
    soundToggle.addEventListener("click", (event) => {
      event.preventDefault();
      void toggleSoundMuted();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (document.activeElement instanceof HTMLButtonElement) {
      return;
    }

    if (!state.celebrating && state.stageIndex < storyStages.length) {
      event.preventDefault();
      moveToNextStage();
    }
  });

  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      celebrationLayer.innerHTML = "";
    } else if (state.celebrating && celebrationLayer.childElementCount === 0) {
      createCelebrationParticles();
    }
  });
}

function init() {
  createProgressDots();
  setupImageFallbacks();
  setupAudio();
  setupEvents();
  render();
}

init();
