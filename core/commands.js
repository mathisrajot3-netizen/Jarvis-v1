function initCommands(getCity) {

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

  function flipCoin() {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    return `${result} !`;
  }

  function rollDice(faces) {
    const n = faces || 6;
    const result = Math.floor(Math.random() * n) + 1;
    return `J'ai lancé un dé à ${n} faces... ${result} !`;
  }

  async function handle(text) {
    const t = text.toLowerCase();

    if (t.includes('pile ou face') || t.includes('pile')) {
      return flipCoin();
    }
    if (t.includes('dé') || t.includes('de ')) {
      const facesMatch = t.match(/(\d+)\s*face/);
      const faces = facesMatch ? parseInt(facesMatch[1], 10) : 6;
      return rollDice(faces);
    }
    if (t.includes('météo') || t.includes('meteo') || t.includes('temps qu\'il fait') || t.includes('temps fait')) {
      return await getWeather();
    }
    if (t.includes('heure')) {
      return getTime();
    }
    if (t.includes('date') || t.includes('jour on est') || t.includes('quel jour')) {
      return getDate();
    }
    const reminderMatch = t.match(/rappel(?:le)?\s*(?:moi)?\s*(?:dans)?\s*(\d+)\s*minute/);
    if (reminderMatch) {
      const minutes = parseInt(reminderMatch[1], 10);
      return setReminder(minutes, 'Rappel demandé');
    }
    if (t.includes('bonjour') || t.includes('salut')) {
      return "Bonjour, comment puis-je vous aider ?";
    }

    return "Je n'ai pas encore appris à faire ça, mais je progresse.";
  }

  return { handle };
}
