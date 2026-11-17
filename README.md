# Digital Buddy: MVP

Klickbarer Prototyp für **Digital Buddy**, ein Studierendenprojekt der FHNW (Klasse 7KBd).

Digital Buddy vermittelt geprüfte Studierende ("Buddies"), die Menschen, vor allem 60+, bei digitalen Alltagsproblemen helfen (Smartphone, E-Banking, TWINT, SBB-App, verdächtige Nachrichten). Hilfe vor Ort für **CHF 69.-** oder online per Video für **CHF 39.-**, zum Fixpreis pro Einsatz. Die Website richtet sich vor allem an Angehörige, die für ihre Eltern buchen.

**Live:** https://&lt;username&gt;.github.io/digital-buddy-mvp/ *(nach dem Deployment eintragen)*

## Team

Olivier Kistler, Olivia Posch, Remo Peronino, Uros Ljubic, Léon Raetzo

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Landingpage: Angebot, Ablauf, Themen, Preise, Vertrauen, Marktzahlen, FAQ |
| `buchen.html` | Buchung in 6 Schritten (Für wen, Thema, Art, Termin, Kontakt, Übersicht und Zahlung) |
| `bestaetigung.html` | Bestätigung mit Anfrage-Nummer und Abo-Fake-Door |
| `buddy-werden.html` | Angebotsseite für Studierende mit Anmeldeformular |
| `buddy-danke.html` | Bestätigung der Buddy-Anmeldung |
| `buddy-dashboard.html` | Demo: Buddy sieht Anfragen und nimmt sie an |

Vorauswahl per Link: `buchen.html?fuer=angehoerige`, `?thema=ebanking`, `?art=vorort` (kombinierbar).

## Lokal starten

Kein Build nötig. `index.html` im Browser öffnen, oder für eine Umgebung wie auf GitHub Pages:

```bash
python -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## Deployment (GitHub Pages)

1. Öffentliches Repo `digital-buddy-mvp` erstellen, alle Dateien ins Root.
2. Settings → Pages → Source: "Deploy from a branch", Branch `main`, Ordner `/ (root)`.
3. Nach ca. 1 Minute live unter `https://<username>.github.io/digital-buddy-mvp/`. Einmal alle Seiten durchklicken.

## Was das MVP testet

Hauptrisiko des Pay-per-Use-Modells ist die **Zahlungsbereitschaft pro Einsatz**. Das MVP ist ein Fake-Door- / Wizard-of-Oz-Test: Besucher können echt buchen, die Hilfe wird aber (noch) nicht erbracht.

| Hypothese | Messgrösse | Feld / Event |
|---|---|---|
| Kunden buchen zum Fixpreis von 69.- / 39.- | Gestartete vs. abgeschickte Buchungen | Event `buchung_gestartet` vs. `buchung` |
| Vor Ort ist gefragter als online (oder umgekehrt) | Anteil vor Ort / online | `art`, `preis` |
| Die Website ist der Kanal für Angehörige | Anteil "für mich" vs. "für Angehörige" | `fuer` |
| Die wichtigsten Probleme decken sich mit den Interviews | Häufigkeit der Themen | `thema`, `beschreibung` |
| Es gibt Interesse an einem Abo (Wachstumsoption) | Anteil "Ja, interessiert mich" | `aboInteresse` (`ja` / `nein`) |
| Studierende wollen Buddy werden (Angebotsseite) | Anzahl Anmeldungen | Event `buddy_anmeldung` |
| Bevorzugte Bezahlart | Rechnung vs. TWINT | `zahlung` |

Besuche (oberster Schritt im Funnel) werden nicht gezählt. Dafür bei Bedarf ein Analytics-Tool einbinden (z. B. GoatCounter, ein Script-Tag).

### Echte Testdaten sammeln

Ohne Konfiguration werden Daten nur im Browser gespeichert (`localStorage`: `db_bookings`, `db_buddies`). Um echte Daten zu sammeln, oben in `app.js` einen Formular-Endpunkt eintragen, z. B. von [Formspree](https://formspree.io):

```js
const FORM_ENDPOINT = "https://formspree.io/f/xxxxxxx";
```

Dann wird jedes Event (`buchung_gestartet`, `buchung`, `abo_interesse`, `buddy_anmeldung`) als JSON mit dem Feld `type` gesendet.

## Technik

HTML, CSS und Vanilla JavaScript. Kein Framework, kein Build. Seniorenfreundlich: Grundschrift 18px, hoher Kontrast, Buttons mind. 48px, ein Schritt pro Bildschirm. Schrift: Atkinson Hyperlegible (Google Fonts).

## Hinweis

Prototyp eines Studierendenprojekts der FHNW. Es werden keine echten Termine gebucht. Die Hotline 0800 000 000 ist ein Platzhalter.
