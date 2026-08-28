function initVoice(onWake, onCommand, onSleep, onDebug) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onDebug('Reconnaissance vocale non supportée sur ce navigateur.');
    return { start: () => {}, speak: (text) => console.log('Jarvis dirait:', text) };
  }

  let mode = 'wake';
  let recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript.trim().toLowerCase();

    onDebug('Entendu : "' + transcript + '"' + (result.isFinal ? ' (final)' : ' (...)'));

    if (!result.isFinal) return;

    if (mode === 'wake') {
      if (transcript.includes('hey jarvis') || transcript.includes('hé jarvis') || transcript.includes('ei jarvis') || transcript.includes('jarvis')) {
        mode = 'command';
        onWake();
      }
    } else if (mode === 'command') {
      mode = 'wake';
      onCommand(transcript);
    }
  };

  recognition.onend = () => {
    onDebug('(recognition arrêtée, redémarrage...)');
    try { recognition.start(); } catch (e) { onDebug('Erreur redémarrage: ' + e.message); }
  };

  recognition.onerror = (e) => {
    onDebug('Erreur: ' + e.error);
  };

  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.onend = () => {
      mode = 'wake';
      onSleep();
    };
    speechSynthesis.speak(utterance);
  }

  function start() {
    try {
      recognition.start();
      onDebug('Micro démarré, en écoute...');
    } catch (e) {
      onDebug('Erreur démarrage: ' + e.message);
    }
  }

  return { start, speak };
}
