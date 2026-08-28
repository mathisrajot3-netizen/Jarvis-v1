const sphere = initSphere('sphere');
const settings = initSettings();
const status = document.getElementById('status');

document.body.addEventListener('click', (e) => {
  if (e.target.closest('#settingsBtn') || e.target.closest('#settingsPanel')) return;
  const talking = status.textContent.includes('écoute');
  sphere.setTalking(!talking);
  status.textContent = talking ? 'Dites « Hey Jarvis »' : 'Oui monsieur, je vous écoute';
});
