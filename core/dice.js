function initDice() {
  const overlay = document.getElementById('diceOverlay');
  const face = document.getElementById('diceFace');

  const pipPatterns = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  function buildPips(value) {
    face.innerHTML = '';
    const on = pipPatterns[value] || [4];
    for (let i = 0; i < 9; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip' + (on.includes(i) ? ' on' : '');
      face.appendChild(pip);
    }
  }

  function buildNumber(value) {
    face.innerHTML = '';
    const span = document.createElement('span');
    span.id = 'diceNumberText';
    span.textContent = value;
    face.appendChild(span);
  }

  function showFace(faces, value) {
    if (faces === 6) buildPips(value); else buildNumber(value);
  }

  function roll(faces, finalValue) {
    return new Promise((resolve) => {
      overlay.classList.remove('hidden');
      face.classList.add('rolling');

      let ticks = 0;
      const maxTicks = 12;
      const interval = setInterval(() => {
        const randomVal = Math.floor(Math.random() * faces) + 1;
        showFace(faces, randomVal);
        ticks++;
        if (ticks >= maxTicks) {
          clearInterval(interval);
          face.classList.remove('rolling');
          showFace(faces, finalValue);
          setTimeout(() => {
            overlay.classList.add('hidden');
            resolve();
          }, 1200);
        }
      }, 80);
    });
  }

  return { roll };
}
