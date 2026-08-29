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

        status.classList.remove(
          'listening',
          'thinking'
        );

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


    // Jarvis se met à l'écoute :
    // le statut pulse en bleu vif.

    status.classList.remove(
      'thinking'
    );

    status.classList.add(
      'listening'
    );

    status.textContent =
      'Je vous écoute...';


    const transcript =
      await voice.listenOnce();


    // Aucun résultat

    if (!transcript) {

      status.classList.remove(
        'listening'
      );

      status.textContent =
        'Touchez la sphère pour parler';


      sphere.setTalking(
        false
      );


      busy = false;

      return;
    }


    // Fin de l'écoute : on retire
    // la pulsation.

    status.classList.remove(
      'listening'
    );


    // Affichage de ce qui
    // a été compris

    status.textContent =
      '"' +
      transcript +
      '"';


    // Traitement : Jarvis "réfléchit",
    // le statut s'atténue légèrement.

    status.classList.add(
      'thinking'
    );


    const response =
      await commands.handle(
        transcript
      );


    status.classList.remove(
      'thinking'
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
