function initVoice(onWake, onCommand, onSleep) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Reconnaissance vocale non supportée sur ce navigateur.');
    return { start: () => {}, speak: (text) => console.log('Jarvis dirait:', text) };
  }

  let mode = 'wake'; // 'wake' = attend "hey jarvis", 'command' = écoute la demande
  let recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

    if (mode === 'wake') {
      if (transcript.includes('hey jarvis') || transcript.includes('hé jarvis') || transcript.includes('ei jarvis')) {
        mode = 'command';
        onWake();
      }
    } else if (mode === 'command') {
      mode = 'wake';
      onCommand(transcript);
    }
  };

  recognition.onend = () => {
    recognition.start();
  };

  recognition.onerror = (e) => {
    console.warn('Erreur reconnaissance vocale:', e.error);
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
    try { recognition.start(); } catch (e) {}
  }

  return { start, speak };
}
