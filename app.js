const sphere = initSphere('sphere');
const settings = initSettings();
const commands = initCommands(settings.getCity);
const status = document.getElementById('status');

function showDebug(msg) {
  status.textContent = msg;
}

const voice = initVoice(showDebug);

let busy = false;

document.body.addEventListener('click', async (e) => {
  if (e.target.closest('#settingsBtn') || e.target.closest('#settingsPanel')) return;
  if (busy) return;

  busy = true;
  sphere.setTalking(true);
  status.textContent = 'Je vous écoute...';

  const transcript = await voice.listenOnce();

  if (!transcript) {
    status.textContent = 'Touchez la sphère pour parler';
    sphere.setTalking(false);
    busy = false;
    return;
  }

  status.textContent = '"' + transcript + '"';
  const response = await commands.handle(transcript);
  status.textContent = response;
  await voice.speak(response);

  sphere.setTalking(false);
  status.textContent = 'Touchez la sphère pour parler';
  busy = false;
});
