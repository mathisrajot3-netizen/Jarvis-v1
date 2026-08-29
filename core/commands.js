function initCommands(getCity, hooks) {

  // ============================================================
  // VARIABLES
  // ============================================================

  let activeTimer = null;
  let activeTimerInfo = null;

  const reminders = [];


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

      const {
        latitude,
        longitude,
        name
      } = geoData.results[0];


      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
      );

      const wData = await wRes.json();

      const temp =
        Math.round(wData.current.temperature_2m);

      const weatherCode =
        wData.current.weather_code;

      const desc =
        weatherCodeToText(weatherCode);

      const icon =
        weatherCodeToIcon(weatherCode);


      return {
        text: `À ${name}, il fait ${temp} degrés, ${desc}.`,
        weatherIcon: icon
      };

    } catch (err) {

      return "Je n'arrive pas à récupérer la météo pour le moment.";
    }
  }


  function weatherCodeToText(code) {

    if (code === 0) {
      return "ciel dégagé";
    }

    if (code <= 3) {
      return "partiellement nuageux";
    }

    if (code <= 48) {
      return "brumeux";
    }

    if (code <= 67) {
      return "pluvieux";
    }

    if (code <= 77) {
      return "neigeux";
    }

    if (code <= 82) {
      return "averses";
    }

    if (code <= 99) {
      return "orageux";
    }

    return "temps variable";
  }


  function weatherCodeToIcon(code) {

    if (code === 0) {
      return "☀️";
    }

    if (code >= 1 && code <= 3) {
      return "☁️";
    }

    if (code >= 45 && code <= 48) {
      return "☁️";
    }

    if (code >= 51 && code <= 67) {
      return "🌧️";
    }

    if (code >= 71 && code <= 77) {
      return "❄️";
    }

    if (code >= 80 && code <= 82) {
      return "🌧️";
    }

    if (code >= 95 && code <= 99) {
      return "⛈️";
    }

    return "☁️";
  }


  // ============================================================
  // HEURE / DATE
  // ============================================================

  function getTime() {

    const now = new Date();

    const h =
      now.getHours();

    const m =
      now.getMinutes()
        .toString()
        .padStart(2, '0');

    if (h === 0) {

      return m === '00'
        ? "Il est minuit."
        : `Il est minuit ${m}.`;
    }

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
  // SON MINUTEUR
  // ============================================================

  function playBeep(times) {

    try {

      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioCtx) {
        return;
      }

      const ctx =
        new AudioCtx();

      let startTime =
        ctx.currentTime;


      for (let i = 0; i < times; i++) {

        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();


        oscillator.frequency.value =
          880;


        oscillator.connect(gain);
        gain.connect(ctx.destination);


        gain.gain.setValueAtTime(
          0.001,
          startTime
        );


        gain.gain.linearRampToValueAtTime(
          0.3,
          startTime + 0.02
        );


        gain.gain.linearRampToValueAtTime(
          0.001,
          startTime + 0.25
        );


        oscillator.start(startTime);

        oscillator.stop(
          startTime + 0.3
        );


        startTime += 0.4;
      }

    } catch (e) {}
  }


  // ============================================================
  // UNITÉS DE TEMPS (secondes / minutes / heures)
  // ============================================================

  function parseUnitType(unit) {

    const u =
      unit.toLowerCase();

    if (u.startsWith('seconde')) {
      return 'seconde';
    }

    if (u.startsWith('heure')) {
      return 'heure';
    }

    return 'minute';
  }


  function unitTypeToMilliseconds(amount, unitType) {

    if (unitType === 'seconde') {
      return amount * 1000;
    }

    if (unitType === 'heure') {
      return amount * 60 * 60 * 1000;
    }

    return amount * 60 * 1000;
  }


  function unitTypeLabel(unitType, amount) {

    return `${unitType}${amount > 1 ? 's' : ''}`;
  }


  // ============================================================
  // MINUTEUR
  // ============================================================

  function startTimer(amount, unit) {

    if (activeTimer !== null) {

      clearTimeout(activeTimer);

      activeTimer = null;
      activeTimerInfo = null;
    }


    const unitType =
      parseUnitType(unit);


    const milliseconds =
      unitTypeToMilliseconds(
        amount,
        unitType
      );


    activeTimerInfo = {
      amount,
      unit: unitType
    };


    activeTimer =
      setTimeout(() => {

        activeTimer = null;
        activeTimerInfo = null;

        playBeep(4);


        if (
          hooks &&
          hooks.onTimerEnd
        ) {

          hooks.onTimerEnd();
        }

      }, milliseconds);


    return `Minuteur lancé pour ${amount} ${unitTypeLabel(unitType, amount)}.`;
  }


  function cancelTimer() {

    if (activeTimer === null) {

      return "Il n'y a aucun minuteur en cours.";
    }


    clearTimeout(activeTimer);

    activeTimer = null;
    activeTimerInfo = null;


    return "Minuteur annulé.";
  }


  // ============================================================
  // RAPPELS
  // ============================================================

  function requestNotificationPermission() {

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {

      try {

        Notification.requestPermission()
          .catch(() => {});

      } catch (e) {}
    }
  }


  function sendReminderNotification(text) {

    const message =
      text || 'Rappel !';


    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {

      try {

        new Notification(
          'Jarvis - Rappel',
          {
            body: message
          }
        );

        return;

      } catch (e) {}
    }


    try {

      alert(
        '🔔 Jarvis : ' + message
      );

    } catch (e) {}
  }


  function setReminder(
    amount,
    unit,
    text
  ) {

    requestNotificationPermission();


    const unitType =
      parseUnitType(unit);


    const milliseconds =
      unitTypeToMilliseconds(
        amount,
        unitType
      );


    const reminder = {

      id:
        Date.now() +
        Math.random(),

      timeout: null,

      amount,

      unit: unitType,

      text:
        text || 'Rappel !'
    };


    reminder.timeout =
      setTimeout(() => {

        sendReminderNotification(
          reminder.text
        );


        const index =
          reminders.indexOf(
            reminder
          );


        if (index !== -1) {

          reminders.splice(
            index,
            1
          );
        }

      }, milliseconds);


    reminders.push(
      reminder
    );


    return `Rappel programmé dans ${amount} ${unitTypeLabel(unitType, amount)}.`;
  }


  function cancelReminders() {

    if (reminders.length === 0) {

      return "Il n'y a aucun rappel en cours.";
    }


    for (
      const reminder of reminders
    ) {

      clearTimeout(
        reminder.timeout
      );
    }


    reminders.length = 0;


    return "Tous les rappels ont été annulés.";
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

    const n =
      faces || 6;


    const result =
      Math.floor(
        Math.random() * n
      ) + 1;


    if (
      hooks &&
      hooks.onDiceRoll
    ) {

      await hooks.onDiceRoll(
        n,
        result
      );
    }


    return `${result} !`;
  }


  // ============================================================
  // NOMBRES FRANÇAIS
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

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/-/g, ' ');
  }


  function frenchNumberToValue(text) {

    const normalized =
      normalizeNumberWords(text);


    if (
      /^\d+(?:[.,]\d+)?$/.test(
        normalized
      )
    ) {

      return parseFloat(
        normalized.replace(',', '.')
      );
    }


    const tokens =
      normalized
        .replace(/\bet\b/g, ' ')
        .split(/\s+/)
        .filter(Boolean);


    if (!tokens.length) {
      return null;
    }


    let total = 0;
    let current = 0;
    let found = false;


    for (const token of tokens) {

      if (token === 'million') {

        if (current === 0) {
          current = 1;
        }

        total +=
          current * 1000000;

        current = 0;
        found = true;

        continue;
      }


      if (token === 'milliard') {

        if (current === 0) {
          current = 1;
        }

        total +=
          current * 1000000000;

        current = 0;
        found = true;

        continue;
      }


      if (
        numberWords[token] !== undefined
      ) {

        const value =
          numberWords[token];


        if (value === 100) {

          if (current === 0) {
            current = 1;
          }

          current *= 100;

        } else if (value === 1000) {

          if (current === 0) {
            current = 1;
          }

          total +=
            current * 1000;

          current = 0;

        } else {

          current += value;
        }


        found = true;

        continue;
      }


      return null;
    }


    if (!found) {
      return null;
    }


    return total + current;
  }


  function replaceFrenchNumbers(text) {

    const normalized =
      normalizeNumberWords(text);


    const words =
      normalized.split(/\s+/);


    const output = [];

    let buffer = [];


    function flushBuffer() {

      if (!buffer.length) {
        return;
      }


      const value =
        frenchNumberToValue(
          buffer.join(' ')
        );


      if (value !== null) {

        output.push(
          String(value)
        );

      } else {

        output.push(
          ...buffer
        );
      }


      buffer = [];
    }


    for (const word of words) {

      const clean =
        word.replace(
          /[.,!?]/g,
          ''
        );


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


  // ============================================================
  // NETTOYAGE CALCUL
  // ============================================================

  function cleanCalculationText(text) {

    let t =
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');


    t = t

      .replace(
        /\bcombien font\b/g,
        ''
      )

      .replace(
        /\bcombien fait\b/g,
        ''
      )

      .replace(
        /\bcombien fais\b/g,
        ''
      )

      .replace(
        /\bcalcule moi\b/g,
        ''
      )

      .replace(
        /\bcalcule-moi\b/g,
        ''
      )

      .replace(
        /\bcalcule\b/g,
        ''
      )

      .replace(
        /\bcalcul\b/g,
        ''
      )

      .replace(
        /\bfais le calcul de\b/g,
        ''
      )

      .replace(
        /\bpeux tu calculer\b/g,
        ''
      )

      .replace(
        /\bpeut tu calculer\b/g,
        ''
      )

      .replace(
        /\bça fait\b/g,
        ''
      )

      .replace(
        /\bca fait\b/g,
        ''
      )

      .replace(
        /\bs'il te plait\b/g,
        ''
      );


    t = t

      .replace(
        /\bmultipli[eé]\s+par\b/g,
        '*'
      )

      .replace(
        /\bmultiplie\s+par\b/g,
        '*'
      )

      .replace(
        /\bfois\b/g,
        '*'
      )

      .replace(
        /\bx\b/g,
        '*'
      );


    t = t.replace(
      /\bdivis[eé]\s+par\b/g,
      '/'
    );


    t = t.replace(
      /\bdivise\s+par\b/g,
      '/'
    );


    t = t.replace(
      /\bplus\b/g,
      '+'
    );


    t = t.replace(
      /\bmoins\b/g,
      '-'
    );


    t = t

      .replace(
        /\bau carr[eé]\b/g,
        '^2'
      )

      .replace(
        /\bau cube\b/g,
        '^3'
      )

      .replace(
        /\bpuissance de\b/g,
        '^'
      )

      .replace(
        /\bpuissance\b/g,
        '^'
      );


    t = t.replace(
      /\bracine carr[eé]e?\s+de\b/g,
      'sqrt '
    );


    t = t.replace(
      /\bpour\s*cent\b/g,
      '%'
    );


    t =
      replaceFrenchNumbers(t);


    t =
      t
        .replace(/,/g, '.')
        .replace(/\s+/g, ' ')
        .trim();


    return t;
  }


  // ============================================================
  // TOKENIZER
  // ============================================================

  function tokenizeExpression(expression) {

    const tokens = [];

    let i = 0;


    while (i < expression.length) {

      const char =
        expression[i];


      if (char === ' ') {

        i++;

        continue;
      }


      if (/[0-9.]/.test(char)) {

        let number = '';


        while (
          i < expression.length &&
          /[0-9.]/.test(
            expression[i]
          )
        ) {

          number +=
            expression[i];

          i++;
        }


        const value =
          parseFloat(number);


        if (Number.isFinite(value)) {

          tokens.push({
            type: 'number',
            value
          });
        }


        continue;
      }


      if (
        '+-*/%^()'.includes(char)
      ) {

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


  // ============================================================
  // ÉVALUATION
  // ============================================================

  function evaluateExpression(expression) {

    const tokens =
      tokenizeExpression(
        expression
      );


    if (!tokens.length) {
      return null;
    }


    let position = 0;


    function parseExpression() {

      let value =
        parseTerm();


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


        const right =
          parseTerm();


        if (right === null) {
          return null;
        }


        if (operator === '+') {
          value += right;
        } else {
          value -= right;
        }
      }


      return value;
    }


    function parseTerm() {

      let value =
        parsePower();


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


        const right =
          parsePower();


        if (right === null) {
          return null;
        }


        if (operator === '*') {
          value *= right;
        }


        if (operator === '/') {

          if (right === 0) {
            throw new Error(
              'DIVISION_ZERO'
            );
          }

          value /= right;
        }


        if (operator === '%') {

          value =
            value * right / 100;
        }
      }


      return value;
    }


    function parsePower() {

      let value =
        parseUnary();


      if (
        position < tokens.length &&
        tokens[position].value === '^'
      ) {

        position++;


        const exponent =
          parsePower();


        if (exponent === null) {
          return null;
        }


        value =
          Math.pow(
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


        const value =
          parseUnary();


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


        const value =
          parseExpression();


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


    const result =
      parseExpression();


    if (
      position !== tokens.length
    ) {

      return null;
    }


    return result;
  }


  function formatNumber(number) {

    if (
      Math.abs(
        number -
        Math.round(number)
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


  function calculate(text) {

    const expression =
      cleanCalculationText(text);


    const sqrtMatch =
      expression.match(
        /^sqrt\s+(-?\d+(?:\.\d+)?)$/
      );


    if (sqrtMatch) {

      const value =
        parseFloat(
          sqrtMatch[1]
        );


      if (value < 0) {

        return "Je ne peux pas calculer la racine carrée d'un nombre négatif.";
      }


      const result =
        Math.sqrt(value);


      return `La racine carrée de ${value} est ${formatNumber(result)}.`;
    }


    if (!/[0-9]/.test(expression)) {
      return null;
    }


    if (!/[+\-*/%^]/.test(expression)) {
      return null;
    }


    try {

      const result =
        evaluateExpression(
          expression
        );


      if (
        result === null ||
        !Number.isFinite(result)
      ) {

        return null;
      }


      return `Le résultat est ${formatNumber(result)}.`;

    } catch (err) {

      if (
        err.message ===
        'DIVISION_ZERO'
      ) {

        return "Impossible de diviser par zéro.";
      }


      return null;
    }
  }


  // ============================================================
  // RECHERCHE
  // ============================================================

  function buildSearchQuery(t) {

    let q =
      t
        .replace(
          /^(cherche[\s-]?moi|cherche|recherche[\s-]?moi|recherche)\s+/i,
          ''
        )
        .trim();


    q =
      q
        .replace(
          /\s+sur\s+(internet|google|le\s+web)$/i,
          ''
        )
        .trim();


    return q;
  }


  // ============================================================
  // LISTE
  // ============================================================

  function getTasks() {

    try {

      return JSON.parse(
        localStorage.getItem(
          'jarvis_tasks'
        ) || '[]'
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

    const tasks =
      getTasks();


    tasks.push(item);

    saveTasks(tasks);


    return `${item} ajouté à la liste.`;
  }


  function listTasks() {

    const tasks =
      getTasks();


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

    let tasks =
      getTasks();


    const before =
      tasks.length;


    tasks =
      tasks.filter(
        x =>
          !x
            .toLowerCase()
            .includes(
              item.toLowerCase()
            )
      );


    saveTasks(tasks);


    if (
      tasks.length < before
    ) {

      return `${item} retiré de la liste.`;
    }


    return `Je n'ai pas trouvé ${item} dans la liste.`;
  }


  function clearTasks() {

    saveTasks([]);

    return "Liste vidée.";
  }


  // ============================================================
  // ROUTEUR
  // ============================================================

  async function handle(text) {

    const t =
      text
        .toLowerCase()
        .trim();


    // ----------------------------------------------------------
    // ANNULATION MINUTEUR
    // ----------------------------------------------------------

    if (
      t.includes('annule le minuteur') ||
      t.includes('annule mon minuteur') ||
      t.includes('annuler le minuteur') ||
      t.includes('stoppe le minuteur') ||
      t.includes('stop le minuteur') ||
      t.includes('arrête le minuteur') ||
      t.includes('arrete le minuteur') ||
      t.includes('annule le chrono') ||
      t.includes('stoppe le chrono') ||
      t.includes('stop le chrono') ||
      t.includes('arrête le chrono') ||
      t.includes('arrete le chrono') ||
      t === 'annule le minuteur' ||
      t === 'stop'
    ) {

      return cancelTimer();
    }


    // ----------------------------------------------------------
    // ANNULATION RAPPELS
    // ----------------------------------------------------------

    if (
      t.includes('annule tous les rappels') ||
      t.includes('annule mes rappels') ||
      t.includes('supprime tous les rappels') ||
      t.includes('efface tous les rappels')
    ) {

      return cancelReminders();
    }


    // ----------------------------------------------------------
    // CALCUL
    // ----------------------------------------------------------

    const calcResult =
      calculate(t);


    if (calcResult) {
      return calcResult;
    }


    // ----------------------------------------------------------
    // RECHERCHE
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
            `Voici ce que j'ai trouvé pour "${query}". Touche le lien en bas pour l'ouvrir.`,

          link: url,

          linkLabel:
            `Ouvrir : ${query}`
        };
      }
    }


    // ----------------------------------------------------------
    // LISTE
    // ----------------------------------------------------------

    if (
      t.startsWith('ajoute')
    ) {

      let item =
        t
          .replace(
            /^ajoute\s+/,
            ''
          )
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
    // MINUTEUR
    // (placé avant MÉTÉO/HEURE/DATE pour éviter que "heure"
    // dans "minuteur de 2 heures" ne soit intercepté ailleurs)
    // ----------------------------------------------------------

    const timerMatch =
      t.match(
        /(?:mets|met|lance|lancer|démarre|demarre|active)?\s*(?:un\s+)?(?:minuteur|chrono|compte[ -]?à[ -]?rebours)\s*(?:de\s+|pour\s+)?(\d+(?:[.,]\d+)?)\s*(minutes?|secondes?|heures?)/i
      );


    if (timerMatch) {

      const amount =
        parseFloat(
          timerMatch[1]
            .replace(',', '.')
        );


      const unit =
        timerMatch[2];


      return startTimer(
        amount,
        unit
      );
    }


    const timerMatchReverse =
      t.match(
        /(?:dans\s+)?(\d+(?:[.,]\d+)?)\s*(minutes?|secondes?|heures?).*(?:minuteur|chrono)/i
      );


    if (timerMatchReverse) {

      const amount =
        parseFloat(
          timerMatchReverse[1]
            .replace(',', '.')
        );


      const unit =
        timerMatchReverse[2];


      return startTimer(
        amount,
        unit
      );
    }


    // ----------------------------------------------------------
    // RAPPEL
    // (placé avant MÉTÉO/HEURE/DATE : sinon "rappelle-moi dans
    // 1 heure" était intercepté par le bloc HEURE)
    // ----------------------------------------------------------

    const reminderMatch =
      t.match(
        /(?:rappelle(?:[- ]?moi)?|rappel(?:[- ]?moi)?).*?(?:dans\s+)?(\d+(?:[.,]\d+)?)\s*(minutes?|secondes?|heures?)/i
      );


    if (reminderMatch) {

      const amount =
        parseFloat(
          reminderMatch[1]
            .replace(',', '.')
        );


      const unit =
        reminderMatch[2];


      return setReminder(
        amount,
        unit,
        'Rappel demandé'
      );
    }


    const reminderReverse =
      t.match(
        /dans\s+(\d+(?:[.,]\d+)?)\s*(minutes?|secondes?|heures?).*(?:rappelle|rappel)/i
      );


    if (reminderReverse) {

      const amount =
        parseFloat(
          reminderReverse[1]
            .replace(',', '.')
        );


      const unit =
        reminderReverse[2];


      return setReminder(
        amount,
        unit,
        'Rappel demandé'
      );
    }


    // ----------------------------------------------------------
    // PILE OU FACE
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
    // DÉ
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
        t.match(
          /(\d+)\s*face/
        );


      const faces =
        facesMatch
          ? parseInt(
              facesMatch[1],
              10
            )
          : 6;


      return await rollDice(
        faces
      );
    }


    // ----------------------------------------------------------
    // MÉTÉO
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
    // HEURE
    // ----------------------------------------------------------

    if (
      t.includes('quelle heure') ||
      t.includes("l'heure") ||
      t === 'heure' ||
      t.includes('heure est il') ||
      t.includes('heure est-il') ||
      t.includes('heure')
    ) {

      return getTime();
    }


    // ----------------------------------------------------------
    // DATE
    // ----------------------------------------------------------

    if (
      t.includes('date') ||
      t.includes('quel jour') ||
      t.includes('quel jour sommes nous') ||
      t.includes('quel jour on est') ||
      t.includes('jour on est')
    ) {

      return getDate();
    }


    // ----------------------------------------------------------
    // SALUTATION
    // ----------------------------------------------------------

    if (
      t.includes('bonjour') ||
      t.includes('salut') ||
      t.includes('hello')
    ) {

      return "Bonjour, comment puis-je vous aider ?";
    }


    // ----------------------------------------------------------
    // PAR DÉFAUT
    // ----------------------------------------------------------

    return "Je n'ai pas encore appris à faire ça, mais je progresse.";
  }


  return {
    handle
  };
}
