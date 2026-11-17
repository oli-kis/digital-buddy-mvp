// Digital Buddy MVP: shared logic. Page-specific code runs by <body data-page="...">.

// Optional real data collection: set to e.g. a Formspree URL ("https://formspree.io/f/xxxx").
// Bookings, funnel events, Abo answers and Buddy signups are then POSTed as JSON. Empty = off.
const FORM_ENDPOINT = "";

const TOPICS = [
  { id: "smartphone", label: "Smartphone-Einstellungen und Updates", icon: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>' },
  { id: "ebanking", label: "E-Banking und TWINT", icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>' },
  { id: "sbb", label: "SBB-App und Billette", icon: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M9 21l1.5-4M15 21l-1.5-4M9 13.5h.01M15 13.5h.01"/>' },
  { id: "betrug", label: "Verdächtige Mail, SMS oder Anruf", icon: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>' },
  { id: "passwoerter", label: "Passwörter und Logins", icon: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },
  { id: "whatsapp", label: "WhatsApp und Fotos", icon: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.2A8 8 0 1 1 21 12z"/>' },
  { id: "geraet", label: "Neues Gerät einrichten", icon: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>' },
  { id: "formulare", label: "Online-Formulare (Behörden, Arzt)", icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>' },
  { id: "anderes", label: "Anderes", icon: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>' },
];
const ART = {
  vorort: { label: "Vor Ort bei Ihnen zu Hause", short: "Vor Ort", price: 69, dauer: "bis 60 Minuten" },
  online: { label: "Online per Video", short: "Online (Video)", price: 39 },
};
const ZEIT = { vormittag: "Vormittag", nachmittag: "Nachmittag", abend: "Abend" };
const FUER = { selbst: "Für mich", angehoerige: "Für eine angehörige Person" };
const ZAHLUNG = { rechnung: "Rechnung", twint: "TWINT" };
const STATUS = { offen: "Offen", angenommen: "Angenommen", erledigt: "Erledigt" };
const BUDDY_SHARE = 0.7;

// ---------- helpers ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const params = new URLSearchParams(location.search);

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function send(type, data) {
  if (!FORM_ENDPOINT) return;
  fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ type, ...data }),
    keepalive: true, // survives the redirect right after submit
  }).catch(() => {});
}
const round2 = (n) => Math.round(n * 100) / 100;
const chf = (n) => "CHF " + (Number.isInteger(n) ? n + ".-" : n.toFixed(2));
const buddyShare = (price) => round2(price * BUDDY_SHARE);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const topic = (id) => TOPICS.find((t) => t.id === id) || { label: id || "", icon: "" };
const icon = (id) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${topic(id).icon}</svg>`;
const join = (parts, sep = ", ") => parts.filter(Boolean).join(sep);

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function newId(prefix, existing) {
  let id;
  do id = prefix + String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  while (existing.some((x) => x.id === id));
  return id;
}

// Rows for the booking summary (form step 6 and confirmation page). Third value = form step for "Ändern".
function summaryRows(b, inForm) {
  const a = ART[b.art] || {};
  const rows = [["Für wen", FUER[b.fuer], 1], ["Thema", topic(b.thema).label, 2]];
  if (b.beschreibung) rows.push(["Beschreibung", b.beschreibung, 2]);
  rows.push(
    ["Art der Hilfe", a.label, 3],
    ["Preis", a.price ? join([chf(a.price) + " Fixpreis", a.dauer]) : "", 3],
    ["Wunschtermin", join([fmtDate(b.datum), ZEIT[b.zeitfenster]]), 4],
    ["Ihre Kontaktangaben", join([b.name, b.telefon, b.email]), 5],
  );
  if (b.fuer === "angehoerige") rows.push(["Person, die Hilfe erhält", join([b.hilfeName, b.hilfeTelefon]), 5]);
  rows.push(["Adresse", join([b.strasse, join([b.plz, b.ort], " ")]), 5]);
  if (!inForm && b.zahlung) rows.push(["Bezahlung", ZAHLUNG[b.zahlung] + ", erst nach dem Einsatz"]);
  return rows;
}
function renderSummary(el, b, inForm) {
  el.innerHTML = summaryRows(b, inForm).map(([k, v, step]) => `
    <div class="summary-row"><dt>${k}</dt><dd>${esc(v)}${inForm && step
      ? ` <button type="button" class="btn-link" data-goto="${step}" aria-label="${k} ändern">Ändern</button>` : ""}</dd></div>`).join("");
}

// ---------- pages ----------
function initIndex() {
  $("#themen-grid").innerHTML = TOPICS.map((t) =>
    `<a class="topic" href="buchen.html?thema=${t.id}">${icon(t.id)}<span>${t.label}</span></a>`).join("");
}

function initBuchen() {
  const form = $("#buchung");
  const steps = $$(".step", form);
  const btnBack = $("#btn-zurueck"), btnNext = $("#btn-weiter"), btnSubmit = $("#btn-absenden");
  let current = 0;
  let started = false;

  $("#themen-optionen").innerHTML = TOPICS.map((t) => `
    <label class="choice"><input type="radio" name="thema" value="${t.id}" required
      data-error="Bitte wählen Sie ein Thema aus.">${icon(t.id)}<span>${t.label}</span></label>`).join("");

  // Preselect from URL (?fuer=angehoerige&thema=ebanking&art=vorort)
  for (const name of ["fuer", "thema", "art"]) {
    const val = params.get(name);
    const input = val && $$(`input[name="${name}"]`, form).find((i) => i.value === val);
    if (input) input.checked = true;
  }
  form.elements.datum.min = isoDate(new Date());

  // Fields that depend on earlier answers
  function syncDependent() {
    const forOther = form.elements.fuer.value === "angehoerige";
    const grp = $("#grp-angehoerige");
    grp.hidden = !forOther;
    grp.disabled = !forOther; // disabled = not validated, not submitted
    const onSite = form.elements.art.value === "vorort";
    form.elements.strasse.required = onSite;
    $("#strasse-hint").textContent = onSite ? "Pflichtfeld bei Hilfe vor Ort" : "Freiwillig bei Hilfe per Video";
  }
  form.addEventListener("change", syncDependent);
  syncDependent();

  form.addEventListener("input", (e) => e.target.removeAttribute("aria-invalid"));
  form.addEventListener("change", (e) => {
    if (e.target.type === "radio") $$(`input[name="${e.target.name}"]`, form).forEach((r) => r.removeAttribute("aria-invalid"));
  });

  function validateStep(step) {
    const box = $(".error-box", step);
    const bad = $$("input, textarea, select", step).filter((f) => !f.disabled && !f.checkValidity());
    $$("[aria-invalid]", step).forEach((f) => f.removeAttribute("aria-invalid"));
    if (!bad.length) { box.hidden = true; return true; }
    bad.forEach((f) => f.setAttribute("aria-invalid", "true"));
    box.textContent = bad[0].dataset.error || "Bitte prüfen Sie Ihre Angaben.";
    box.hidden = false;
    bad[0].focus();
    return false;
  }

  function show(i, focus = true) {
    current = i;
    steps.forEach((s, j) => (s.hidden = j !== i));
    const last = i === steps.length - 1;
    $("#schritt-nr").textContent = i + 1;
    $("#progress-fill").style.width = ((i + 1) / steps.length) * 100 + "%";
    btnBack.hidden = i === 0;
    btnNext.hidden = last;
    btnSubmit.hidden = !last;
    if (last) {
      const data = Object.fromEntries(new FormData(form));
      renderSummary($("#zusammenfassung"), data, true);
      $("#preis-total").textContent = chf(ART[data.art].price);
    }
    if (focus) {
      $("legend", steps[i]).focus();
      form.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }

  btnNext.addEventListener("click", () => {
    if (!validateStep(steps[current])) return;
    if (current === 0 && !started) {
      started = true;
      send("buchung_gestartet", { fuer: form.elements.fuer.value, zeit: new Date().toISOString() });
    }
    show(current + 1);
  });
  btnBack.addEventListener("click", () => show(current - 1));
  form.addEventListener("click", (e) => {
    const go = e.target.closest("[data-goto]");
    if (go) show(Number(go.dataset.goto) - 1);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Enter key in an earlier step acts like "Weiter"
    if (current < steps.length - 1) { btnNext.click(); return; }
    const badStep = steps.findIndex((s) => $$("input, textarea", s).some((f) => !f.checkValidity()));
    if (badStep >= 0) { show(badStep); validateStep(steps[badStep]); return; }

    const data = Object.fromEntries(new FormData(form));
    delete data.prototyp;
    const bookings = load("db_bookings");
    const booking = {
      id: newId("DB-", bookings),
      erstellt: new Date().toISOString(),
      status: "offen",
      ...data,
      preis: ART[data.art].price,
      aboInteresse: null,
    };
    bookings.push(booking);
    save("db_bookings", bookings);
    send("buchung", booking);
    location.href = "bestaetigung.html?id=" + encodeURIComponent(booking.id);
  });

  show(0, false);
}

function initBestaetigung() {
  const bookings = load("db_bookings");
  const booking = bookings.find((b) => b.id === params.get("id"));
  if (!booking) { $("#nicht-gefunden").hidden = false; return; }

  $("#gefunden").hidden = false;
  $("#buchungs-id").textContent = booking.id;
  renderSummary($("#zusammenfassung"), booking, false);

  const thanks = {
    ja: "Vielen Dank! Wir haben Ihr Interesse notiert. Das Abo gibt es noch nicht. Ihre Antwort hilft uns, es zu planen.",
    nein: "Vielen Dank für Ihre Antwort. Sie bezahlen weiterhin nur, wenn Sie Hilfe brauchen.",
  };
  function showAnswer(v) {
    $("#abo-buttons").hidden = true;
    $("#abo-danke").textContent = thanks[v];
    $("#abo-danke").hidden = false;
  }
  if (booking.aboInteresse) showAnswer(booking.aboInteresse);

  $$("[data-abo]").forEach((btn) => btn.addEventListener("click", () => {
    booking.aboInteresse = btn.dataset.abo;
    save("db_bookings", bookings);
    send("abo_interesse", { id: booking.id, aboInteresse: booking.aboInteresse });
    showAnswer(booking.aboInteresse);
    $("#abo-danke").focus();
  }));
}

function initBuddyWerden() {
  const form = $("#buddy-form");
  $("#buddy-themen").innerHTML = TOPICS.map((t) => `
    <label class="choice"><input type="checkbox" name="themen" value="${t.id}"><span>${t.label}</span></label>`).join("");

  // Checkbox groups: at least one must be ticked (native validation via setCustomValidity)
  const groups = ["verfuegbarkeit", "themen"];
  function checkGroups() {
    for (const name of groups) {
      const boxes = $$(`input[name="${name}"]`, form);
      boxes[0].setCustomValidity(boxes.some((b) => b.checked) ? "" : "Bitte wähle mindestens eine Option.");
    }
  }
  form.addEventListener("change", checkGroups);
  checkGroups();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const buddies = load("db_buddies");
    const buddy = {
      id: newId("BU-", buddies),
      erstellt: new Date().toISOString(),
      ...Object.fromEntries(fd),
      verfuegbarkeit: fd.getAll("verfuegbarkeit"),
      themen: fd.getAll("themen"),
    };
    buddies.push(buddy);
    save("db_buddies", buddies);
    send("buddy_anmeldung", buddy);
    location.href = "buddy-danke.html";
  });
}

function seedBookings() {
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };
  const base = { beispiel: true, erstellt: new Date().toISOString(), aboInteresse: null };
  return [
    { ...base, id: "DB-10001", status: "offen", fuer: "selbst", thema: "ebanking", art: "vorort", preis: 69,
      datum: day(2), zeitfenster: "vormittag", name: "Frau M.", plz: "8004", ort: "Zürich",
      beschreibung: "Möchte TWINT auf dem neuen Handy einrichten." },
    { ...base, id: "DB-10002", status: "offen", fuer: "angehoerige", thema: "betrug", art: "online", preis: 39,
      datum: day(1), zeitfenster: "nachmittag", name: "Herr K.", hilfeName: "Frau K. (Mutter)", plz: "4051", ort: "Basel",
      beschreibung: "SMS angeblich von der Post erhalten. Ist das echt?" },
    { ...base, id: "DB-10003", status: "angenommen", fuer: "selbst", thema: "sbb", art: "vorort", preis: 69,
      datum: day(3), zeitfenster: "nachmittag", name: "Herr B.", plz: "5000", ort: "Aarau",
      beschreibung: "Billett in der SBB-App kaufen lernen." },
  ];
}

function initDashboard() {
  let bookings = load("db_bookings");
  // Always show the examples next to real requests (no delete UI, so "none present" = first visit)
  if (!bookings.some((b) => b.beispiel)) { bookings = [...seedBookings(), ...bookings]; save("db_bookings", bookings); }
  const list = $("#anfragen");

  function render() {
    const count = (s) => bookings.filter((b) => b.status === s).length;
    for (const s of Object.keys(STATUS)) $("#count-" + s).textContent = count(s);
    const earned = bookings.filter((b) => b.status !== "offen").reduce((sum, b) => sum + buddyShare(b.preis), 0);
    $("#verdienst").textContent = chf(round2(earned));

    const sorted = [...bookings].sort((a, b) => (a.datum || "").localeCompare(b.datum || ""));
    list.innerHTML = sorted.map((b) => {
      const action = b.status === "offen"
        ? `<button type="button" class="btn btn-primary" data-action="angenommen" data-id="${esc(b.id)}">Anfrage annehmen</button>`
        : b.status === "angenommen"
          ? `<button type="button" class="btn btn-secondary" data-action="erledigt" data-id="${esc(b.id)}">Als erledigt markieren</button>`
          : `<p class="muted">Erledigt. Digital Buddy ruft die Kundin oder den Kunden zur Nachfrage an.</p>`;
      const kunde = b.fuer === "angehoerige" ? `${b.hilfeName || "Angehörige Person"} (gebucht von ${b.name})` : b.name;
      return `
      <li class="card request" data-card="${esc(b.id)}">
        <div class="request-head">
          <span class="badge badge--${esc(b.status)}">${STATUS[b.status] || esc(b.status)}</span>
          <span class="muted">${esc(b.id)}</span>
          ${b.beispiel ? '<span class="badge badge--beispiel">Beispiel</span>' : ""}
        </div>
        <h3 tabindex="-1">${icon(b.thema)}<span>${esc(topic(b.thema).label)}</span></h3>
        <dl class="facts">
          <div><dt>Kundin / Kunde</dt><dd>${esc(kunde)}</dd></div>
          <div><dt>Art</dt><dd>${esc((ART[b.art] || {}).short)}</dd></div>
          <div><dt>Termin</dt><dd>${esc(join([fmtDate(b.datum), ZEIT[b.zeitfenster]]))}</dd></div>
          <div><dt>PLZ / Ort</dt><dd>${esc(join([b.plz, b.ort], " "))}</dd></div>
          <div><dt>Preis</dt><dd>${chf(b.preis)}</dd></div>
          <div><dt>Ihr Anteil (70%)</dt><dd>${chf(buddyShare(b.preis))}</dd></div>
        </dl>
        ${b.beschreibung ? `<p>«${esc(b.beschreibung)}»</p>` : ""}
        ${action}
      </li>`;
    }).join("");
  }

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const b = bookings.find((x) => x.id === btn.dataset.id);
    b.status = btn.dataset.action;
    save("db_bookings", bookings);
    render();
    $("#status-meldung").textContent = `Anfrage ${b.id}: ${STATUS[b.status]}.`;
    const card = $(`[data-card="${b.id}"]`, list);
    ($("button", card) || $("h3", card)).focus();
  });

  $("#demo-reset").addEventListener("click", () => {
    if (!confirm("Alle Anfragen in diesem Browser löschen und die Beispiele neu laden?")) return;
    bookings = seedBookings();
    save("db_bookings", bookings);
    render();
    $("#status-meldung").textContent = "Demo zurückgesetzt.";
  });

  render();
}

const pages = {
  index: initIndex,
  buchen: initBuchen,
  bestaetigung: initBestaetigung,
  "buddy-werden": initBuddyWerden,
  "buddy-dashboard": initDashboard,
};
pages[document.body.dataset.page]?.();
