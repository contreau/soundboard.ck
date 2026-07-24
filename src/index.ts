import data from "./sound-config.json";

interface soundDetails {
  fileName: string;
  displayName: string;
}

const soundConfig: soundDetails[] = data;

async function renderButtons(soundConfig: soundDetails[]) {
  const buttonGrid = document.querySelector("#button-grid");
  let currentAudio: undefined | HTMLAudioElement;

  for (const sound of soundConfig) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "default";
    button.textContent = sound.displayName;
    button.addEventListener("click", () => {
      if (currentAudio) {
        // stop audio when a new button is clicked
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      currentAudio = new Audio(sound.fileName);
      currentAudio.play();
    });
    li.appendChild(button);
    buttonGrid?.appendChild(li);
  }
}
renderButtons(soundConfig);
