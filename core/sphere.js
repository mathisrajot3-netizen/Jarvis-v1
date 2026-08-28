function initSphere(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  let W = 0;
  let H = 0;
  let dpr = 1;

  /* =====================================================
     REDIMENSIONNEMENT
     ===================================================== */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = canvas.clientWidth;
    H = canvas.clientHeight;

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();

  window.addEventListener("resize", resize);


  /* =====================================================
     PARTICULES
     ===================================================== */

  const N = 420;
  const stars = [];

  for (let i = 0; i < N; i++) {

    const theta =
      Math.acos(2 * Math.random() - 1);

    const phi =
      Math.random() * Math.PI * 2;

    stars.push({

      theta,
      phi,

      speed:
        0.0015 +
        Math.random() * 0.004,

      offset:
        Math.random() * Math.PI * 2,

      baseSize:
        0.6 +
        Math.random() * 2.4,

      brightness:
        0.5 +
        Math.random() * 0.5
    });
  }


  /* =====================================================
     ÉTAT
     ===================================================== */

  let talking = false;

  let t = 0;


  /* =====================================================
     AURA
     ===================================================== */

  function glowCircle(
    x,
    y,
    radius,
    alpha
  ) {

    const gradient =
      ctx.createRadialGradient(
        x,
        y,
        radius * 0.05,
        x,
        y,
        radius
      );

    gradient.addColorStop(
      0,
      `rgba(65,190,255,${alpha})`
    );

    gradient.addColorStop(
      0.4,
      `rgba(30,145,220,${alpha * 0.35})`
    );

    gradient.addColorStop(
      1,
      "rgba(0,80,150,0)"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  /* =====================================================
     ANNEAUX
     ===================================================== */

  function drawRing(
    cx,
    cy,
    radius,
    rotation,
    start,
    end,
    width,
    alpha
  ) {

    ctx.save();

    ctx.translate(
      cx,
      cy
    );

    ctx.rotate(rotation);

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      radius,
      start,
      end
    );

    ctx.strokeStyle =
      `rgba(76,190,255,${alpha})`;

    ctx.lineWidth =
      width;

    ctx.shadowBlur =
      12;

    ctx.shadowColor =
      "rgba(35,170,245,0.45)";

    ctx.stroke();

    ctx.restore();
  }


  /* =====================================================
     PETITES GRADUATIONS
     ===================================================== */

  function drawTickRing(
    cx,
    cy,
    radius
  ) {

    ctx.save();

    ctx.translate(
      cx,
      cy
    );

    const count = 48;

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const angle =
        (Math.PI * 2 / count) * i;

      const major =
        i % 6 === 0;

      const inner =
        radius -
        (major ? 9 : 5);

      const outer =
        radius;

      const x1 =
        Math.cos(angle) *
        inner;

      const y1 =
        Math.sin(angle) *
        inner;

      const x2 =
        Math.cos(angle) *
        outer;

      const y2 =
        Math.sin(angle) *
        outer;

      ctx.beginPath();

      ctx.moveTo(
        x1,
        y1
      );

      ctx.lineTo(
        x2,
        y2
      );

      ctx.strokeStyle =
        major
          ? "rgba(90,205,255,0.65)"
          : "rgba(70,170,220,0.22)";

      ctx.lineWidth =
        major ? 1 : 0.6;

      ctx.stroke();
    }

    ctx.restore();
  }


  /* =====================================================
     NOYAU
     ===================================================== */

  function drawCore(
    cx,
    cy,
    R
  ) {

    const pulse =
      Math.sin(t * 0.045) *
      0.5 +
      0.5;

    const talkingPulse =
      talking
        ? Math.sin(t * 0.18) *
            0.5 +
          0.5
        : 0;


    const coreRadius =
      R *
      (
        0.92 +
        talkingPulse *
        0.055
      );


    /* Aura */

    glowCircle(
      cx,
      cy,
      coreRadius * 1.55,
      talking
        ? 0.18
        : 0.09
    );

    glowCircle(
      cx,
      cy,
      coreRadius * 1.20,
      talking
        ? 0.13
        : 0.06
    );


    /* Cercle */

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      coreRadius,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      talking
        ? "rgba(105,215,255,0.32)"
        : "rgba(74,175,230,0.18)";

    ctx.lineWidth = 1;

    ctx.shadowBlur = 16;

    ctx.shadowColor =
      "rgba(35,170,245,0.35)";

    ctx.stroke();


    /* Dégradé intérieur */

    const gradient =
      ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        coreRadius
      );

    gradient.addColorStop(
      0,
      talking
        ? "rgba(125,225,255,0.13)"
        : "rgba(100,205,255,0.08)"
    );

    gradient.addColorStop(
      0.55,
      "rgba(30,130,200,0.035)"
    );

    gradient.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );

    ctx.fillStyle =
      gradient;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      coreRadius,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /* Point central */

    const centerSize =
      2.2 +
      pulse * 1.4 +
      talkingPulse * 2;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      centerSize,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      talking
        ? "rgba(185,240,255,0.95)"
        : "rgba(130,215,255,0.75)";

    ctx.shadowBlur =
      talking
        ? 25
        : 14;

    ctx.shadowColor =
      "rgba(50,190,255,0.9)";

    ctx.fill();

    ctx.shadowBlur = 0;
  }


  /* =====================================================
     TEXTE JARVIS
     ===================================================== */

  function drawLabel(
    cx,
    cy,
    R
  ) {

    const labelY =
      cy +
      R *
      1.42;

    ctx.save();

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";


    /* JARVIS */

    ctx.font =
      `500 ${Math.max(
        13,
        R * 0.105
      )}px Arial`;

    ctx.fillStyle =
      "rgba(190,235,255,0.92)";

    ctx.shadowBlur =
      14;

    ctx.shadowColor =
      "rgba(50,180,240,0.55)";

    ctx.fillText(
      "J A R V I S",
      cx,
      labelY
    );


    /* Sous-titre */

    ctx.shadowBlur = 0;

    ctx.font =
      `600 ${Math.max(
        6,
        R * 0.034
      )}px Arial`;

    ctx.fillStyle =
      "rgba(72,133,165,0.85)";

    ctx.fillText(
      "PERSONAL ASSISTANT",
      cx,
      labelY +
      R *
      0.095
    );

    ctx.restore();
  }


  /* =====================================================
     PETITS INDICATEURS LATÉRAUX
     ===================================================== */

  function drawSideIndicators(
    cx,
    cy,
    R
  ) {

    ctx.save();

    ctx.font =
      `${Math.max(
        6,
        R * 0.032
      )}px Arial`;

    ctx.textBaseline =
      "middle";

    ctx.fillStyle =
      "rgba(75,155,195,0.60)";


    /* Gauche */

    ctx.textAlign =
      "right";

    ctx.fillText(
      "◀",
      cx -
        R *
        1.38,
      cy -
        R *
        0.32
    );

    ctx.fillText(
      "◀",
      cx -
        R *
        1.38,
      cy +
        R *
        0.32
    );


    /* Droite */

    ctx.textAlign =
      "left";

    ctx.fillText(
      "▶",
      cx +
        R *
        1.38,
      cy -
        R *
        0.32
    );

    ctx.fillText(
      "▶",
      cx +
        R *
        1.38,
      cy +
        R *
        0.32
    );

    ctx.restore();
  }


  /* =====================================================
     DESSIN PRINCIPAL
     ===================================================== */

  function draw() {

    t++;


    /* Nettoyage */

    ctx.clearRect(
      0,
      0,
      W,
      H
    );


    /*
      Centre légèrement au-dessus
      du milieu pour laisser la place
      au nom JARVIS.
    */

    const cx =
      W / 2;

    const cy =
      H * 0.41;


    /*
      Rayon principal.

      IMPORTANT :
      les anneaux restent entièrement
      dans le canvas.
    */

    const R =
      Math.min(
        W,
        H
      ) *
      0.245;


    /* =================================================
       AURA GLOBALE
       ================================================= */

    glowCircle(
      cx,
      cy,
      R * 1.75,
      talking
        ? 0.10
        : 0.05
    );


    /* =================================================
       ANNEAU EXTÉRIEUR
       ================================================= */

    const rotation1 =
      t *
      0.0022;

    const rotation2 =
      -t *
      0.0015;

    const rotation3 =
      t *
      0.0009;


    drawRing(
      cx,
      cy,
      R * 1.43,
      rotation1,
      0.15,
      1.75,
      1,
      0.35
    );

    drawRing(
      cx,
      cy,
      R * 1.43,
      rotation1,
      3.20,
      5.35,
      1,
      0.20
    );


    /* =================================================
       ANNEAU INTERMÉDIAIRE
       ================================================= */

    drawRing(
      cx,
      cy,
      R * 1.30,
      rotation2,
      0,
      1.15,
      1,
      0.27
    );

    drawRing(
      cx,
      cy,
      R * 1.30,
      rotation2,
      2.40,
      4.20,
      1,
      0.18
    );


    /* =================================================
       ANNEAU INTERNE
       ================================================= */

    drawRing(
      cx,
      cy,
      R * 1.18,
      rotation3,
      0.40,
      2.70,
      0.7,
      0.20
    );


    /* =================================================
       GRADUATIONS
       ================================================= */

    drawTickRing(
      cx,
      cy,
      R * 1.53
    );


    /* =================================================
       PARTICULES
       ================================================= */

    const amp =
      talking
        ? R * 0.13
        : R * 0.025;


    for (
      let i = 0;
      i < N;
      i++
    ) {

      const s =
        stars[i];


      const wob =
        Math.sin(
          t *
            s.speed +
          s.offset
        ) *
        amp;


      const r =
        R +
        wob;


      const angle =
        s.phi +
        t *
        0.0009;


      const x =
        r *
        Math.sin(
          s.theta
        ) *
        Math.cos(angle);


      const y =
        r *
        Math.cos(
          s.theta
        );


      const z =
        r *
        Math.sin(
          s.theta
        ) *
        Math.sin(angle);


      const scale =
        (
          z +
          R * 1.5
        ) /
        (R * 2);


      const px =
        cx +
        x;

      const py =
        cy +
        y;


      const size =
        Math.max(
          0.4,
          s.baseSize *
          scale
        );


      let alpha =
        Math.max(
          0.10,
          scale
        ) *
        s.brightness;


      if (talking) {

        alpha *=
          0.85 +
          Math.sin(
            t *
              0.08 +
            s.offset
          ) *
          0.25;
      }


      ctx.beginPath();

      ctx.arc(
        px,
        py,
        size,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        `rgba(
          120,
          205,
          255,
          ${alpha}
        )`;


      ctx.shadowBlur =
        size > 1.5
          ? 5
          : 0;


      ctx.shadowColor =
        "rgba(60,185,255,0.55)";


      ctx.fill();
    }


    ctx.shadowBlur = 0;


    /* =================================================
       NOYAU
       ================================================= */

    drawCore(
      cx,
      cy,
      R
    );


    /* =================================================
       INDICATEURS
       ================================================= */

    drawSideIndicators(
      cx,
      cy,
      R
    );


    /* =================================================
       NOM JARVIS
       ================================================= */

    drawLabel(
      cx,
      cy,
      R
    );


    /* =================================================
       BOUCLE
       ================================================= */

    requestAnimationFrame(
      draw
    );
  }


  /* =====================================================
     LANCEMENT
     ===================================================== */

  draw();


  /* =====================================================
     API POUR LE RESTE DE JARVIS
     ===================================================== */

  return {

    setTalking: (val) => {

      talking =
        !!val;

    }

  };
}
