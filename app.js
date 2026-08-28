const sphere = initSphere('sphere');

const settings = initSettings();

const dice = initDice();

const status =
  document.getElementById('status');

const linkArea =
  document.getElementById('linkArea');

const app =
  document.getElementById('app');


// ============================================================
// DEBUG
// ============================================================

function showDebug(msg) {
  status.textContent = msg;
}


// ============================================================
// VOIX
// ============================================================

const voice =
  initVoice(showDebug);


// ============================================================
// COMMANDES
// ============================================================

const commands =
  initCommands(
    settings.getCity,
    {

      onDiceRoll: (
        faces,
        result
      ) => {

        return dice.roll(
          faces,
          result
        );
      },


      onTimerEnd: async () => {

        status.textContent =
          'Le minuteur est terminé !';


        await voice.speak(
          'Le minuteur est terminé !'
        );


        status.textContent =
          'Touchez la sphère pour parler';
      }

    }
  );


// ============================================================
// ÉTAT
// ============================================================

let busy = false;


// ============================================================
// ICÔNE MÉTÉO
// ============================================================

function clearWeatherIcon() {

  const oldIcon =
    document.getElementById(
      'weatherIcon'
    );


  if (oldIcon) {
    oldIcon.remove();
  }
}


function showWeatherIcon(icon) {

  clearWeatherIcon();


  if (!icon) {
    return;
  }


  const weatherIcon =
    document.createElement('div');


  weatherIcon.id =
    'weatherIcon';


  weatherIcon.textContent =
    icon;


  app.appendChild(
    weatherIcon
  );
}


// ============================================================
// CLIC PRINCIPAL
// ============================================================

document.body.addEventListener(
  'click',
  async (e) => {

    // Ne pas déclencher Jarvis
    // quand on touche les réglages
    // ou un lien.

    if (
      e.target.closest(
        '#settingsBtn'
      ) ||
      e.target.closest(
        '#settingsPanel'
      ) ||
      e.target.closest(
        '#linkArea'
      )
    ) {

      return;
    }


    if (busy) {
      return;
    }


    busy = true;


    linkArea.innerHTML = '';


    // Une nouvelle commande
    // supprime l'ancienne météo.

    clearWeatherIcon();


    sphere.setTalking(
      true
    );


    status.textContent =
      'Je vous écoute...';


    const transcript =
      await voice.listenOnce();


    // Aucun résultat

    if (!transcript) {

      status.textContent =
        'Touchez la sphère pour parler';


      sphere.setTalking(
        false
      );


      busy = false;

      return;
    }


    // Affichage de ce qui
    // a été compris

    status.textContent =
      '"' +
      transcript +
      '"';


    // Traitement

    const response =
      await commands.handle(
        transcript
      );


    // Texte de réponse

    const text =
      typeof response === 'object'
        ? response.text
        : response;


    status.textContent =
      text;


    // ========================================================
    // ICÔNE MÉTÉO
    // ========================================================

    if (
      typeof response === 'object' &&
      response.weatherIcon
    ) {

      showWeatherIcon(
        response.weatherIcon
      );
    }


    // ========================================================
    // LIEN RECHERCHE
    // ========================================================

    if (
      typeof response === 'object' &&
      response.link
    ) {

      const a =
        document.createElement(
          'a'
        );


      a.href =
        response.link;


      a.target =
        '_blank';


      a.rel =
        'noopener';


      a.textContent =
        response.linkLabel ||
        'Ouvrir le lien';


      linkArea.appendChild(
        a
      );
    }


    // ========================================================
    // VOIX
    // ========================================================

    await voice.speak(
      text
    );


    sphere.setTalking(
      false
    );


    status.textContent =
      'Touchez la sphère pour parler';


    busy = false;
  }
);
