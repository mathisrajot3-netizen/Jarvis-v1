const sphere = initSphere('sphere');
const settings = initSettings();
const commands = initCommands(settings.getCity);
const status = document.getElementById('status');

function showDebug(msg) {
  status.textContent = msg;
}

const voice = initVoice(
  () => {
    sphere.setTalking(true);
    status.textContent = 'Oui monsieur, je vous écoute';
  },
  async (transcript) => {
    const response = await commands.handle(transcript);
    status.textContent = response;
    voice.speak(response);
  },
  () => {
    sphere.setTalking(false);
  },
  showDebug
);

document.body.addEventListener('click', function startOnce() {
  voice.start();
  document.body.removeEventListener('click', startOnce);
}, { once: true });
