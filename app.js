const sphere = initSphere('sphere');
const status = document.getElementById('status');
const settingsBtn = document.getElementById('settingsBtn');

// Clic sur la page (hors bouton réglages) = simuler "parler"
document.body.addEventListener('click', (e) => {
  if (e.target.closest('#settingsBtn')) return;
  const talking = status.textContent.includes('écoute');
  sphere.setTalking(!talking);
  status.textContent = talking ? 'Dites « Hey Jarvis »' : 'Oui monsieur, je vous écoute';
});

// Bouton réglages : pour l'instant ne fait rien (on codera l'écran de réglages plus tard)
settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  console.log('Réglages cliqué — écran à venir');
});
