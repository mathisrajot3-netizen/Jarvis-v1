function initVoice(onDebug) {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    onDebug(
      'Reconnaissance vocale non supportée sur ce navigateur.'
    );

    return {
      listenOnce: () => Promise.resolve(''),
      speak: (text) => {
        console.log('Jarvis dirait:', text);
        return Promise.resolve();
      }
    };
  }


  // ============================================================
  // MESSAGES D'ERREUR LISIBLES
  // ============================================================

  function friendlyErrorMessage(errorCode) {

    switch (errorCode) {

      case 'not-allowed':
      case 'service-not-allowed':
        return "Le micro n'est pas autorisé. Vérifiez les permissions.";

      case 'no-speech':
        return "Je n'ai rien entendu.";

      case 'audio-capture':
        return "Aucun micro détecté.";

      case 'network':
        return "Problème de réseau avec la reconnaissance vocale.";

      default:
        return `Erreur du micro (${errorCode}).`;
    }
  }


  // ============================================================
  // ÉCOUTE
  // ============================================================

  function listenOnce() {

    return new Promise((resolve) => {

      const recognition =
        new SpeechRecognition();

      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;


      let resolved = false;


      // Sécurité : si le navigateur ne déclenche
      // jamais onresult/onerror/onend, on ne reste
      // pas bloqué indéfiniment.

      const safetyTimeout =
        setTimeout(() => {

          if (resolved) {
            return;
          }

          resolved = true;

          try {
            recognition.abort();
          } catch (e) {}

          onDebug(
            "Le micro n'a pas répondu, réessayez."
          );

          resolve('');

        }, 10000);


      recognition.onresult = (event) => {

        if (resolved) {
          return;
        }

        clearTimeout(safetyTimeout);

        const transcript =
          event.results[0][0].transcript.trim();

        resolved = true;

        resolve(transcript);
      };


      recognition.onerror = (e) => {

        if (resolved) {
          return;
        }

        clearTimeout(safetyTimeout);

        onDebug(
          friendlyErrorMessage(e.error)
        );

        resolved = true;

        resolve('');
      };


      recognition.onend = () => {

        if (resolved) {
          return;
        }

        clearTimeout(safetyTimeout);

        resolved = true;

        resolve('');
      };


      try {

        recognition.start();

      } catch (e) {

        clearTimeout(safetyTimeout);

        onDebug(
          'Erreur démarrage: ' + e.message
        );

        resolved = true;

        resolve('');
      }
    });
  }


  // ============================================================
  // SYNTHÈSE VOCALE
  // ============================================================

  function speak(text) {

    return new Promise((resolve) => {

      if (
        typeof speechSynthesis === 'undefined' ||
        !window.SpeechSynthesisUtterance
      ) {

        onDebug(
          "La synthèse vocale n'est pas disponible sur cet appareil."
        );

        resolve();

        return;
      }


      let resolved = false;


      // Sécurité : si onend/onerror ne se
      // déclenchent jamais, l'app ne reste
      // pas bloquée en "busy" pour toujours.

      const safetyTimeout =
        setTimeout(() => {

          if (resolved) {
            return;
          }

          resolved = true;

          resolve();

        }, 15000);


      try {

        const utterance =
          new SpeechSynthesisUtterance(text);

        utterance.lang = 'fr-FR';


        utterance.onend = () => {

          if (resolved) {
            return;
          }

          clearTimeout(safetyTimeout);

          resolved = true;

          resolve();
        };


        utterance.onerror = (e) => {

          if (resolved) {
            return;
          }

          clearTimeout(safetyTimeout);

          onDebug(
            'Erreur de synthèse vocale.'
          );

          resolved = true;

          resolve();
        };


        speechSynthesis.speak(utterance);

      } catch (e) {

        clearTimeout(safetyTimeout);

        onDebug(
          'Erreur de synthèse vocale: ' + e.message
        );

        resolved = true;

        resolve();
      }
    });
  }


  return {
    listenOnce,
    speak
  };
}
