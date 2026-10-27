# Backlog

Idéer som inte är beslut. Ett beslut förs in i designdokumentet; den här filen samlar sådant som väntar på att prövas eller
prioriteras. Varje punkt säger var idén kommer ifrån, vad den skulle ge och hur den avgörs.

## Lärdomar från Theatre of War (fltman/theatre-of-war, lärosittning 27 okt 2026)

Hans repo: animerat Risk på ett krigsrumsbord, Three.js r186 med Vite, modeller byggda i Blender med Python.
Reservation: repot publicerades med en första commit på 838 filer, och delar är återanvända från hans tidigare projekt
(Blender-biblioteket, redaktionen), så takten i commitloggen säger lite om arbetssättet. Hans spel är turbaserat med några
dussin pjäser nära kameran; vårt är realtid med många enheter, hela öar och en hög kamera. Allt nedan måste prövas på vårt
kameraavstånd och vår bildfrekvens.

### 1. Bakad AO, krökning och kavitet i vertexfärgen (modelldetalj)

Han bakar per modell tre kanaler i vertexfärgen: R = ambient occlusion, G = krökning (konvexa kanter), B = kavitet. Shadern
använder G till slitage bara på verkliga kanter och B till smuts i skrevorna. Det kostar nästan inget vid körning och är
den största orsaken till att hans modeller ser detaljerade ut med få trianglar.

- Hos oss: bakningen kan göras i JS (strålar mot den egna meshen vid uppstart eller som byggsteg) utan Blender.
- Avgörs av: en prototyp på en enhet (VARG) och en stillbildsserie med `tests/stills.js` före och efter, på spelets
  vanliga kameraavstånd och i drönarläge. Mät uppstartstid och bildfrekvens.
- Osäkert: om skillnaden syns på vårt avstånd; om det krockar med `vcMat`/`vcOK` som redan använder vertexfärg för
  sammanslagna statiska meshar.

### 2. Fasade kanter och rikare former på enheterna

Hans bibliotek har rotationskroppar (`lathe`), loft, rör längs en kurva, avsmalnande kapslar och fasning som modifierare.
Fasade kanter fångar ljus och gör mer för intrycket än fler detaljer. Vi bygger av `box` och `cyl`.

- Avgörs av: samma prototyp som punkt 1, med och utan fasning, så att de två effekterna går att skilja åt.
- Hör ihop med enhetsgalleriet, som måste byggas om vid varje modelländring.

### 3. Modellkontrakt som kontrolleras maskinellt

Hans CONTRACT.md bestämmer nodnamn, materialnamn, UV-ytor och taket för trianglar per modell, och `inspect_models.mjs`
kontrollerar varje modell mot det. Vårt `proto/mkgalleri.py` plockar kod ur index.html med strängsökning och kan gå sönder
tyst när en funktion byter form.

- Förslag: ett snabbt test som bygger varje enhetsmodell headless och kontrollerar antal trianglar, draw calls och de delar
  som spelet animerar (rotorer, torn). Kandidat till `tests/run.js` om det tar några sekunder.

### 4. "Fällor (upplevda)" i CLAUDE.md

Hans CLAUDE.md har en kort lista över saker som har bitit honom (UV-origo i glTF, nya ljuskällor som tvingar omkompilering,
z-fighting). Vår CLAUDE.md är främst en verktygskatalog; lärdomarna ligger utspridda i commits och designdokumentet.

- Förslag: en sektion med fällor, en rad per fälla, som fylls på när en bugg visar sig bero på något icke uppenbart.
  Kräver inget test; avgörs av om Magnus vill ha den.

### 5. Dela upp index.html

Hans största fil är cirka 1 200 rader. Vår index.html är cirka 9 300 rader och 1,1 MB med långa rader, vilket gör varje
ändring dyrare för Claude (sökning och läsning av stora block). Störst vinst på sikt, men störst ingrepp: artefakternas
publicering, bygget av g2.js, `mkgalleri.py`, `mkljud.py` och trailerverktygen läser alla ur filen.

- Avgörs av: en genomgång av vad som läser index.html och om ett byggsteg (som fortfarande ger en enda fil att publicera)
  löser det. Inte före en lugn period utan stora grenar på väg in.

### 6. Delbara byggsteg och utkastläge

`build_assets.sh --only tank,radio` och `--fast` (halv kvalitet som utkast), med ett kontaktark över alla modeller efter
varje bygge. Relevant för oss först om punkt 1 eller 2 blir ett byggsteg.

### Sådant vi inte tar efter

- Blender som beroende: kräver installation lokalt och i molnet och bryter mot att spelet är en fil. Tas upp igen bara om
  punkt 1 och 2 visar att JS inte räcker.
- Hans testnivå: han testar regler, redaktion och server men har inget som motsvarar sandlådan, fälttestet eller
  trailerkollen. Där ligger vi före.
