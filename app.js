const sphere = initSphere('sphere');
const settings = initSettings();
const commands = initCommands(settings.getCity);
const status = document.getElementById('status');

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
    status.textContent = 'Dites « Hey Jarvis »';
  }
);

// Le micro doit démarrer après une interaction utilisateur (règle des navigateurs)
document.body.addEventListener('click', function startOnce() {
  voice.start();
  document.body.removeEventListener('click', startOnce);
}, { once: true });
