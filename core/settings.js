function initSettings() {
  const panel = document.getElementById('settingsPanel');
  const openBtn = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('closeSettingsBtn');
  const saveBtn = document.getElementById('saveKeyBtn');
  const input = document.getElementById('apiKeyInput');

  // Recharge la clé déjà enregistrée, si elle existe
  const saved = localStorage.getItem('jarvis_api_key');
  if (saved) input.value = saved;

  function open(e) {
    if (e) e.stopPropagation();
    panel.classList.remove('hidden');
  }

  function close(e) {
    if (e) e.stopPropagation();
    panel.classList.add('hidden');
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const key = input.value.trim();
    if (key) {
      localStorage.setItem('jarvis_api_key', key);
    }
    close();
  });

  // Empêche un clic dans le panneau de fermer/relancer le mode "parler"
  panel.addEventListener('click', (e) => e.stopPropagation());

  return {
    getApiKey: () => localStorage.getItem('jarvis_api_key')
  };
}
