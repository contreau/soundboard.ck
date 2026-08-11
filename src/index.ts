import data from "./sound-config.json";

interface SoundDetails {
  fileName: string;
  displayName: string;
}

interface AudioState {
  references: AudioBufferSourceNode[];
  current: AudioBufferSourceNode | undefined;
}

// Mobile Preload

(async () => {
  if (window.getComputedStyle(document.querySelector("#unlock-sounds")!)["display"] === "none") {
    return; // Script doesn't run on desktop
  }
  // Create Audio Context and preload reveal sound
  const audioCtx = new AudioContext();
  async function getRevealAudio(audioContext: AudioContext) {
    const file = await fetch("sounds/lego-yoda.mp3");
    const buffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    return audioBuffer;
  }
  const audioBuffer = await getRevealAudio(audioCtx);

  // Configures click handler
  const unlockContainer = document.querySelector("div#unlock-container")!;
  const unlockBTN = document.querySelector("#unlock-sounds")!;
  unlockBTN.addEventListener("click", async () => {
    if (audioCtx.state === "suspended") await audioCtx.resume();
    const sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioCtx.destination);
    sourceNode.start();
    // Reveal Soundboard
    const hiddenSounds = document.querySelector("div.mobile-hidden")!;
    hiddenSounds.classList.remove("mobile-hidden");
    unlockContainer.remove();
    // Cleanup
    sourceNode.onended = async () => {
      await audioCtx.close();
    };
  });
})();

// Rest of the Preload / Interaction Behavior

const soundConfig: SoundDetails[] = data;

const audioCtx = new AudioContext();
const bufferCache = new Map<string, AudioBuffer>();
let audioUnlocked = false;

// Preloading
async function preloadSounds(sounds: SoundDetails[]): Promise<void> {
  await Promise.all(
    sounds.map(async (sound) => {
      const res = await fetch(sound.fileName);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      bufferCache.set(sound.fileName, audioBuffer);
    }),
  );
}

function createSource(fileName: string): AudioBufferSourceNode | undefined {
  const buffer = bufferCache.get(fileName);
  if (!buffer) return undefined;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  return source;
}

// Unlock audio context on first trusted gesture so pointerdown works after
function unlockAudioContext() {
  if (audioUnlocked) return;
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  audioUnlocked = true;
}

// Event Handlers
function onSoundButtonClick(audioState: AudioState, sound: SoundDetails) {
  const isStacking: boolean =
    document?.querySelector<HTMLInputElement>("input#stack")?.checked ?? false;

  if (!isStacking && audioState.current) {
    audioState.current.stop();
  }

  const newSource = createSource(sound.fileName);
  if (!newSource) return;

  newSource.onended = () => {
    newSource.disconnect();
    audioState.references = audioState.references.filter((r) => r !== newSource);
    if (audioState.current === newSource) {
      audioState.current = undefined;
    }
  };

  newSource.start(0);
  audioState.current = newSource;
  audioState.references.push(newSource);
}

function onStopButtonClick(audioState: AudioState) {
  const isStacking: boolean =
    document?.querySelector<HTMLInputElement>("input#stack")?.checked ?? false;

  if (isStacking) {
    for (const ref of audioState.references) {
      ref.stop();
    }
    audioState.references = [];
  } else if (audioState.current) {
    audioState.current.stop();
  }
  audioState.current = undefined;
}

// Render function
async function renderButtons(soundConfig: SoundDetails[]) {
  const buttonGrid = document.querySelector("#button-grid");
  const audioState: AudioState = {
    references: [],
    current: undefined,
  };

  for (const sound of soundConfig) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "default";
    button.textContent = sound.displayName;
    button.disabled = true; // enabled once preload resolves
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      onSoundButtonClick(audioState, sound);
    });
    li.appendChild(button);
    buttonGrid?.appendChild(li);
  }

  const stopButton = document.querySelector("button#stop");
  stopButton?.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    onStopButtonClick(audioState);
  });

  await preloadSounds(soundConfig);
  buttonGrid
    ?.querySelectorAll<HTMLButtonElement>("button")
    .forEach((btn) => (btn.disabled = false));
}

// Unlock listeners — fire once on whatever the user's first trusted interaction is
document.addEventListener("touchstart", unlockAudioContext, { once: true });
document.addEventListener("click", unlockAudioContext, { once: true });
document.addEventListener("pointerdown", unlockAudioContext, { once: true });

renderButtons(soundConfig);
