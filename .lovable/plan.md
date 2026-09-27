# More reading themes and Telugu fonts

## What will change

- Expand the theme selector from Light, Sepia, and Dark to six choices by adding Paper, Forest, and Midnight.
- Give each new theme a complete, readable palette for the page, scripture, controls, borders, highlights, and dialogs.
- Replace the current text-only theme buttons with compact color swatches and names so choices remain easy to scan on phones.
- Add the Telugu font families from FreeTeluguFonts.com that are not already available in the reader, prioritizing readable Unicode families such as Veturi, Sirivennela, Ramaneeya, Ravi Prakash, TANA, Annamayya, Nandakam, and Purushothamaa.
- Keep all existing Google-hosted Telugu fonts and preserve the currently selected font and theme between visits.
- Add a small source credit for the newly bundled fonts in Settings.

## Technical details

- Download the original font archives, verify Unicode font files and included licensing/readme information, then store the usable font binaries through the app’s asset storage.
- Register the bundled fonts with local `@font-face` declarations and add them to the existing font selector and live Telugu preview.
- Extend the saved theme type, validation, document theme classes, semantic color tokens, and share-image palette mapping.
- Keep Light as the default opening theme and retain Noto Serif Telugu as the default reading font.
- Verify the Settings panel and scripture rendering on desktop and mobile, including persistence after reload and a clean application build.
