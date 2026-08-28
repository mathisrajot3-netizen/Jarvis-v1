function initSettings() {
  const panel = document.getElementById('settingsPanel');
  const openBtn = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('closeSettingsBtn');
  const saveBtn = document.getElementById('saveKeyBtn');
  const input = document.getElementById('cityInput');

  const saved = localStorage.getItem('jarvis_city');
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
    const city = input.value.trim();
    if (city) {
      localStorage.setItem('jarvis_city', city);
    }
    close();
  });

  panel.addEventListener('click', (e) => e.stopPropagation());

  return {
    getCity: () => localStorage.getItem('jarvis_city') || 'Dunkerque'
  };
}
