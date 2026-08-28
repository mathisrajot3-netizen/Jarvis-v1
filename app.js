const sphere = initSphere('sphere');
const settings = initSettings();
const dice = initDice();
const status = document.getElementById('status');
const linkArea = document.getElementById('linkArea');

function showDebug(msg) {
  status.textContent = msg;
}

const voice = initVoice(showDebug);

const commands = initCommands(settings.getCity, {
  onDiceRoll: (faces, result) => dice.roll(faces, result),
  onTimerEnd: async () => {
    status.textContent = 'Le minuteur est terminé !';
    await voice.speak('Le minuteur est terminé !');
    status.textContent = 'Touchez la sphère pour parler';
  }
});

let busy = false;

document.body.addEventListener('click', async (e) => {
  if (e.target.closest('#settingsBtn') || e.target.closest('#settingsPanel') || e.target.closest('#linkArea')) return;
  if (busy) return;

  busy = true;
  linkArea.innerHTML = '';
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

  const text = typeof response === 'object' ? response.text : response;
  status.textContent = text;

  if (typeof response === 'object' && response.link) {
    const a = document.createElement('a');
    a.href = response.link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = response.linkLabel || 'Ouvrir le lien';
    linkArea.appendChild(a);
  }

  await voice.speak(text);

  sphere.setTalking(false);
  status.textContent = 'Touchez la sphère pour parler';
  busy = false;
});
