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
- Kör de snabba testerna innan commit: `node tests/run.js` (bygger g2.js och kör t23, t51, t58, t60, t61, t62, t63, t64, t65, t66, t67, t68 och t69, cirka en och en halv minut).
- `tests/t45.js` är testboten: `node tests/t45.js base quick` (fyra öar, cirka en minut) eller `node tests/t45.js` (tio öar, två till tre minuter). Den hör till faktiska ändringar av fiendens försvar eller enheternas beteende, inte till resonemang, och körs bara efter att Magnus sagt ja.
- `tests/sandbox.js` är sandlådan: anfallsscenarier med en wing mot bestämda försvarare, utan att ta en hel ö (`node tests/sandbox.js --list`). Tio omgångar av alla scenarier tar cirka tio sekunder. Den ger statistik, inte godkänt eller underkänt, och är verktyget för balans och gruppbeteende.
- `tests/falt.js` är fälttestet: wingar på riktiga öar som får order genom samma funktion som ett klick på sjökortet (två VARG mot luftvärn, tre VARG och HÖK mot bunker, två VARG och VARG med BÄVER till en punkt, SPARV ut och hem), sex öar på cirka en halv minut (`node tests/falt.js`, eller `node tests/falt.js 5555,9052 120 lv,sparv`). Det flaggar omvägar, tid i vatten, enheter som står still med order och flyg nära luftvärn; en flagga är ett spår att följa, inte ett fel. Verktyget för vägval och beteende på riktig terräng, där sandlådans öppna arena inte räcker.
- `tests/stills.js` gör stillbildsserier och kontaktkartor av spelet (`node tests/stills.js arstider ut.jpg`, inbyggda serier `arstider`, `manader`, `vinter` och `ar`, eller en egen JSON-lista med datum, klockslag, molntäcke och kamera). Varje bild tas med spelets `__BHstill`, samma steg som en bildruta inklusive trädgallringen, så att första bilden i en serie också har sina träd. Använd det i stället för egna engångsskript. Cirka 1,5 s per bild; serier över cirka 60 bilder kräver ja först.
- `tests/arstider.js` gör årstidsbilden: samma ö, klockslag och drönarkamera den tydligaste dagen per årstid, varje bild i full storlek i spelets fotoläge (`&photo`) och en bild hopsatt av fyra vertikala strimlor, vår, sommar, höst och vinter (`node tests/arstider.js [ö] [ut] [--cam x,y,z --look x,y,z --klocka --moln --bredd --datum]`, standard ö 2024 och 3402 px, cirka en minut). Återanvänd den i stället för egna skript när årstiderna ska visas.
- `proto/avskiljare.html` är testbänken för avskiljare (stenmur, mur med stängsel, mur med buskage, raserad stenrad, åkerholme, bergrygg med branter, gränsmur med och utan blockband) på plan åkermark med spelets ljus. `node proto/avskiljare.js [ut.jpg]` renderar en översikt och varje typ från drönarhöjd, 25 m och ögonhöjd, cirka 15 sekunder. Modellerna (stenar, buskar) är tänkta att flyttas in i spelet; små murar och stängsel är sparade här men används inte i spelet tills vidare.
- Magnus kan spela in manuella testrundor (Spela in testrunda, `?rec`) och ge filen till Claude. Formatet beskrivs i filens `legend`; läs kontrollpunkterna (`events` med `type:'kontrollpunkt'`, hans kommentar, en full bild av läget och en skärmbild med hans markeringar) först; `node tests/kontrollpunkter.js fil.json` skriver ut kommentarerna och packar ut skärmbilderna som filer att titta på och spåra sedan enheterna i `snapshots` runt dem. Gren-artefakten publiceras med `capabilities: {downloads: true}` så att filen (och trailerns video) går att ladda ner.
- Varje ny version committas och pushas till GitHub (MagnusTjerneld/beachhead). Spelets artefakt ("Uppdrag Arkipelag", tidigare "Brohuvud 2") (https://claude.ai/artifact/FW4tJouRfh7tvCG1j6wCEc) följer main och publiceras när main uppdateras. Arbete i en feature-gren publiceras i stället till en egen artefakt för grenen (titel "Uppdrag Arkipelag (gren <namn>)"), skapad vid grenens första publicering och uppdaterad vid varje push, så att grenens ändringar kan provas för sig. Webbläsarens sparade data (till exempel benchmarkets baslinje) följer inte med mellan artefakter. Publicera alltid `music/theme.mp3` med som fil bredvid sidan (spelet och trailern läser musiken därifrån; utan den är spelet tyst och trailern startar inte). Ingen separat trailer-artefakt publiceras: trailern startas från spelet (Trailer i Inställningar), och för main finns direktlänken `/beachhead/trailer/` på GitHub Pages.
- Enhetsgalleriet (`proto/enhetsgalleri.html`, på GitHub Pages under `/beachhead/proto/`, och artefakten "Enhetsgalleri", https://claude.ai/artifact/KGtiQZtGf2S3ZR2hnHtfXS) byggs av `python3 proto/mkgalleri.py` ur spelets modeller och värden. Kör det och committa resultatet i samma commit varje gång en ändring rör en enhets modell eller värden, och publicera artefakten på nytt, så att galleriet alltid stämmer med spelet.
- `tests/trailer.js` gör stillbilder av trailern, några per bild i en kontaktkarta, genom att stega filmen på dess egen klocka (`node tests/trailer.js ut.jpg --skott 5,15 --andel .2,.6`, eller `--tid 12.5,30`). Cirka 3 s per bild i molnet; alla 23 bilder två gånger är godkänt som granskning av trailern.
- `tests/trailerkoll.js` är kontrollen av trailern: den stegar varje bild utan att rendera och flaggar aktörer på marken som kör genom träd, block, murar, hus, vrak eller ut i vattnet, en kamera inne i en trädkrona och skymd sikt till motivet (`node tests/trailerkoll.js`, några sekunder, `--karta ut.png` ritar slagfältet ovanifrån med hinder, banor och kameror). Kör den efter ändringar i ö-generatorn eller i `FILM_SHOTS`; den hör inte till run.js. Lokalt på Windows använder trailerverktygen grafikkortet, eftersom swiftshader tappar WebGL-kontexten där.
- Trailern ligger i index.html (filmläget, `?trailer`, manuset i `FILM_SHOTS`) och spelas på GitHub Pages under `/beachhead/trailer/`. Den följer spelets modeller automatiskt; ändringar i själva filmen granskas med stillbilder per bild eller en lågupplöst rendering, som tar flera minuter och därför kräver ja först.
- Håll README.md och spelets hjälptext ("Hur man spelar") i takt med ändringarna.
