# Uppdrag Arkipelag (tidigare Brohuvud): arbetsregler för Claude

## Designdokumentet

Designdokumentet "Uppdrag Arkipelag: designdokument" (https://claude.ai/artifact/LV1DFpR3XjETznwTT17eku) är källan för spelets design.

- Varje beslut som fattas i en session förs in i designdokumentet i samma session, innan arbetet avslutas. Det gäller ändrade regler, värden som ändrar hur spelet spelas, avgjorda öppna frågor och sådant vi bestämmer att inte göra.
- När något i spelet ändras så att dokumentet blir fel, rättas dokumentet samtidigt.
- Ändra bara det som beslutet berör. Säg i svaret vad som ändrades i dokumentet.
- Är det oklart om något är ett beslut eller bara en idé: fråga, eller för in det som öppen fråga.

## Språk och stil

- Svara på svenska.
- Använd aldrig tankstreck eller pratstreck (U+2013 och U+2014), varken i svar, kod, commits eller dokument.
- Säg emot när något verkar fel. Bästa möjliga resultat går före att hålla med.

## Arbetssätt: matcha insatsen mot frågan

- Utgå från att Magnus meddelanden är designdiskussion, om han inte uttryckligen säger "gör", "implementera", "ändra" eller liknande. "Vi måste åtgärda X" betyder att X är ett problem att lösa på sikt, inte en order nu.
- Designdiskussion: svara kort med en bedömning utifrån det du redan vet om koden och designen. Säg vad som är osäkert och vilken simulering som skulle avgöra det. Kör ingenting.
- Är du osäker på om han vill ha en ändring: fråga i en mening i slutet av svaret.
- Tydlig ändringsinstruktion: gör ändringen och kör de snabba testerna. Fråga innan du kör testboten eller andra simuleringar.
- Allt som tar mer än cirka två minuter kräver att han sagt ja först.
- Vänta aldrig med fasta sleeps. Korta jobb körs i förgrunden; längre jobb i bakgrunden med en .done-flagga och en kort poll-loop med tak.

## Spelet

- Spelet är en enda fil, `index.html` (Three.js r128 från cdnjs, sjökortet på 2D-canvas).
- Kör de snabba testerna innan commit: `node tests/run.js` (bygger g2.js och kör t23, t51, t58, t60, t61 och t62, cirka en halv minut).
- `tests/t45.js` är testboten: `node tests/t45.js base quick` (fyra öar, cirka en minut) eller `node tests/t45.js` (tio öar, två till tre minuter). Den hör till faktiska ändringar av fiendens försvar eller enheternas beteende, inte till resonemang, och körs bara efter att Magnus sagt ja.
- Varje ny version committas och pushas till GitHub (MagnusTjerneld/beachhead) och publiceras till spelets artefakt ("Uppdrag Arkipelag", tidigare "Brohuvud 2") (https://claude.ai/artifact/FW4tJouRfh7tvCG1j6wCEc).
- Håll README.md och spelets hjälptext ("Hur man spelar") i takt med ändringarna.
