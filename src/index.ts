import data from "./sound-config.json";

interface SoundDetails {
  fileName: string;
  displayName: string;
}

interface AudioState {
  references: HTMLAudioElement[];
  current: HTMLAudioElement | undefined;
}

const soundConfig: SoundDetails[] = data;

// Event Handlers
function onSoundButtonClick(audioState: AudioState, sound: SoundDetails) {
  const isStacking: boolean =
    document?.querySelector<HTMLInputElement>("input#stack")?.checked ?? false;

  if (!isStacking && audioState.current) {
    audioState.current.pause();
    audioState.current.currentTime = 0;
  }

  const newAudio = new Audio(sound.fileName);
  newAudio.play();
  audioState.current = newAudio;
  audioState.references.push(newAudio);
}

async function onStopButtonClick(audioState: AudioState) {
  const isStacking: boolean =
    document?.querySelector<HTMLInputElement>("input#stack")?.checked ?? false;
  if (isStacking && audioState.current) {
    for (const ref of audioState.references) {
      ref.pause();
      ref.currentTime = 0;
      ref.removeAttribute("src");
      ref.load();
    }
    audioState.references = [];
  } else if (audioState.current) {
    audioState.current.pause();
    audioState.current.currentTime = 0;
    audioState.current.removeAttribute("src");
    audioState.current.load();
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
}
renderButtons(soundConfig);

// todo: In order for pointerdown to be trusted by browser, on mobile have an initial reveal button to open the soundboard - needs to satisfy an initial tap by the user in order not to error
