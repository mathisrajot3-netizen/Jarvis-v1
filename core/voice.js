function initVoice(onDebug) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onDebug('Reconnaissance vocale non supportée sur ce navigateur.');
    return {
      listenOnce: () => Promise.resolve(''),
      speak: (text) => console.log('Jarvis dirait:', text)
    };
  }

  function listenOnce() {
    return new Promise((resolve) => {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      let resolved = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        resolved = true;
        resolve(transcript);
      };

      recognition.onerror = (e) => {
        onDebug('Erreur: ' + e.error);
        if (!resolved) {
          resolved = true;
          resolve('');
        }
      };

      recognition.onend = () => {
        if (!resolved) {
          resolved = true;
          resolve('');
        }
      };

      try {
        recognition.start();
      } catch (e) {
        onDebug('Erreur démarrage: ' + e.message);
        resolve('');
      }
    });
  }

  function speak(text) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.onend = resolve;
      speechSynthesis.speak(utterance);
    });
  }

  return { listenOnce, speak };
}
