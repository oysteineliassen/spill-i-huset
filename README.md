# Spill i huset

Julespill i 3D-modellen av huset (Vardevegen syd 9) som Android-app i fullskjerm.

**Spill:** Finn nissene · Snøballkrig · Pakkelevering · Strømbrudd · Akebakke

## Last ned
Siste APK ligger på grenen [`apk`](../../tree/apk) (`SpillIHuset.apk`), og bygges automatisk av GitHub Actions ved hver endring på `main`.
Nye versjoner kan installeres oppå den gamle (samme signeringsnøkkel), så rekordene beholdes.

## Oppbygging
- `app/src/main/assets/www/` – selve spillet (HTML + three.js r147) og dataene: dronemodell, terreng, ortofoto og laserdata for utsikten.
- `app/src/main/java/.../MainActivity.kt` – WebView i fullskjerm (systemlinjene skjult, skjermen holdes på).
  Filene serveres med `WebViewAssetLoader` på `https://appassets.androidplatform.net/`, så `fetch()` og `localStorage` virker.
  Tilbakeknappen pauser spillet → går til menyen → lukker appen.
- `kilde/` – kildene spillet bygges fra:
  - `huset-3d.html` – 3D-modellen (samme som artifacten «Huset i 3D»).
  - `spill/game.js`, `spill/game.css` – spillene.
  - `spill/gen.py` – lager `spill.html` av modellen + spillene (litt mer snø, spurt, hooks for strømbrudd osv.).
  - `spill/gen_android.py` – kopierer `spill.html` og dataene inn i `app/src/main/assets/www/`.
  - `spill/gen_pwa.py` – samme spill som installerbar nettside (PWA).
