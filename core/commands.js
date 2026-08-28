function initCommands(getCity, hooks) {

  // ============================================================
  // MÉTÉO
  // ============================================================

  async function getWeather() {
    const city = getCity();

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`
      );

      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        return `Je ne trouve pas la ville ${city}.`;
      }

      const { latitude, longitude, name } = geoData.results[0];

      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
      );

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


  // ============================================================
  // HEURE / DATE
  // ============================================================

  function getTime() {
    const now = new Date();

    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');

    return `Il est ${h} heure ${m}.`;
  }


  function getDate() {
    const now = new Date();

    return `Nous sommes le ${now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })}.`;
  }


  // ============================================================
  // RAPPELS
  // ============================================================

  function setReminder(amount, unit, text) {

    let delay;

    if (unit && unit.startsWith('seconde')) {
      delay = amount * 1000;
    } else {
      delay = amount * 60 * 1000;
    }

    // Demande l'autorisation de notification si nécessaire
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }

    setTimeout(() => {

      const message = text || 'Rappel !';

      // Notification du navigateur
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification('Jarvis - Rappel', {
            body: message
          });

          return;
        } catch (e) {}
      }

      // Si les notifications ne fonctionnent pas,
      // on utilise une alerte comme solution de secours.
      try {
        alert('🔔 Jarvis : ' + message);
      } catch (e) {}

    }, delay);


    const unitText =
      unit && unit.startsWith('seconde')
        ? 'seconde'
        : 'minute';

    return `Très bien. Je te rappellerai dans ${amount} ${unitText}${amount > 1 ? 's' : ''}.`;
  }


  // ============================================================
  // MINUTEUR
  // ============================================================

  function playBeep(times) {

    try {

      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioCtx) return;

      const ctx = new AudioCtx();

      let t0 = ctx.currentTime;

      for (let i = 0; i < times; i++) {

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.value = 880;

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.001, t0);

        gain.gain.linearRampToValueAtTime(
          0.3,
          t0 + 0.02
        );

        gain.gain.linearRampToValueAtTime(
          0.001,
          t0 + 0.25
        );

        osc.start(t0);
        osc.stop(t0 + 0.3);

        t0 += 0.4;
      }

    } catch (e) {}
  }


  function startTimer(amount, unit) {

    const isSeconds =
      unit.toLowerCase().startsWith('seconde');

    const ms = isSeconds
      ? amount * 1000
      : amount * 60 * 1000;

    setTimeout(() => {

      playBeep(4);

      if (hooks && hooks.onTimerEnd) {
        hooks.onTimerEnd();
      }

    }, ms);


    const unitText = isSeconds
      ? 'seconde'
      : 'minute';

    return `Minuteur lancé pour ${amount} ${unitText}${amount > 1 ? 's' : ''}.`;
  }


  // ============================================================
  // PILE OU FACE
  // ============================================================

  function flipCoin() {

    const result =
      Math.random() < 0.5
        ? 'Pile'
        : 'Face';

    return `${result} !`;
  }


  // ============================================================
  // DÉ
  // ============================================================

  async function rollDice(faces) {

    const n = faces || 6;

    const result =
      Math.floor(Math.random() * n) + 1;

    if (hooks && hooks.onDiceRoll) {
      await hooks.onDiceRoll(n, result);
    }

    return `${result} !`;
  }


  // ============================================================
  // CALCULATEUR
  // ============================================================

  const numberWords = {
    zero: 0,
    un: 1,
    une: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
    six: 6,
    sept: 7,
    huit: 8,
    neuf: 9,
    dix: 10,
    onze: 11,
    douze: 12,
    treize: 13,
    quatorze: 14,
    quinze: 15,
    seize: 16,
    dixsept: 17,
    dixhuit: 18,
    dixneuf: 19,
    vingt: 20,
    trente: 30,
    quarante: 40,
    cinquante: 50,
    soixante: 60,
    cent: 100,
    mille: 1000
  };


  function normalizeNumberWords(text) {

    let t = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    t = t
      .replace(/-/g, ' ')
      .replace(/\bvingt et un\b/g, 'vingt un')
      .replace(/\btrente et un\b/g, 'trente un')
      .replace(/\bquarante et un\b/g, 'quarante un')
      .replace(/\bcinquante et un\b/g, 'cinquante un')
      .replace(/\bsoixante et un\b/g, 'soixante un')
      .replace(/\bsoixante dix\b/g, 'soixante dix')
      .replace(/\bquatre vingt\b/g, 'quatre vingt');

    return t;
  }


  function frenchNumberToValue(text) {

    let t = normalizeNumberWords(text);

    if (/^\d+(?:[.,]\d+)?$/.test(t)) {
      return parseFloat(t.replace(',', '.'));
    }

    const tokens = t
      .replace(/\bet\b/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    if (!tokens.length) return null;

    let total = 0;
    let current = 0;
    let found = false;

    for (const token of tokens) {

      if (token === 'million') {

        if (current === 0) current = 1;

        total += current * 1000000;
        current = 0;
        found = true;

        continue;
      }


      if (token === 'milliard') {

        if (current === 0) current = 1;

        total += current * 1000000000;
        current = 0;
        found = true;

        continue;
      }


      if (numberWords[token] !== undefined) {

        const value = numberWords[token];

        if (value === 100) {

          if (current === 0) current = 1;

          current *= 100;

        } else if (value === 1000) {

          if (current === 0) current = 1;

          total += current * 1000;
          current = 0;

        } else {

          current += value;
        }

        found = true;

        continue;
      }

      return null;
    }

    if (!found) return null;

    return total + current;
  }


  function replaceFrenchNumbers(text) {

    let t = normalizeNumberWords(text);

    const words = t.split(/\s+/);

    const output = [];

    let buffer = [];


    function flushBuffer() {

      if (!buffer.length) return;

      const value =
        frenchNumberToValue(buffer.join(' '));

      if (value !== null) {
        output.push(String(value));
      } else {
        output.push(...buffer);
      }

      buffer = [];
    }


    for (const word of words) {

      const clean =
        word.replace(/[.,!?]/g, '');

      const isNumberWord =
        numberWords[clean] !== undefined ||
        clean === 'million' ||
        clean === 'milliard';

      if (isNumberWord) {

        buffer.push(clean);

      } else {

        flushBuffer();
        output.push(word);
      }
    }


    flushBuffer();

    return output.join(' ');
  }


  function cleanCalculationText(text) {

    let t = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');


    // Expressions inutiles

    t = t
      .replace(/\bcombien font\b/g, '')
      .replace(/\bcombien fait\b/g, '')
      .replace(/\bcombien fais\b/g, '')
      .replace(/\bcalcule\b/g, '')
      .replace(/\bcalcul\b/g, '')
      .replace(/\bfais le calcul de\b/g, '')
      .replace(/\bcalcule moi\b/g, '')
      .replace(/\bcalcule-moi\b/g, '')
      .replace(/\bpeux tu calculer\b/g, '')
      .replace(/\bpeut tu calculer\b/g, '')
      .replace(/\bça fait\b/g, '')
      .replace(/\bfait\b/g, '')
      .replace(/\bs'il te plait\b/g, '')
      .replace(/\bs'il te plaît\b/g, '');


    // Multiplication

    t = t
      .replace(/\bmultipli[eé] par\b/g, '*')
      .replace(/\bmultiplie par\b/g, '*')
      .replace(/\bfois\b/g, '*')
      .replace(/\bx\b/g, '*');


    // Division

    t = t
      .replace(/\bdivis[eé] par\b/g, '/')
      .replace(/\bdivise par\b/g, '/')
      .replace(/\bdivisé par\b/g, '/');


    // Addition

    t = t.replace(/\bplus\b/g, '+');


    // Soustraction

    t = t.replace(/\bmoins\b/g, '-');


    // Puissances

    t = t
      .replace(/\bau carr[eé]\b/g, '^2')
      .replace(/\bau cube\b/g, '^3')
      .replace(/\bpuissance de\b/g, '^')
      .replace(/\bpuissance\b/g, '^');


    // Racine

    t = t.replace(
      /\bracine carr[eé]e? de\b/g,
      'sqrt '
    );


    // Pourcentage

    t = t.replace(
      /\bpour ?cent\b/g,
      '%'
    );


    // Egal à

    t = t.replace(
      /\s+egal(?:e)?\s+a.*$/g,
      ''
    );


    // Nombres français

    t = replaceFrenchNumbers(t);


    // Nettoyage

    t = t
      .replace(/,/g, '.')
      .replace(/\s+/g, ' ')
      .trim();


    return t;
  }


  function tokenizeExpression(expression) {

    const tokens = [];

    let i = 0;


    while (i < expression.length) {

      const char = expression[i];


      if (char === ' ') {
        i++;
        continue;
      }


      if (/[0-9.]/.test(char)) {

        let number = '';

        while (
          i < expression.length &&
          /[0-9.]/.test(expression[i])
        ) {

          number += expression[i];
          i++;
        }


        tokens.push({
          type: 'number',
          value: parseFloat(number)
        });

        continue;
      }


      if ('+-*/%^()'.includes(char)) {

        tokens.push({
          type: 'operator',
          value: char
        });

        i++;

        continue;
      }


      i++;
    }


    return tokens;
  }


  function evaluateExpression(expression) {

    const tokens =
      tokenizeExpression(expression);

    if (!tokens.length) return null;

    let position = 0;


    function parseExpression() {

      let value = parseTerm();


      while (
        position < tokens.length &&
        (
          tokens[position].value === '+' ||
          tokens[position].value === '-'
        )
      ) {

        const operator =
          tokens[position].value;

        position++;

        const right = parseTerm();

        if (right === null) return null;


        if (operator === '+') {
          value += right;
        } else {
          value -= right;
        }
      }


      return value;
    }


    function parseTerm() {

      let value = parsePower();


      while (
        position < tokens.length &&
        (
          tokens[position].value === '*' ||
          tokens[position].value === '/' ||
          tokens[position].value === '%'
        )
      ) {

        const operator =
          tokens[position].value;

        position++;

        const right = parsePower();

        if (right === null) return null;


        if (operator === '*') {
          value *= right;
        }


        if (operator === '/') {

          if (right === 0) {
            throw new Error('DIVISION_ZERO');
          }

          value /= right;
        }


        if (operator === '%') {
          value = value * right / 100;
        }
      }


      return value;
    }


    function parsePower() {

      let value = parseUnary();


      if (
        position < tokens.length &&
        tokens[position].value === '^'
      ) {

        position++;

        const exponent = parsePower();

        if (exponent === null) return null;

        value = Math.pow(
          value,
          exponent
        );
      }


      return value;
    }


    function parseUnary() {

      if (
        position < tokens.length &&
        tokens[position].value === '-'
      ) {

        position++;

        const value = parseUnary();

        return value === null
          ? null
          : -value;
      }


      if (
        position < tokens.length &&
        tokens[position].value === '+'
      ) {

        position++;

        return parseUnary();
      }


      if (
        position < tokens.length &&
        tokens[position].value === '('
      ) {

        position++;

        const value = parseExpression();


        if (
          position >= tokens.length ||
          tokens[position].value !== ')'
        ) {
          return null;
        }


        position++;

        return value;
      }


      if (
        position < tokens.length &&
        tokens[position].type === 'number'
      ) {

        const value =
          tokens[position].value;

        position++;

        return value;
      }


      return null;
    }


    const result = parseExpression();


    if (position !== tokens.length) {
      return null;
    }


    return result;
  }


  function calculate(text) {

    const expression =
      cleanCalculationText(text);


    // Racine carrée

    const sqrtMatch =
      expression.match(
        /^sqrt\s+(-?\d+(?:\.\d+)?)$/
      );


    if (sqrtMatch) {

      const value =
        parseFloat(sqrtMatch[1]);


      if (value < 0) {
        return "Je ne peux pas calculer la racine carrée d'un nombre négatif.";
      }


      const result =
        Math.sqrt(value);


      return `La racine carrée de ${value} est ${formatNumber(result)}.`;
    }


    // Il faut au minimum un nombre
    // et un opérateur.

    if (!/[0-9]/.test(expression)) {
      return null;
    }


    if (!/[+\-*/%^]/.test(expression)) {
      return null;
    }


    try {

      const result =
        evaluateExpression(expression);


      if (
        result === null ||
        !Number.isFinite(result)
      ) {
        return null;
      }


      return `Le résultat est ${formatNumber(result)}.`;

    } catch (err) {

      if (err.message === 'DIVISION_ZERO') {
        return "Impossible de diviser par zéro.";
      }

      return null;
    }
  }


  function formatNumber(number) {

    if (
      Math.abs(
        number - Math.round(number)
      ) < 0.000000001
    ) {

      return String(
        Math.round(number)
      );
    }


    return Number(
      number.toFixed(8)
    )
      .toString()
      .replace('.', ',');
  }


  // ============================================================
  // RECHERCHE WEB
  // ============================================================

  function buildSearchQuery(t) {

    let q = t
      .replace(
        /^(cherche[\s-]?moi|cherche|recherche[\s-]?moi|recherche)\s+/i,
        ''
      )
      .trim();


    q = q
      .replace(
        /\s+sur\s+(internet|google|le\s+web)$/i,
        ''
      )
      .trim();


    return q;
  }


  // ============================================================
  // LISTE DE COURSES / TÂCHES
  // ============================================================

  function getTasks() {

    try {

      return JSON.parse(
        localStorage.getItem('jarvis_tasks') || '[]'
      );

    } catch (e) {

      return [];
    }
  }


  function saveTasks(arr) {

    localStorage.setItem(
      'jarvis_tasks',
      JSON.stringify(arr)
    );
  }


  function addTask(item) {

    const tasks = getTasks();

    tasks.push(item);

    saveTasks(tasks);

    return `${item} ajouté à la liste.`;
  }


  function listTasks() {

    const tasks = getTasks();


    if (tasks.length === 0) {
      return "Ta liste est vide.";
    }


    return (
      "Dans ta liste : " +
      tasks.join(', ') +
      '.'
    );
  }


  function removeTask(item) {

    let tasks = getTasks();

    const before = tasks.length;


    tasks = tasks.filter(
      x =>
        !x
          .toLowerCase()
          .includes(item.toLowerCase())
    );


    saveTasks(tasks);


    if (tasks.length < before) {
      return `${item} retiré de la liste.`;
    }


    return `Je n'ai pas trouvé ${item} dans la liste.`;
  }


  function clearTasks() {

    saveTasks([]);

    return "Liste vidée.";
  }


  // ============================================================
  // ROUTEUR PRINCIPAL
  // ============================================================

  async function handle(text) {

    const t =
      text
        .toLowerCase()
        .trim();


    // ----------------------------------------------------------
    // 1. CALCUL
    // ----------------------------------------------------------

    const calcResult =
      calculate(t);


    if (calcResult) {
      return calcResult;
    }


    // ----------------------------------------------------------
    // 2. RECHERCHE WEB
    // ----------------------------------------------------------

    if (
      t.startsWith('cherche') ||
      t.startsWith('recherche')
    ) {

      const query =
        buildSearchQuery(t);


      if (query) {

        const url =
          'https://www.google.com/search?q=' +
          encodeURIComponent(query);


        return {

          text:
            `Voici ce que j'ai trouvé pour "${query}". ` +
            `Touche le lien en bas pour l'ouvrir.`,

          link: url,

          linkLabel:
            `Ouvrir : ${query}`
        };
      }
    }


    // ----------------------------------------------------------
    // 3. LISTE
    // ----------------------------------------------------------

    if (t.startsWith('ajoute')) {

      let item =
        t
          .replace(/^ajoute\s+/, '')
          .replace(
            /\s+(à|a)\s+la\s+liste.*$/,
            ''
          )
          .trim();


      if (item) {
        return addTask(item);
      }
    }


    if (
      (
        t.includes('liste de courses') ||
        t.includes('ma liste')
      ) &&
      (
        t.includes('montre') ||
        t.includes("qu'est") ||
        t.includes('quest') ||
        t.includes('affiche') ||
        t.trim() === 'liste de courses'
      )
    ) {

      return listTasks();
    }


    if (
      t.startsWith('supprime') ||
      t.startsWith('enlève') ||
      t.startsWith('enleve') ||
      t.startsWith('retire')
    ) {

      let item =
        t
          .replace(
            /^(supprime|enlève|enleve|retire)\s+/,
            ''
          )
          .replace(
            /\s+de\s+la\s+liste.*$/,
            ''
          )
          .trim();


      if (item) {
        return removeTask(item);
      }
    }


    if (
      t.includes('vide la liste') ||
      t.includes('efface la liste')
    ) {

      return clearTasks();
    }


    // ----------------------------------------------------------
    // 4. MINUTEUR
    // ----------------------------------------------------------

    const timerMatch =
      t.match(
        /(?:minuteur|chrono|compte[ -]?à[ -]?rebours).*?(\d+(?:[.,]\d+)?)\s*(minutes?|secondes?)/i
      );


    if (timerMatch) {

      const amount =
        parseFloat(
          timerMatch[1].replace(',', '.')
        );


      const unit =
        timerMatch[2];


      return startTimer(
        amount,
        unit
      );
    }


    // ----------------------------------------------------------
    // 5. PILE OU FACE
    // ----------------------------------------------------------

    if (
      t.includes('pile ou face') ||
      t === 'pile' ||
      t.includes('lance une pièce') ||
      t.includes('lance une piece')
    ) {

      return flipCoin();
    }


    // ----------------------------------------------------------
    // 6. DÉ
    // ----------------------------------------------------------

    const diceTrigger =
      (
        t.includes('lance') ||
        t.includes('lancer') ||
        t.includes('jette') ||
        t.includes('roule')
      ) &&
      (
        t.includes('dé') ||
        t.includes('de ') ||
        /\d+\s*face/.test(t)
      );


    if (diceTrigger) {

      const facesMatch =
        t.match(/(\d+)\s*face/);


      const faces =
        facesMatch
          ? parseInt(
              facesMatch[1],
              10
            )
          : 6;


      return await rollDice(faces);
    }


    // ----------------------------------------------------------
    // 7. MÉTÉO
    // ----------------------------------------------------------

    if (
      t.includes('météo') ||
      t.includes('meteo') ||
      t.includes("temps qu'il fait") ||
      t.includes('temps fait')
    ) {

      return await getWeather();
    }


    // ----------------------------------------------------------
    // 8. HEURE / DATE
    // ----------------------------------------------------------

    if (t.includes('heure')) {
      return getTime();
    }


    if (
      t.includes('date') ||
      t.includes('jour on est') ||
      t.includes('quel jour')
    ) {

      return getDate();
    }


    // ----------------------------------------------------------
    // 9. RAPPEL
    // ----------------------------------------------------------

    const reminderMatch =
      t.match(
        /(?:rappelle(?:[- ]?moi)?|rappel(?:[- ]?moi)?).*?(?:dans\s*)?(\d+(?:[.,]\d+)?)\s*(minutes?|secondes?)/i
      );


    if (reminderMatch) {

      const amount =
        parseFloat(
          reminderMatch[1].replace(',', '.')
        );


      const unit =
        reminderMatch[2];


      return setReminder(
        amount,
        unit,
        'Rappel demandé'
      );
    }


    // ----------------------------------------------------------
    // 10. SALUTATION
    // ----------------------------------------------------------

    if (
      t.includes('bonjour') ||
      t.includes('salut') ||
      t.includes('hello')
    ) {

      return "Bonjour, comment puis-je vous aider ?";
    }


    // ----------------------------------------------------------
    // 11. RÉPONSE PAR DÉFAUT
    // ----------------------------------------------------------

    return "Je n'ai pas encore appris à faire ça, mais je progresse.";
  }


  // ============================================================
  // API PUBLIQUE
  // ============================================================

  return {
    handle
  };
}
