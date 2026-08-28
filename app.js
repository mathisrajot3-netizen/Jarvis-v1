const sphere = initSphere('sphere');
const status = document.getElementById('status');

// Pour tester en attendant la vraie reconnaissance vocale :
// clique n'importe où sur la page pour simuler "parler"
document.body.addEventListener('click', () => {
  const talking = status.textContent.includes('écoute');
  sphere.setTalking(!talking);
  status.textContent = talking ? 'Dites « Hey Jarvis »' : 'Oui monsieur, je vous écoute';
});
