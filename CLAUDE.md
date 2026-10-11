# Brohuvud: arbetsregler för Claude

## Designdokumentet

Designdokumentet "Brohuvud: designdokument" (https://claude.ai/artifact/LV1DFpR3XjETznwTT17eku) är källan för spelets design.

- Varje beslut som fattas i en session förs in i designdokumentet i samma session, innan arbetet avslutas. Det gäller ändrade regler, värden som ändrar hur spelet spelas, avgjorda öppna frågor och sådant vi bestämmer att inte göra.
- När något i spelet ändras så att dokumentet blir fel, rättas dokumentet samtidigt.
- Ändra bara det som beslutet berör. Säg i svaret vad som ändrades i dokumentet.
- Är det oklart om något är ett beslut eller bara en idé: fråga, eller för in det som öppen fråga.

## Språk och stil

- Svara på svenska.
- Använd aldrig tankstreck eller pratstreck (U+2013 och U+2014), varken i svar, kod, commits eller dokument.
- Säg emot när något verkar fel. Bästa möjliga resultat går före att hålla med.

## Spelet

- Spelet är en enda fil, `index.html` (Three.js r128 från cdnjs, sjökortet på 2D-canvas).
- Kör testerna innan commit: `cd tests && python3 mk.py && node t23.js && node t51.js && node t58.js && node t60.js && node t61.js`. `t45.js` är testboten (långsam); kör den när fiendens försvar eller enheternas beteende ändras och jämför vinstandelen.
- Varje ny version committas och pushas till GitHub (MagnusTjerneld/beachhead) och publiceras till artefakten "Brohuvud 2" (https://claude.ai/artifact/FW4tJouRfh7tvCG1j6wCEc).
- Håll README.md och spelets hjälptext ("Hur man spelar") i takt med ändringarna.
