function initCommands(getCity, hooks) {

  // --- Météo ---
  async function getWeather() {
    const city = getCity();
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return `Je ne trouve pas la ville ${city}.`;
      }
      const { latitude, longitude, name } = geoData.results[0];
      const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
      const wData = await wRes.json();
      const temp = Math.round(wData.current.temperature_2m);
      const desc = weatherCodeToText(wData.current.weather_code);
      return `À ${name}, il fait ${temp} degrés, ${desc}.`;
    } catch (err) {
      return "Je n'arrive pas à récupérer la météo pour le moment.";
    }
  }

  function weatherCodeToText(code) {
    if (code === 0) return "ciel dégagé";
    if (code <= 3) return "partiellement nuageux";
    if (code <= 48) return "brumeux";
    if (code <= 67) return "pluvieux";
    if (code <= 77) return "neigeux";
    if (code <= 82) return "averses";
    if (code <= 99) return "orageux";
    return "temps variable";
  }

  // --- Heure / date ---
  function getTime() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    return `Il est ${h} heure ${m}.`;
  }

  function getDate() {
    const now = new Date();
    return `Nous sommes le ${now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.`;
  }

  // --- Rappels ---
  function setReminder(minutes, text) {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Jarvis - Rappel', { body: text || 'Rappel !' });
      }
    }, minutes * 60 * 1000);
    return `Rappel programmé dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
  }

  // --- Minuteur avec son ---
  function playBeep(times) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      let t0 = ctx.currentTime;
      for (let i = 0; i < times; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(0.3, t0 + 0.02);
        gain.gain.linearRampToValueAtTime(0.001, t0 + 0.25);
        osc.start(t0);
        osc.stop(t0 + 0.3);
        t0 += 0.4;
      }
    } catch (e) {}
  }

  function startTimer(amount, unit) {
    const ms = unit.startsWith('seconde') ? amount * 1000 : amount * 60 * 1000;
    setTimeout(() => {
      playBeep(4);
      if (hooks && hooks.onTimerEnd) hooks.onTimerEnd();
    }, ms);
    return `Minuteur lancé pour ${amount} ${unit}${amount > 1 ? 's' : ''}.`;
  }

  // --- Pile ou face / dé ---
  function flipCoin() {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    return `${result} !`;
  }

  async function rollDice(faces) {
    const n = faces || 6;
    const result = Math.floor(Math.random() * n) + 1;
    if (hooks && hooks.onDiceRoll) {
      await hooks.onDiceRoll(n, result);
    }
    return `${result} !`;
  }

  // --- Calculs ---
  function calculate(t) {
    const match = t.match(/(-?\d+(?:[.,]\d+)?)\s*(plus|moins|fois|multipli[ée] par|divis[ée] par)\s*(-?\d+(?:[.,]\d+)?)/i);
    if (!match) return null;
    const a = parseFloat(match[1].replace(',', '.'));
    const op = match[2].toLowerCase();
    const b = parseFloat(match[3].replace(',', '.'));
    let result;
    if (op === 'plus') result = a + b;
    else if (op === 'moins') result = a - b;
    else if (op === 'fois' || op.startsWith('multipli')) result = a * b;
    else if (op.startsWith('divis')) {
      if (b === 0) return "Impossible de diviser par zéro.";
      result = a / b;
    }
    result = Math.round(result * 100) / 100;
    return `${match[1]} ${op} ${match[3]}, ça fait ${result}.`;
  }

  // --- Recherche web ---
  function buildSearchQuery(t) {
    let q = t.replace(/^(cherche[\s-]?moi|cherche|recherche[\s-]?moi|recherche)\s+/i, '').trim();
    q = q.replace(/\s+sur\s+(internet|google|le\s+web)$/i, '').trim();
    return q;
  }

  // --- Liste de courses / tâches ---
  function getTasks() {
    return JSON.parse(localStorage.getItem('jarvis_tasks') || '[]');
  }
  function saveTasks(arr) {
    localStorage.setItem('jarvis_tasks', JSON.stringify(arr));
  }
  function addTask(item) {
    const tasks = getTasks();
    tasks.push(item);
    saveTasks(tasks);
    return `${item} ajouté à la liste.`;
  }
  function listTasks() {
    const tasks = getTasks();
    if (tasks.length === 0) return "Ta liste est vide.";
    return "Dans ta liste : " + tasks.join(', ') + '.';
  }
  function removeTask(item) {
    let tasks = getTasks();
    const before = tasks.length;
    tasks = tasks.filter(x => !x.toLowerCase().includes(item.toLowerCase()));
    saveTasks(tasks);
    if (tasks.length < before) return `${item} retiré de la liste.`;
    return `Je n'ai pas trouvé ${item} dans la liste.`;
  }
  function clearTasks() {
    saveTasks([]);
    return "Liste vidée.";
  }

  // --- Routeur principal ---
  async function handle(text) {
    const t = text.toLowerCase();

    // 1. Calcul
    const calcResult = calculate(t);
    if (calcResult) return calcResult;

    // 2. Recherche web
    if (t.startsWith('cherche') || t.startsWith('recherche')) {
      const query = buildSearchQuery(t);
      if (query) {
        const url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
        return {
          text: `Voici ce que j'ai trouvé pour "${query}". Touche le lien en bas pour l'ouvrir.`,
          link: url,
          linkLabel: `Ouvrir : ${query}`
        };
      }
    }

    // 3. Liste de courses / tâches
    if (t.startsWith('ajoute')) {
      let item = t.replace(/^ajoute\s+/, '').replace(/\s+(à|a)\s+la\s+liste.*$/, '').trim();
      if (item) return addTask(item);
    }
    if ((t.includes('liste de courses') || t.includes('ma liste')) &&
        (t.includes('montre') || t.includes("qu'est") || t.includes('quest') || t.includes('affiche') || t.trim() === 'liste de courses')) {
      return listTasks();
    }
    if (t.startsWith('supprime') || t.startsWith('enlève') || t.startsWith('enleve') || t.startsWith('retire')) {
      let item = t.replace(/^(supprime|enlève|enleve|retire)\s+/, '').replace(/\s+de\s+la\s+liste.*$/, '').trim();
      if (item) return removeTask(item);
    }
    if (t.includes('vide la liste') || t.includes('efface la liste')) {
      return clearTasks();
    }

    // 4. Minuteur
    const timerMatch = t.match(/minuteur.*?(\d+)\s*(minute|seconde)/);
    if (timerMatch) {
      const amount = parseInt(timerMatch[1], 10);
      const unit = timerMatch[2];
      return startTimer(amount, unit);
    }

    // 5. Pile ou face
    if (t.includes('pile ou face') || t.includes('pile')) {
      return flipCoin();
    }

    // 6. Dé (déclenchement resserré pour éviter les faux positifs)
    const diceTrigger = (t.includes('lance') || t.includes('lancer') || t.includes('jette') || t.includes('roule')) &&
                         (t.includes('dé') || /\bde\b.*face/.test(t));
    if (diceTrigger) {
      const facesMatch = t.match(/(\d+)\s*face/);
      const faces = facesMatch ? parseInt(facesMatch[1], 10) : 6;
      return await rollDice(faces);
    }

    // 7. Météo
    if (t.includes('météo') || t.includes('meteo') || t.includes('temps qu\'il fait') || t.includes('temps fait')) {
      return await getWeather();
    }

    // 8. Heure / date
    if (t.includes('heure')) return getTime();
    if (t.includes('date') || t.includes('jour on est') || t.includes('quel jour')) return getDate();

    // 9. Rappel
    const reminderMatch = t.match(/rappel(?:le)?\s*(?:moi)?\s*(?:dans)?\s*(\d+)\s*minute/);
    if (reminderMatch) {
      const minutes = parseInt(reminderMatch[1], 10);
      return setReminder(minutes,
