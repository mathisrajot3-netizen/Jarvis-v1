function initCommands(getCity, hooks) {

  // =========================================================
  // MÉTÉO
  // =========================================================

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

      const desc =
        weatherCodeToText(
          wData.current.weather_code
        );

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


  // =========================================================
  // HEURE / DATE
  // =========================================================

  function getTime() {

    const now = new Date();

    const h =
      now.getHours();

    const m =
      now.getMinutes()
        .toString()
        .padStart(2, "0");

    return `Il est ${h} heure ${m}.`;
  }


  function getDate() {

    const now = new Date();

    return `Nous sommes le ${
      now.toLocaleDateString(
        "fr-FR",
        {
          weekday: "long",
          day: "numeric",
          month: "long"
        }
      )
    }.`;
  }


  // =========================================================
  // RAPPELS
  // =========================================================

  function setReminder(minutes, text) {

    if (
      "Notification" in window &&
      Notification.permission !== "granted"
    ) {
      Notification.requestPermission();
    }

    setTimeout(() => {

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(
          "Jarvis - Rappel",
          {
            body: text || "Rappel !"
          }
        );
      }

    }, minutes * 60 * 1000);

    return `Rappel programmé dans ${minutes} minute${
      minutes > 1 ? "s" : ""
    }.`;
  }


  // =========================================================
  // MINUTEUR
  // =========================================================

  function playBeep(times) {

    try {

      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      const ctx =
        new AudioCtx();

      let t0 =
        ctx.currentTime;

      for (
        let i = 0;
        i < times;
        i++
      ) {

        const osc =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        osc.frequency.value =
          880;

        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(
          0.001,
          t0
        );

        gain.gain.linearRampToValueAtTime(
          0.3,
          t0 + 0.02
        );

        gain.gain.linearRampToValueAtTime(
          0.001,
          t0 + 0.25
        );

        osc.start(t0);

        osc.stop(
          t0 + 0.3
        );

        t0 += 0.4;
      }

    } catch (e) {}
  }


  function startTimer(amount, unit) {

    const ms =
      unit.startsWith("seconde")
        ? amount * 1000
        : amount * 60 * 1000;

    setTimeout(() => {

      playBeep(4);

      if (
        hooks &&
        hooks.onTimerEnd
      ) {
        hooks.onTimerEnd();
      }

    }, ms);

    return `Minuteur lancé pour ${amount} ${unit}${
      amount > 1 ? "s" : ""
    }.`;
  }


  // =========================================================
  // PILE OU FACE
  // =========================================================

  function flipCoin() {

    const result =
      Math.random() < 0.5
        ? "Pile"
        : "Face";

    return `${result} !`;
  }


  // =========================================================
  // DÉ
  // =========================================================

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


  // =========================================================
  // CALCULATEUR JARVIS
  // =========================================================

  /*
   * Conversion des nombres français.
   *
   * Exemples :
   *
   * vingt       -> 20
   * vingt-cinq  -> 25
   * cent quatre -> 104
   * deux cents  -> 200
   * mille deux  -> 1002
   */

  const numberUnits = {

    zéro: 0,
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
    cents: 100,

    mille: 1000,

    million: 1000000,
    millions: 1000000
  };


  function cleanNumberWord(word) {

    return word
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[-']/g, "")
      .replace(/\s+/g, "");
  }


  function parseFrenchNumber(text) {

    let original =
      text
        .toLowerCase()
        .trim();


    original =
      original
        .replace(
          /[\u2010\u2011\u2012\u2013\u2014]/g,
          "-"
        );


    const words =
      original
        .split(/[\s-]+/)
        .filter(Boolean);


    if (!words.length) {
      return null;
    }


    let total = 0;
    let current = 0;

    let found = false;


    for (let raw of words) {

      const word =
        cleanNumberWord(raw);


      /*
       * "et" ne change pas la valeur.
       */

      if (word === "et") {
        continue;
      }


      /*
       * Nombres directs.
       */

      if (
        Object.prototype.hasOwnProperty.call(
          numberUnits,
          word
        )
      ) {

        const value =
          numberUnits[word];

        found = true;


        /*
         * million / mille
         */

        if (
          value === 1000000
        ) {

          if (current === 0) {
            current = 1;
          }

          total +=
            current * value;

          current = 0;

        } else if (
          value === 1000
        ) {

          if (current === 0) {
            current = 1;
          }

          total +=
            current * 1000;

          current = 0;

        } else if (
          value === 100
        ) {

          if (current === 0) {
            current = 1;
          }

          current *= 100;

        } else {

          /*
           * Cas spéciaux :
           *
           * vingt-cinq
           * trente-deux
           * soixante-dix
           */

          if (
            value >= 20 &&
            value < 100
          ) {

            current += value;

          } else {

            current += value;
          }
        }

        continue;
      }


      /*
       * Formes parlées sans tiret :
       *
       * dix-sept
       * dix-huit
       * dix-neuf
       */

      if (
        /^dixsept$/.test(word)
      ) {
        current += 17;
        found = true;
        continue;
      }

      if (
        /^dixhuit$/.test(word)
      ) {
        current += 18;
        found = true;
        continue;
      }

      if (
        /^dixneuf$/.test(word)
      ) {
        current += 19;
        found = true;
        continue;
      }


      /*
       * soixante-dix
       * soixante et onze
       */

      if (
        word === "soixantedix"
      ) {
        current += 70;
        found = true;
        continue;
      }

      if (
        word === "soixanteonze"
      ) {
        current += 71;
        found = true;
        continue;
      }

      if (
        word === "soixantedouze"
      ) {
        current += 72;
        found = true;
        continue;
      }

      if (
        word === "soixantetreize"
      ) {
        current += 73;
        found = true;
        continue;
      }

      if (
        word === "soixantequatorze"
      ) {
        current += 74;
        found = true;
        continue;
      }

      if (
        word === "soixantequinze"
      ) {
        current += 75;
        found = true;
        continue;
      }

      if (
        word === "soixanteseize"
      ) {
        current += 76;
        found = true;
        continue;
      }

      if (
        word === "soixantedixsept"
      ) {
        current += 77;
        found = true;
        continue;
      }

      if (
        word === "soixantedixhuit"
      ) {
        current += 78;
        found = true;
        continue;
      }

      if (
        word === "soixantedixneuf"
      ) {
        current += 79;
        found = true;
        continue;
      }


      /*
       * Quatre-vingt...
       */

      if (
        word === "quatrevingts"
      ) {
        current += 80;
        found = true;
        continue;
      }

      if (
        word === "quatrevingt"
      ) {
        current += 80;
        found = true;
        continue;
      }


      /*
       * Si le mot n'est pas un nombre,
       * on abandonne.
       */

      return null;
    }


    if (!found) {
      return null;
    }


    return total + current;
  }


  /*
   * Remplace les nombres français par des nombres.
   */

  function convertFrenchNumbers(text) {

    let result =
      text.toLowerCase();


    /*
     * Décimaux :
     *
     * "2 virgule 5"
     * "deux virgule cinq"
     */

    result =
      result.replace(
        /(\d+)\s+virgule\s+(\d+)/g,
        "$1.$2"
      );


    /*
     * Petites combinaisons fréquentes.
     */

    const patterns = [

      [
        /\bquatre[\s-]+vingt[\s-]+dix[\s-]+neuf\b/g,
        "99"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+dix[\s-]+huit\b/g,
        "98"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+dix[\s-]+sept\b/g,
        "97"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+seize\b/g,
        "96"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+quinze\b/g,
        "95"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+quatorze\b/g,
        "94"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+treize\b/g,
        "93"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+douze\b/g,
        "92"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+onze\b/g,
        "91"
      ],

      [
        /\bquatre[\s-]+vingt[\s-]+un\b/g,
        "81"
      ],

      [
        /\bquatre[\s-]+vingts\b/g,
        "80"
      ],

      [
        /\bsoixante[\s-]+dix[\s-]+neuf\b/g,
        "79"
      ],

      [
        /\bsoixante[\s-]+dix[\s-]+huit\b/g,
        "78"
      ],

      [
        /\bsoixante[\s-]+dix[\s-]+sept\b/g,
        "77"
      ],

      [
        /\bsoixante[\s-]+seize\b/g,
        "76"
      ],

      [
        /\bsoixante[\s-]+quinze\b/g,
        "75"
      ],

      [
        /\bsoixante[\s-]+quatorze\b/g,
        "74"
      ],

      [
        /\bsoixante[\s-]+treize\b/g,
        "73"
      ],

      [
        /\bsoixante[\s-]+douze\b/g,
        "72"
      ],

      [
        /\bsoixante[\s-]+onze\b/g,
        "71"
      ],

      [
        /\bsoixante[\s-]+dix\b/g,
        "70"
      ],

      [
        /\bcinquante[\s-]+neuf\b/g,
        "59"
      ],

      [
        /\bcinquante[\s-]+huit\b/g,
        "58"
      ],

      [
        /\bcinquante[\s-]+sept\b/g,
        "57"
      ],

      [
        /\bcinquante[\s-]+six\b/g,
        "56"
      ],

      [
        /\bcinquante[\s-]+cinq\b/g,
        "55"
      ],

      [
        /\bcinquante[\s-]+quatre\b/g,
        "54"
      ],

      [
        /\bcinquante[\s-]+trois\b/g,
        "53"
      ],

      [
        /\bcinquante[\s-]+deux\b/g,
        "52"
      ],

      [
        /\bcinquante[\s-]+un\b/g,
        "51"
      ],

      [
        /\bquarante[\s-]+neuf\b/g,
        "49"
      ],

      [
        /\bquarante[\s-]+huit\b/g,
        "48"
      ],

      [
        /\bquarante[\s-]+sept\b/g,
        "47"
      ],

      [
        /\bquarante[\s-]+six\b/g,
        "46"
      ],

      [
        /\bquarante[\s-]+cinq\b/g,
        "45"
      ],

      [
        /\bquarante[\s-]+quatre\b/g,
        "44"
      ],

      [
        /\bquarante[\s-]+trois\b/g,
        "43"
      ],

      [
        /\bquarante[\s-]+deux\b/g,
        "42"
      ],

      [
        /\bquarante[\s-]+un\b/g,
        "41"
      ],

      [
        /\btrente[\s-]+neuf\b/g,
        "39"
      ],

      [
        /\btrente[\s-]+huit\b/g,
        "38"
      ],

      [
        /\btrente[\s-]+sept\b/g,
        "37"
      ],

      [
        /\btrente[\s-]+six\b/g,
        "36"
      ],

      [
        /\btrente[\s-]+cinq\b/g,
        "35"
      ],

      [
        /\btrente[\s-]+quatre\b/g,
        "34"
      ],

      [
        /\btrente[\s-]+trois\b/g,
        "33"
      ],

      [
        /\btrente[\s-]+deux\b/g,
        "32"
      ],

      [
        /\btrente[\s-]+un\b/g,
        "31"
      ],

      [
        /\bvingt[\s-]+neuf\b/g,
        "29"
      ],

      [
        /\bvingt[\s-]+huit\b/g,
        "28"
      ],

      [
        /\bvingt[\s-]+sept\b/g,
        "27"
      ],

      [
        /\bvingt[\s-]+six\b/g,
        "26"
      ],

      [
        /\bvingt[\s-]+cinq\b/g,
        "25"
      ],

      [
        /\bvingt[\s-]+quatre\b/g,
        "24"
      ],

      [
        /\bvingt[\s-]+trois\b/g,
        "23"
      ],

      [
        /\bvingt[\s-]+deux\b/g,
        "22"
      ],

      [
        /\bvingt[\s-]+un\b/g,
        "21"
      ]
    ];


    for (
      const [pattern, value]
      of patterns
    ) {

      result =
        result.replace(
          pattern,
          value
        );
    }


    /*
     * Nombres simples restants.
     */

    const simpleNumbers = {

      zéro: "0",
      zero: "0",

      un: "1",
      une: "1",

      deux: "2",
      trois: "3",
      quatre: "4",
      cinq: "5",
      six: "6",
      sept: "7",
      huit: "8",
      neuf: "9",

      dix: "10",
      onze: "11",
      douze: "12",
      treize: "13",
      quatorze: "14",
      quinze: "15",
      seize: "16",

      cent: "100",
      cents: "100",

      mille: "1000"
    };


    for (
      const [word, value]
      of Object.entries(simpleNumbers)
    ) {

      result =
        result.replace(
          new RegExp(
            `\\b${word}\\b`,
            "g"
          ),
          value
        );
    }


    return result;
  }


  /*
   * Nettoyage de la phrase.
   */

  function cleanCalculationText(text) {

    let t =
      text
        .toLowerCase()
        .trim();


    /*
     * Accents.
     */

    t =
      t.normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        );


    /*
     * Formulations vocales.
     */

    t =
      t.replace(
        /\bcombien\s+(font|fait|font-ils|fait-il)\b/g,
        ""
      );

    t =
      t.replace(
        /\bcalcule\s+(moi\s+)?/g,
        ""
      );

    t =
      t.replace(
        /\bcalcule\b/g,
        ""
      );

    t =
      t.replace(
        /\bcalcule-moi\b/g,
        ""
      );

    t =
      t.replace(
        /\bcombien\s+font\b/g,
        ""
      );

    t =
      t.replace(
        /\bcombien\s+fait\b/g,
        ""
      );


    /*
     * Multiplication.
     */

    t =
      t.replace(
        /\bmultiplie(?:e|é)?\s+par\b/g,
        "*"
      );

    t =
      t.replace(
        /\bmultipli(?:e|é)e?\s+par\b/g,
        "*"
      );

    t =
      t.replace(
        /\bfois\b/g,
        "*"
      );

    t =
      t.replace(
        /\bx\b/g,
        "*"
      );


    /*
     * Addition.
     */

    t =
      t.replace(
        /\bplus\b/g,
        "+"
      );


    /*
     * Soustraction.
     */

    t =
      t.replace(
        /\bmoins\b/g,
        "-"
      );

    t =
      t.replace(
        /\bsoustrait\s+de\b/g,
        "-"
      );


    /*
     * Division.
     */

    t =
      t.replace(
        /\bdivise(?:e|é)?\s+par\b/g,
        "/"
      );

    t =
      t.replace(
        /\bdivis(?:e|é)e?\s+par\b/g,
        "/"
      );


    /*
     * Puissance.
     */

    t =
      t.replace(
        /\bpuissance\b/g,
        "^"
      );

    t =
      t.replace(
        /\bau\s+carr[eé]\b/g,
        "^2"
      );

    t =
      t.replace(
        /\bau\s+cube\b/g,
        "^3"
      );


    /*
     * Pourcentage.
     */

    t =
      t.replace(
        /\bpour\s*cent\b/g,
        "%"
      );


    /*
     * Parenthèses dites à l'oral.
     */

    t =
      t.replace(
        /\bparenth[eè]se\s+ouvrante\b/g,
        "("
      );

    t =
      t.replace(
        /\bparenth[eè]se\s+fermante\b/g,
        ")"
      );


    /*
     * Racine carrée.
     */

    t =
      t.replace(
        /\bracine\s+carr[eé]e\s+de\b/g,
        "sqrt"
      );


    return t;
  }


  /*
   * Remplacement de nombres français.
   */

  function prepareCalculation(text) {

    let t =
      cleanCalculationText(text);


    /*
     * Cas "racine carrée de 144"
     */

    t =
      t.replace(
        /\bsqrt\s+(\d+(?:\.\d+)?)/g,
        "sqrt($1)"
      );


    /*
     * Conversion des nombres français.
     */

    t =
      convertFrenchNumbers(t);


    /*
     * Virgules décimales.
     */

    t =
      t.replace(
        /(\d),(\d)/g,
        "$1.$2"
      );


    /*
     * Symboles.
     */

    t =
      t.replace(
        /÷/g,
        "/"
      );

    t =
      t.replace(
        /×/g,
        "*"
      );


    /*
     * Espaces inutiles.
     */

    t =
      t.replace(
        /\s+/g,
        " "
      )
      .trim();


    return t;
  }


  /*
   * Vérifie qu'une expression contient
   * bien un calcul.
   */

  function looksLikeCalculation(text) {

    const t =
      text.toLowerCase();


    /*
     * Mots qui indiquent clairement
     * une demande de calcul.
     */

    const calculationWords =
      [
        "plus",
        "moins",
        "fois",
        "multiplié",
        "multiplie",
        "divisé",
        "divise",
        "puissance",
        "racine",
        "pour cent",
        "pourcent",
        "au carré",
        "au cube",
        "calcule",
        "combien font",
        "combien fait"
      ];


    for (
      const word
      of calculationWords
    ) {

      if (
        t.includes(word)
      ) {
        return true;
      }
    }


    /*
     * Expression numérique :
     *
     * 25 + 4
     * 12 * 8
     * 100 / 5
     */

    if (
      /\d+\s*[\+\-\*\/\^%]\s*\d+/
        .test(t)
    ) {
      return true;
    }


    return false;
  }


  /*
   * Évaluation sécurisée de l'expression.
   *
   * On n'utilise PAS eval().
   */

  function evaluateExpression(expression) {

    let expr =
      expression
        .replace(/\s+/g, "")
        .trim();


    /*
     * Vérification des caractères.
     */

    if (
      !/^[0-9+\-*/^%().]+$/.test(expr)
    ) {
      return null;
    }


    /*
     * Gestion de sqrt().
     */

    const sqrtValues = [];

    expr =
      expr.replace(
        /sqrt\(([^()]+)\)/g,
        function (_, inside) {

          const value =
            evaluateExpression(
              inside
            );

          if (
            value === null ||
            value < 0
          ) {
            return "NaN";
          }

          const index =
            sqrtValues.length;

          sqrtValues.push(
            Math.sqrt(value)
          );

          return `S${index}`;
        }
      );


    if (
      expr.includes("NaN")
    ) {
      return null;
    }


    /*
     * Remplacement des valeurs sqrt.
     */

    for (
      let i = 0;
      i < sqrtValues.length;
      i++
    ) {

      expr =
        expr.replace(
          `S${i}`,
          String(
            sqrtValues[i]
          )
        );
    }


    /*
     * Tokenisation.
     */

    const tokens =
      expr.match(
        /(?:\d+(?:\.\d+)?)|[+\-*/^%()]/
      );


    /*
     * On utilise un vrai tokenizer.
     */

    const tokenList =
      expr.match(
        /\d+(?:\.\d+)?|[+\-*/^%()]|./g
      );


    if (!tokenList) {
      return null;
    }


    /*
     * Priorités.
     */

    const precedence = {

      "+": 1,
      "-": 1,

      "*": 2,
      "/": 2,
      "%": 2,

      "^": 3
    };


    const output = [];
    const operators = [];


    /*
     * Gestion des nombres négatifs.
     */

    let previousType =
      "start";


    for (
      let i = 0;
      i < tokenList.length;
      i++
    ) {

      const token =
        tokenList[i];


      if (
        /^\d+(?:\.\d+)?$/.test(token)
      ) {

        output.push(
          Number(token)
        );

        previousType =
          "number";

        continue;
      }


      if (
        token === "("
      ) {

        operators.push(
          token
        );

        previousType =
          "open";

        continue;
      }


      if (
        token === ")"
      ) {

        let foundOpen =
          false;

        while (
          operators.length
        ) {

          const op =
            operators.pop();

          if (
            op === "("
          ) {

            foundOpen =
              true;

            break;
          }

          output.push(op);
        }

        if (!foundOpen) {
          return null;
        }

        previousType =
          "close";

        continue;
      }


      if (
        Object.prototype.hasOwnProperty.call(
          precedence,
          token
        )
      ) {

        /*
         * Un moins au début ou après
         * une autre opération = négatif.
         */

        if (
          token === "-" &&
          (
            previousType === "start" ||
            previousType === "operator" ||
            previousType === "open"
          )
        ) {

          output.push(0);
        }


        while (
          operators.length
        ) {

          const top =
            operators[
              operators.length - 1
            ];


          if (
            top === "("
          ) {
            break;
          }


          const topPrecedence =
            precedence[top];

          const currentPrecedence =
            precedence[token];


          /*
           * La puissance est associative
           * à droite.
           */

          const rightAssociative =
            token === "^";


          if (
            topPrecedence >
              currentPrecedence ||
            (
              topPrecedence ===
                currentPrecedence &&
              !rightAssociative
            )
          ) {

            output.push(
              operators.pop()
            );

          } else {

            break;
          }
        }


        operators.push(
          token
        );

        previousType =
          "operator";

        continue;
      }


      /*
       * Caractère inconnu.
       */

      return null;
    }


    while (
      operators.length
    ) {

      const op =
        operators.pop();

      if (
        op === "(" ||
        op === ")"
      ) {
        return null;
      }

      output.push(op);
    }


    /*
     * Évaluation de la notation
     * polonaise inversée.
     */

    const stack = [];


    for (
      const token
      of output
    ) {

      if (
        typeof token === "number"
      ) {

        stack.push(token);

        continue;
      }


      if (
        stack.length < 2
      ) {
        return null;
      }


      const b =
        stack.pop();

      const a =
        stack.pop();


      let result;


      switch (token) {

        case "+":
          result =
            a + b;
          break;

        case "-":
          result =
            a - b;
          break;

        case "*":
          result =
            a * b;
          break;

        case "/":

          if (b === 0) {
            return "DIV_ZERO";
          }

          result =
            a / b;

          break;

        case "^":
          result =
            Math.pow(a, b);
          break;

        case "%":
          result =
            a * (b / 100);
          break;

        default:
          return null;
      }


      if (
        !Number.isFinite(result)
      ) {
        return null;
      }


      stack.push(
        result
      );
    }


    if (
      stack.length !== 1
    ) {
      return null;
    }


    return stack[0];
  }


  /*
   * Formattage du résultat.
   */

  function formatNumber(number) {

    if (
      typeof number !== "number" ||
      !Number.isFinite(number)
    ) {
      return null;
    }


    /*
     * Évite les résultats du genre :
     *
     * 0.30000000000000004
     */

    const rounded =
      Math.round(
        number *
        100000000
      ) /
      100000000;


    /*
     * Entier.
     */

    if (
      Number.isInteger(rounded)
    ) {
      return String(
        rounded
      );
    }


    return String(
      rounded
    ).replace(
      ".",
      ","
    );
  }


  /*
   * Calcul principal.
   */

  function calculate(text) {

    if (
      !looksLikeCalculation(text)
    ) {
      return null;
    }


    /*
     * Pourcentage naturel :
     *
     * "10 pour cent de 250"
     */

    const percentageMatch =
      text
        .toLowerCase()
        .match(
          /(.+?)\s*(?:pour\s*cent|pourcent)\s+de\s+(.+)/i
        );


    if (
      percentageMatch
    ) {

      const a =
        calculateNumberOnly(
          percentageMatch[1]
        );

      const b =
        calculateNumberOnly(
          percentageMatch[2]
        );


      if (
        a !== null &&
        b !== null
      ) {

        const result =
          b *
          a /
          100;

        return formatCalculationResult(
          text,
          result
        );
      }
    }


    /*
     * Racine carrée.
     */

    const sqrtMatch =
      text
        .toLowerCase()
        .match(
          /racine\s+carr[eé]e\s+de\s+(.+)/i
        );


    if (
      sqrtMatch
    ) {

      const value =
        calculateNumberOnly(
          sqrtMatch[1]
        );


      if (
        value !== null
      ) {

        if (
          value < 0
        ) {
          return "Impossible de calculer la racine carrée d'un nombre négatif.";
        }


        const result =
          Math.sqrt(value);


        return formatCalculationResult(
          text,
          result
        );
      }
    }


    /*
     * Calcul normal.
     */

    const prepared =
      prepareCalculation(text);


    /*
     * Si "de" est présent dans une phrase
     * de pourcentage ou autre, on évite
     * de laisser passer un caractère invalide.
     */

    const result =
      evaluateExpression(
        prepared
      );


    if (
      result === "DIV_ZERO"
    ) {
      return "Impossible de diviser par zéro.";
    }


    if (
      result === null
    ) {
      return null;
    }


    const formatted =
      formatNumber(result);


    if (
      formatted === null
    ) {
      return null;
    }


    return `Le résultat est ${formatted}.`;
  }


  /*
   * Calcule uniquement un nombre
   * ou une expression simple.
   */

  function calculateNumberOnly(text) {

    let prepared =
      prepareCalculation(
        text
      );


    /*
     * Si l'expression est juste un nombre.
     */

    if (
      /^\d+(?:\.\d+)?$/.test(
        prepared
      )
    ) {

      return Number(
        prepared
      );
    }


    const result =
      evaluateExpression(
        prepared
      );


    if (
      typeof result !== "number"
    ) {
      return null;
    }


    return result;
  }


  /*
   * Formulation standardisée.
   */

  function formatCalculationResult(
    originalText,
    result
  ) {

    const formatted =
      formatNumber(result);


    if (
      formatted === null
    ) {
      return null;
    }


    return `Le résultat est ${formatted}.`;
  }


  // =========================================================
  // RECHERCHE WEB
  // =========================================================

  function buildSearchQuery(t) {

    let q =
      t.replace(
        /^(cherche[\s-]?moi|cherche|recherche[\s-]?moi|recherche)\s+/i,
        ""
      )
      .trim();


    q =
      q.replace(
        /\s+sur\s+(internet|google|le\s+web)$/i,
        ""
      )
      .trim();


    return q;
  }


  // =========================================================
  // LISTE DE COURSES / TÂCHES
  // =========================================================

  function getTasks() {

    try {

      return JSON.parse(
        localStorage.getItem(
          "jarvis_tasks"
        ) || "[]"
      );

    } catch (e) {

      return [];
    }
  }


  function saveTasks(arr) {

    localStorage.setItem(
      "jarvis_tasks",
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


    if (
      tasks.length === 0
    ) {
      return "Ta liste est vide.";
    }


    return (
      "Dans ta liste : " +
      tasks.join(", ") +
      "."
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


  // =========================================================
  // ROUTEUR PRINCIPAL
  // =========================================================

  async function handle(text) {

    const t =
      text
        .toLowerCase()
        .trim();


    // -------------------------------------------------------
    // 1. CALCUL
    // -------------------------------------------------------

    const calcResult =
      calculate(t);


    if (
      calcResult
    ) {
      return calcResult;
    }


    // -------------------------------------------------------
    // 2. RECHERCHE WEB
    // -------------------------------------------------------

    if (
      t.startsWith("cherche") ||
      t.startsWith("recherche")
    ) {

      const query =
        buildSearchQuery(t);


      if (query) {

        const url =
          "https://www.google.com/search?q=" +
          encodeURIComponent(query);


        return {

          text:
            `Voici ce que j'ai trouvé pour "${query}". Touche le lien en bas pour l'ouvrir.`,

          link:
            url,

          linkLabel:
            `Ouvrir : ${query}`
        };
      }
    }


    // -------------------------------------------------------
    // 3. LISTE
    // -------------------------------------------------------

    if (
      t.startsWith("ajoute")
    ) {

      let item =
        t
          .replace(
            /^ajoute\s+/,
            ""
          )
          .replace(
            /\s+(à|a)\s+la\s+liste.*$/,
            ""
          )
          .trim();


      if (item) {
        return addTask(item);
      }
    }


    if (
      (
        t.includes(
          "liste de courses"
        ) ||
        t.includes(
          "ma liste"
        )
      ) &&
      (
        t.includes("montre") ||
        t.includes("qu'est") ||
        t.includes("quest") ||
        t.includes("affiche") ||
        t.trim() ===
          "liste de courses"
      )
    ) {

      return listTasks();
    }


    if (
      t.startsWith("supprime") ||
      t.startsWith("enlève") ||
      t.startsWith("enleve") ||
      t.startsWith("retire")
    ) {

      let item =
        t
          .replace(
            /^(supprime|enlève|enleve|retire)\s+/,
            ""
          )
          .replace(
            /\s+de\s+la\s+liste.*$/,
            ""
          )
          .trim();


      if (item) {
        return removeTask(item);
      }
    }


    if (
      t.includes(
        "vide la liste"
      ) ||
      t.includes(
        "efface la liste"
      )
    ) {

      return clearTasks();
    }


    // -------------------------------------------------------
    // 4. MINUTEUR
    // -------------------------------------------------------

    const timerMatch =
      t.match(
        /minuteur.*?(\d+)\s*(minute|seconde)/
      );


    if (
      timerMatch
    ) {

      const amount =
        parseInt(
          timerMatch[1],
          10
        );


      const unit =
        timerMatch[2];


      return startTimer(
        amount,
        unit
      );
    }


    // -------------------------------------------------------
    // 5. PILE OU FACE
    // -------------------------------------------------------

    if (
      t.includes(
        "pile ou face"
      ) ||
      t === "pile"
    ) {

      return flipCoin();
    }


    // -------------------------------------------------------
    // 6. DÉ
    // -------------------------------------------------------

    const diceTrigger =
      (
        t.includes("lance") ||
        t.includes("lancer") ||
        t.includes("jette") ||
        t.includes("roule")
      ) &&
      (
        t.includes("dé") ||
        /\bde\b.*face/.test(t)
      );


    if (
      diceTrigger
    ) {

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


    // -------------------------------------------------------
    // 7. MÉTÉO
    // -------------------------------------------------------

    if (
      t.includes("météo") ||
      t.includes("meteo") ||
      t.includes(
        "temps qu'il fait"
      ) ||
      t.includes(
        "temps fait"
      )
    ) {

      return await getWeather();
    }


    // -------------------------------------------------------
    // 8. HEURE / DATE
    // -------------------------------------------------------

    if (
      t.includes("heure")
    ) {
      return getTime();
    }


    if (
      t.includes("date") ||
      t.includes("jour on est") ||
      t.includes("quel jour")
    ) {

      return getDate();
    }


    // -------------------------------------------------------
    // 9. RAPPEL
    // -------------------------------------------------------

    const reminderMatch =
      t.match(
        /rappel(?:le)?\s*(?:moi)?\s*(?:dans)?\s*(\d+)\s*minute/
      );


    if (
      reminderMatch
    ) {

      const minutes =
        parseInt(
          reminderMatch[1],
          10
        );


      return setReminder(
        minutes,
        "Rappel demandé"
      );
    }


    // -------------------------------------------------------
    // 10. SALUTATION
    // -------------------------------------------------------

    if (
      t.includes("bonjour") ||
      t.includes("salut")
    ) {

      return "Bonjour, comment puis-je vous aider ?";
    }


    // -------------------------------------------------------
    // 11. COMMANDE INCONNUE
    // -------------------------------------------------------

    return "Je n'ai pas encore appris à faire ça, mais je progresse.";
  }


  // =========================================================
  // API PUBLIQUE
  // =========================================================

  return {
    handle
  };
}
