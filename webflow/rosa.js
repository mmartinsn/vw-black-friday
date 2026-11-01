
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ribbon
  const bits = ['<em>Black Friday</em>', '20 % menos en exámenes', 'Todo noviembre', '<em>hasta el 1 de diciembre</em>', 'Recetario de regalo', 'Lectura a $150', '4 pagos sin intereses con Klarna'];
  const one = bits.map((b) => `<span>${b}<i></i></span>`).join('');
  document.querySelector('[data-ribbon]').innerHTML = one + one + one + one;

  // Letters of "Black Friday" rise one by one
  document.querySelectorAll('[data-split]').forEach((el) => {
    let k = 0;
    el.innerHTML = el.textContent.split(' ').map((w) =>
      `<span aria-hidden="true">${[...w].map((c) => `<i style="--k:${k++}">${c}</i>`).join('')}</span>`).join('');
  });

  // Countdown: opens 1 Nov 00:00 and closes 1 Dec 23:59:59, Miami time.
  const opens = new Date('2026-11-01T00:00:00-04:00').getTime();
  const closes = new Date('2026-12-01T23:59:59-05:00').getTime();
  const pad = (n) => String(n).padStart(2, '0');
  const dockClock = document.querySelector('[data-dock-clock]');
  function tick() {
    const now = Date.now();
    const before = now < opens, over = now > closes;
    const r = Math.max(0, (before ? opens : closes) - now);
    const d = Math.floor(r / 864e5), h = Math.floor(r / 36e5) % 24, m = Math.floor(r / 6e4) % 60, s = Math.floor(r / 1e3) % 60;
    document.querySelectorAll('[data-clock]').forEach((c) => { if (!c.querySelector('[data-d]')) return;
      c.querySelector('[data-d]').textContent = pad(d); c.querySelector('[data-h]').textContent = pad(h);
      c.querySelector('[data-m]').textContent = pad(m); c.querySelector('[data-s]').textContent = pad(s);
    });
    const lbl = over ? 'La oferta terminó' : before ? 'La oferta abre en' : 'La oferta termina en';
    document.querySelectorAll('[data-clock-lbl]').forEach((l) => (l.textContent = lbl));
    if (!dockClock.dataset.rush) dockClock.textContent = over ? 'La oferta terminó' : `${before ? 'Abre en' : 'Termina en'} ${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  tick(); setInterval(tick, 1000);

  // Prices fall from the old price to the new one when a card comes into view.
  const fmt = (v) => '$' + (Math.abs(v - Math.round(v)) < .005 ? Math.round(v) : v.toFixed(2));
  if (!still && 'IntersectionObserver' in window) {
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      seen.unobserve(e.target);
      const el = e.target, from = +el.dataset.count, to = +el.dataset.to, t0 = performance.now(), dur = 1500;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(from + (to - from) * ease);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    document.querySelectorAll('[data-count]').forEach((el) => seen.observe(el));
  }

  // Gift cards tilt toward the cursor and catch the light.
  if (!still) document.querySelectorAll('.gc').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', `${(x - .5) * 10}deg`); c.style.setProperty('--rx', `${(.5 - y) * 8}deg`);
      c.style.setProperty('--gx', `${x * 100}%`); c.style.setProperty('--gy', `${y * 100}%`);
      c.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  // Each card can add the reading: the checkout opens with it, and Klarna counts it.
  document.querySelectorAll('[data-exam]').forEach((card) => {
    const box = card.querySelector('[data-lec]'), buy = card.querySelector('[data-buy]'), kl = card.querySelector('[data-kl]');
    const base = buy.href, now = +card.dataset.now;
    box.addEventListener('change', () => {
      buy.href = box.checked ? base + '&lectura=LAYER_SESSION' : base;
      kl.textContent = fmt((now + 25 + (box.checked ? 150 : 0)) / 4);
      card.classList.toggle('with-lec', box.checked);
    });
  });

  // Verónica's 5-minute countdown. One per visit (a reload keeps it, a new visit starts again); at zero it does not
  // pretend the offer is gone: it says the Black Friday price holds until 1 December.
  (function rush() {
    const boxes = [...document.querySelectorAll('[data-rush]')];
    if (!boxes.length) return;
    let t0 = Date.now();
    try { const v = +sessionStorage.getItem('vw-bf-rush'); if (v) t0 = v; else sessionStorage.setItem('vw-bf-rush', String(t0)); } catch (e) {}
    const dc = document.querySelector('[data-dock-clock]');
    (function step() {
      const r = Math.max(0, 300000 - (Date.now() - t0));
      const m = String(Math.floor(r / 6e4)).padStart(2, '0'), sec = String(Math.floor(r / 1e3) % 60).padStart(2, '0');
      boxes.forEach((b) => { b.querySelector('[data-rm]').textContent = m; b.querySelector('[data-rs]').textContent = sec; });
      if (dc) { dc.dataset.rush = '1'; dc.textContent = r ? `Aprovecha en los próximos ${m}:${sec}` : 'Válida hasta el 1 de diciembre'; }
      if (r === 0) {
        boxes.forEach((b) => (b.hidden = true));
        document.querySelectorAll('[data-rush-t]').forEach((t) => (t.textContent = 'Tu precio Black Friday sigue disponible hasta el 1 de diciembre.'));
        return;
      }
      setTimeout(step, 250);
    })();
  })();

  // The floating bar steps aside over the hero buttons and the final call.
  const dock = document.querySelector('[data-dock]');
  const zones = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? zones.add(e.target) : zones.delete(e.target)));
    dock.classList.toggle('away', zones.size > 0);
  }, { threshold: .15 });
  io.observe(document.querySelector('.hero .act'));
  io.observe(document.querySelector('[data-scene]'));
  io.observe(document.querySelector('.last'));
  // ── Crossing tapes
  const tapeWords = ['<em>Black Friday</em>', '−20 %', 'Recetario de regalo', '<em>Veronica Wellness</em>', 'Lectura a $150', '<em>Klarna</em> · 4 pagos sin intereses', 'Hasta el 1 de diciembre'];
  const tapeOne = tapeWords.map((w) => `<span>${w}<i></i></span>`).join('');
  document.querySelectorAll('[data-tape]').forEach((t) => (t.innerHTML = tapeOne + tapeOne + tapeOne + tapeOne));

  // ── Hero parallax and the cursor glow
  const hero = document.querySelector('[data-hero]') || document.documentElement;
  const glow = document.querySelector('[data-glow]');
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, mouseX = 0, mouseY = 0;
  if (!still && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY; glow.classList.add('on');
      mouseX = e.clientX / innerWidth - .5; mouseY = e.clientY / innerHeight - .5;
      hero.style.setProperty('--px', mouseX.toFixed(3)); hero.style.setProperty('--py', mouseY.toFixed(3));
    });
    (function follow() {
      gx += (tx - gx) * .12; gy += (ty - gy) * .12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(follow);
    })();
  }

  // ── Kits open on tap (hover and focus open them on desktop)
  document.querySelectorAll('[data-kit]').forEach((k) => k.addEventListener('click', () => k.classList.toggle('open')));

  // ── Exam sheet: the full story of each test, opened from its card
  const fichas = {
    ali: {
      lab: 'Alimentos · Alletess', name: 'Sensibilidad a 184 alimentos (184 IgG Food Sensitivity Panel)',
      title: 'Deja de quitar alimentos <em>a ciegas.</em>', n: 184, nl: 'alimentos',
      pain: ["Comes alimentos variados.", "Tienes alergias respiratorias o en la piel con frecuencia.", "A lo largo del día terminas con el abdomen como un globo.", "Tienes molestias digestivas y no sabes qué las detona."],
      measure: ["Respuesta IgG a diferentes carnes, pescados y mariscos.", "Respuesta IgG a cereales, gluten, tubérculos y granos.", "Respuesta IgG a vegetales y frutas.", "Respuesta IgG a hierbas y especias.", "Respuesta IgG a café, té, chocolate, frutos secos y semillas."],
      why: "¿Estás agotada de adivinar qué puede estar detrás de tus molestias? Este panel evalúa la respuesta IgG a 184 alimentos.",
      get: ["El resultado de tu examen entre 2 y 3 semanas después de enviar tu muestra.", "El recetario «30 desayunos antiinflamatorios express» de regalo, con valor de $20.", "Si agregas la lectura con Verónica, un plan personalizado según tus resultados, tu historia y tus hábitos: $150 en vez de $161, 7 % menos; tarifa válida para 1 examen."],
      sample: "La muestra es de sangre y se recoge con un pequeño pinchazo en el dedo. Las lancetas vienen dentro del kit que recibirás en tu dirección de preferencia en Estados Unidos.",
      note: 'No diagnostica alergias: orienta una dieta de eliminación.',
      pages: 2, repT: 'Así es un informe Alletess 184', repI: 'Estás viendo un informe de muestra del panel de sensibilidades alimentarias IgG a 184 alimentos de Alletess. El informe original está en inglés; en la lectura, Verónica te lo explica en español.',
      was: 344, now: 275, save: 69, report: 'https://iclabs.ca/wp-content/uploads/icl-test-attachments/AML_184_Food_Sensitivity_IgG_Sample_Report.pdf', id: '184-igg-food-sensitivity-panel',
    },
    hor: {
      lab: 'Hormonas · DUTCH', name: 'DUTCH Plus (hormonas sexuales y adrenales)',
      title: 'Entiende qué pasa <em>con tus hormonas.</em>', n: 35, nl: 'mediciones de tus hormonas',
      pain: ["Estás en perimenopausia.", "Tienes o tuviste ovarios poliquísticos, endometriosis, miomas o alteraciones en tu ciclo.", "Estás buscando un embarazo.", "Después del embarazo, sientes que tu cuerpo no está igual.", "Tienes síntomas premenstruales intensos, acné o dificultad para perder peso."],
      measure: ["Estrógenos, progesterona, testosterona, DHEA y cortisol, con sus metabolitos.", "El ritmo del cortisol durante el día.", "La respuesta del cortisol al despertar (CAR).", "Melatonina.", "Marcadores de ácidos orgánicos relacionados con B12, B6, glutatión, dopamina, noradrenalina y daño oxidativo.", "Vías de metabolización de estrógenos y metilación."],
      why: "Este examen mide hormonas y sus metabolitos para explorar cómo las procesas. También registra el ritmo del cortisol durante el día, desde que despiertas, para aportar contexto a lo que describes: fatiga, insomnio, ansiedad o antojos de dulces a partir de la tarde. No establece un diagnóstico.",
      get: ["Los resultados de tu examen DUTCH Plus.", "El recetario «30 desayunos antiinflamatorios express» de regalo, con valor de $20.", "Si agregas la lectura con Verónica, una revisión de tus resultados en contexto y un plan de acción personalizado: $150 en vez de $161, 7 % menos; tarifa válida para 1 examen."],
      sample: "Recoges las muestras de orina seca y saliva desde la comodidad de tu hogar, con el kit enviado a tu dirección en Estados Unidos.",
      note: 'Los exámenes no diagnostican: dan información para orientar tu plan.',
      pages: 4, repT: 'Así es un informe DUTCH Plus', repI: 'Estás viendo un informe de muestra del perfil hormonal en orina y saliva DUTCH Plus. El informe original está en inglés; en la lectura, Verónica te lo explica en español.',
      was: 578, now: 461, save: 117, report: "https://dutchtest.com/api/files/file/Female%20DUTCH%20Plus.pdf", id: 'dutch-plus-hormonas-sexuales-adrenal',
    },
    gi: {
      lab: 'Intestino · US BioTek', name: 'GI-Advanced Profile (incluye zonulina y H. pylori)',
      title: 'Mira lo que pasa <em>dentro de tu intestino.</em>', n: 98, nl: 'marcadores',
      pain: ["Tienes molestias digestivas con frecuencia.", "Tienes manifestaciones en la piel, como eczema, dermatitis, psoriasis, urticaria o rosácea.", "Te diagnosticaron una condición autoinmune.", "Tienes ansiedad, ataques de pánico o depresión."],
      measure: ["Microbioma por PCR, incluidos Akkermansia y Bifidobacterium, y cultivo bacteriano.", "Patógenos bacterianos, virales y parasitarios, Candida y H. pylori.", "Ácidos grasos, como el butirato.", "Calprotectina, como marcador de inflamación.", "Beta-glucuronidasa, relacionada con el reciclaje de estrógenos.", "Zonulina, como marcador de permeabilidad intestinal."],
      why: "Este examen reúne información sobre tu microbioma, parásitos, Candida y otras levaduras, y bacterias como H. pylori. También incluye marcadores de inflamación y permeabilidad intestinal. Sus resultados no establecen un diagnóstico.",
      get: ["Los resultados de tu examen GI-Advanced.", "El recetario «30 desayunos antiinflamatorios express» de regalo, con valor de $20.", "Si agregas la lectura con Verónica, un plan de acción basado en tus resultados y tus metas de salud: $150 en vez de $161, 7 % menos; tarifa válida para 1 examen."],
      sample: "Recoges una muestra de heces en casa con el kit enviado a tu dirección en Estados Unidos.",
      note: 'Los exámenes no diagnostican: dan información para orientar tu plan.',
      pages: 4, repT: 'Así es un informe GI-Advanced', repI: 'Estás viendo un informe de muestra del examen de heces GI-Advanced de US BioTek. El informe original está en inglés; en la lectura, Verónica te lo explica en español.',
      was: 562, now: 449, save: 113, report: "https://www.usbiotek.com/hubfs/Content/Connection%20Model/Sample%20Reports/Sample%20Report%20-%20Microbiome%20-%20GI%20Advanced.pdf", id: 'gi-advanced-profile-includes-zonulin-and-h-pylori',
    },
  };
  const dlg = document.querySelector('[data-ficha-dlg]');
  const sheet = document.querySelector('[data-sheet]');
  const li = (a) => a.map((x) => `<li>${x}</li>`).join('');
  function openFicha(k) {
    const f = fichas[k]; fichaKey = k;
    sheet.innerHTML = `
      <button type="button" class="x" data-x aria-label="Cerrar ficha">×</button>
      <header class="fh">
        <div><span class="fh-lab">${f.lab} · Black Friday −20 %</span><h2 id="ficha-t">${f.title}</h2><p class="nm">${f.name}</p></div>
        <div class="big-n"><b class="foil" data-n="${f.n}">${f.n}</b><span>${f.nl}</span></div>
      </header>
      <div class="fb">
        <section class="blk pain"><h3>Ideal para ti si…</h3><ul>${li(f.pain)}</ul></section>
        <section class="blk"><h3>Por qué este examen</h3><p class="why">${f.why}</p></section>
        <section class="blk measure wide"><h3>Lo que mide</h3><ul>${li(f.measure)}</ul></section>
        <section class="blk get"><h3>Lo que te llevas</h3><ul>${li(f.get)}</ul></section>
        <section class="blk"><h3>Cómo es la muestra</h3><p>${f.sample}</p><p>Envíos solo dentro de Estados Unidos. La promoción no aplica para envíos a Puerto Rico, Nueva York (NY), Nueva Jersey (NJ), Rhode Island (RI) ni Hawái (HI). Si vives en alguno de estos lugares, elige una dirección de envío fuera de ellos y dentro de Estados Unidos.</p><p>Al pagar se suman $25 de laboratorio por examen.</p></section>
        ${f.report ? `<section class="blk"><h3>Tu informe por dentro</h3><p>Explora un informe de muestra del laboratorio para conocer su formato y cómo presenta los resultados.</p><button type="button" class="sample" data-rep-in>Así sería tu informe <span aria-hidden="true">→</span></button></section>` : ''}
      </div>
      <p class="fnote">${f.note}</p>
      <div class="fbuy">
        <div class="pr"><s>$${f.was}</s><strong>${fmt(f.now)}</strong><em>Ahorras ${fmt(f.save)}</em><span class="kl"><b>Klarna.</b> o 4 pagos de ${fmt((f.now + 25) / 4)} sin intereses</span><small class="fee-l">+ $25 de laboratorio al pagar · En el pago verás primero el precio regular: el 20 % de tu código BLACKFRIDAY se aplica en el último paso.</small></div>
        <a class="btn" href="https://veronicawellness.com/checkout/examenes/?examen=${f.id}&cupon=BLACKFRIDAY" target="_blank" rel="noopener">Comprar mi examen <span class="arr">→</span></a>
      </div>`;
    sheet.scrollTop = 0;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
    sheet.querySelector('[data-x]').addEventListener('click', closeFicha);
    const n = sheet.querySelector('[data-n]');
    if (!still) {
      const to = +n.dataset.n, t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 1300); n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }
  function closeFicha() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', () => (document.documentElement.style.overflow = ''));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeFicha(); });
  document.querySelectorAll('[data-exam]').forEach((card) => {
    const k = card.dataset.exam;
    card.querySelector('[data-ficha]').addEventListener('click', () => openFicha(k));
    card.querySelectorAll('.q, h3').forEach((el) => el.addEventListener('click', () => openFicha(k)));
  });

  // "Así sería tu informe": a window with pages of the lab's sample report, the full PDF one tap away.
  const rdlg = document.querySelector('[data-rep-dlg]'), rsheet = document.querySelector('[data-rep-sheet]');
  const repImg = { ali: 'ali', hor: 'dutch', gi: 'gi' };
  function openRep(k) {
    const f = fichas[k];
    const imgs = Array.from({ length: f.pages }, (_, i) => `<img src="https://mmartinsn.github.io/vw-black-friday/img/informes/${repImg[k]}-${i + 1}.webp" alt="Página ${i + 1} del informe de muestra" loading="lazy" width="1200" height="${k === 'gi' ? 1739 : 1553}">`).join('');
    rsheet.innerHTML = `
      <button type="button" class="x" data-x aria-label="Cerrar">×</button>
      <header class="rep-h"><span class="fh-lab">${f.lab} · Informe de muestra</span><h2 id="rep-t">${f.repT}</h2><p>${f.repI}</p></header>
      <div class="rep-pages">${imgs}</div>
      <div class="rep-act">
        <a class="btn" href="https://veronicawellness.com/checkout/examenes/?examen=${f.id}&cupon=BLACKFRIDAY" target="_blank" rel="noopener">Comprar este examen <span class="arr">→</span></a>
        <a class="rep-pdf" href="${f.report}" target="_blank" rel="noopener">Abrir el PDF completo <span aria-hidden="true">↗</span></a>
      </div>`;
    rsheet.scrollTop = 0;
    if (typeof rdlg.showModal === 'function') rdlg.showModal(); else rdlg.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
    rsheet.querySelector('[data-x]').addEventListener('click', () => rdlg.close());
  }
  rdlg.addEventListener('close', () => (document.documentElement.style.overflow = ''));
  rdlg.addEventListener('click', (e) => { if (e.target === rdlg) rdlg.close(); });
  let fichaKey = null;
  document.querySelectorAll('[data-exam]').forEach((card) => {
    const b = card.querySelector('[data-rep]');
    if (b) b.addEventListener('click', () => openRep(card.dataset.exam));
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-rep-in]')) { closeFicha(); openRep(fichaKey); } });
  // ── Scroll scene: the gift box opens with the scroll. Drop the AI video frames in frames/ and set FRAMES.count.
  const FRAMES = { count: 0, src: (i) => `frames/f${String(i + 1).padStart(4, '0')}.jpg` };
  (function scene() {
    const sec = document.querySelector('[data-scene]'), pin = sec.querySelector('.pin');
    const caps = [...sec.querySelectorAll('[data-cap]')], dots = [...sec.querySelectorAll('[data-dot]')];
    const canvas = sec.querySelector('[data-frames]'), ctx = canvas.getContext('2d');
    const imgs = [];
    if (FRAMES.count > 0) {
      canvas.hidden = false; sec.querySelector('[data-gbox]').hidden = true;
      for (let i = 0; i < FRAMES.count; i++) { const im = new Image(); im.decoding = 'async'; im.src = FRAMES.src(i); imgs.push(im); }
    }
    const clamp = (v) => Math.max(0, Math.min(1, v));
    let last = -1, shown = -1;
    function draw(p) {
      if (!imgs.length) return;
      const i = Math.round(p * (imgs.length - 1));
      const im = imgs[i];
      if (i === shown || !im.complete || !im.naturalWidth) return;
      shown = i;
      const w = canvas.width = canvas.clientWidth * Math.min(devicePixelRatio, 2), h = canvas.height = canvas.clientHeight * Math.min(devicePixelRatio, 2);
      const r = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      ctx.drawImage(im, (w - im.naturalWidth * r) / 2, (h - im.naturalHeight * r) / 2, im.naturalWidth * r, im.naturalHeight * r);
    }
    const wrapBox = sec.querySelector('[data-gbox]');
    let landed = false;
    const bounce = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
    function update() {
      const rect = sec.getBoundingClientRect();
      const enter = clamp(1 - rect.top / (innerHeight * .9));
      wrapBox.style.setProperty('--drop', (still ? 1 : bounce(enter)).toFixed(4));
      if (enter >= 1 && !landed) { landed = true; wrapBox.classList.add('landed'); }
      if (enter < .6 && landed) { landed = false; wrapBox.classList.remove('landed'); }
      const p = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
      if (p !== last) {
        last = p;
        pin.style.setProperty('--p', p.toFixed(4));
        pin.style.setProperty('--l', clamp((p - .12) / .28).toFixed(4));
        pin.style.setProperty('--q', clamp((p - .3) / .55).toFixed(4));
        const phase = p < .3 ? 0 : p < .66 ? 1 : 2;
        caps.forEach((c, i) => c.classList.toggle('on', i === phase));
        dots.forEach((d, i) => d.classList.toggle('on', i === phase));
        shown = -1; draw(p);
      }
      requestAnimationFrame(update);
    }
    // phone: fit the box under the tallest caption so the open gift never covers the text
    const capsBox = sec.querySelector('.caps');
    function place() {
      if (innerWidth >= 980) { wrapBox.style.removeProperty('top'); wrapBox.style.removeProperty('--gs'); return; }
      const H = pin.clientHeight, capBottom = capsBox.offsetTop + capsBox.offsetHeight + 12;
      const above = 290, below = 200; // reach of the open gift around the box centre, unscaled
      const gs = Math.max(.36, Math.min(.62, (H - capBottom - 70) / (above + below)));
      wrapBox.style.setProperty('--gs', gs.toFixed(3));
      wrapBox.style.top = Math.min(H - below * gs - 70, capBottom + above * gs) + 'px';
    }
    addEventListener('resize', () => { shown = -1; draw(last); place(); });
    document.fonts?.ready.then(place);
    place();
    update();
  })();
  // ── Satin ribbon: a wavy, twisting gold band, centred at both ends so the pieces meet across sections
  function satin(el, seed) {
    const W = el.clientWidth, H = el.clientHeight;
    if (!W || !H) return;
    const band = W * .5, amp = W * .3, n = Math.max(12, Math.round(H / 14)), L = [], R = [], C = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = t * H;
      const env = Math.sin(Math.PI * t);
      const x = W / 2 + Math.sin(y / 120 + seed) * amp * env;
      const tw = .3 + .7 * Math.abs(Math.cos(y / 170 + seed * 1.7));
      const half = band / 2 * (env < .15 ? 1 : tw);
      L.push(`${(x - half).toFixed(1)},${y.toFixed(1)}`); R.unshift(`${(x + half).toFixed(1)},${y.toFixed(1)}`); C.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const id = 'sg' + seed.toString().replace('.', '');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs>
      <linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#e31c62"/><stop offset=".18" stop-color="#efabc3"/><stop offset=".32" stop-color="#ba1750"/>
        <stop offset=".5" stop-color="#f8d8e3"/><stop offset=".66" stop-color="#dc1b5f"/><stop offset=".82" stop-color="#eb95b3"/><stop offset="1" stop-color="#b6164e"/>
      </linearGradient></defs>
      <polygon points="${L.join(' ')} ${R.join(' ')}" fill="url(#${id})"/>
      <polyline points="${C.join(' ')}" fill="none" stroke="rgb(252 237 242 / .55)" stroke-width="1.2"/></svg>`;
  }
  const tapeDrop = document.querySelector('.tape-drop'), ribbonDrop = document.querySelector('.ribbon-drop');
  let lastH = -1;
  function ribbons() {
    if (tapeDrop) satin(tapeDrop, 0.6);
    if (ribbonDrop && ribbonDrop.clientHeight !== lastH) { lastH = ribbonDrop.clientHeight; satin(ribbonDrop, 2.1); }
  }
  ribbons();
  addEventListener('resize', () => { lastH = -1; ribbons(); });
  (function watch() { if (ribbonDrop && ribbonDrop.clientHeight !== lastH) ribbons(); requestAnimationFrame(watch); })();
  // ── Testimonials v4: arrows slide the track one card at a time
  (function slider() {
    const tr = document.querySelector('[data-p4-track]');
    if (!tr) return;
    document.querySelectorAll('[data-p4]').forEach((b) => b.addEventListener('click', () => {
      const card = tr.querySelector('.pc');
      tr.scrollBy({ left: (+b.dataset.p4) * (card.offsetWidth + 20), behavior: still ? 'auto' : 'smooth' });
    }));
  })();
  // ── Line the satin ribbon up with the ribbon that leaves the photo (object-fit: cover, 50% 80%)
  (function alignRibbon() {
    const img = document.querySelector('[data-ribbon-x]');
    if (!img) return;
    function place() {
      if (innerWidth < 980) { document.documentElement.style.removeProperty('--rx'); return; }
      const r = img.getBoundingClientRect();
      const sc = Math.max(r.width / 1024, r.height / 1536);
      const x = r.left + (r.width - 1024 * sc) * .5 + (+img.dataset.ribbonX) * sc;
      document.documentElement.style.setProperty('--rx', x.toFixed(1) + 'px');
      lastH = -1; ribbons();
    }
    place(); addEventListener('resize', place); setTimeout(place, 2400); img.addEventListener('load', place);
  })();
