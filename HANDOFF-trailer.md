# Handoff: översyn av trailern (gren claude/kind-maxwell-oi826z)

Tas bort när arbetet är klart.

## Uppdraget (Magnus sa "Ja, kör på" 17 okt)

Trailern har gått sönder efter ändringarna i ö-generatorn. Att göra:

1. VARG kör rakt igenom bråte på stranden (bild 5, `strand`).
2. MUS kör rakt igenom en mur (bild 15, `mus`).
3. Fyren syns inte när vi flyger mot den (bild 22 `fyren`, bild 23 `logga`).
4. Klippet i musiken ska bli mjukare.
5. Bilderna på GETING (bild 8, heter fortfarande `sparv`) och HÖK (bild 9, `hokar`) ligger för nära och kameran skakar.
6. HÖK skjuter robotar mot inget mål, rakt i backen (bild 13, `robotar`).

## Grundorsak

Bilderna i `FILM_SHOTS` (index.html, sök `const FILM_SHOTS`) står på fasta koordinater på Sorkholmen (ö 7341), till exempel `1365,712`, `1452,690` och fyrkamerans start `870,1380`. Generatorn har flyttat saker under dem. `fPlace` lägger bara enheten på marken och vet inget om murar, vrak, hus eller träd. Undvik att bara flytta siffror: det går sönder igen vid nästa ändring av generatorn.

## Gjort hittills

- `tests/trailer.js`: stillbilder av trailern, några per bild, i en kontaktkarta. Varje bild nås genom att filmen stegas från bildens början på filmens egen klocka. Ungefär 3 s per bild i molnet (swiftshader), mycket snabbare lokalt.
  `node tests/trailer.js ut.jpg --skott 5,15,22 --andel .2,.6,.95` (`--tid 12.5,30` för filmtider, `--bredd 640`).
- `globalThis.__FILM` exponerar nu även `SHOTS, shotT, END, frame, compose, seed, clear, warm, step` (filmStart i index.html), som verktyget använder.
- Snabbtesterna (`node tests/run.js`) går igenom.

## Vad stillbilderna visade (före ändring)

- Bild 5: två stora bruna vrak (`hulk`, 9 x 4,4 m, `WORLD.debris`, läggs 12 till 110 m från `WORLD.landing` på stranden, rad ~1184) står vid sidorna av VARG-stråken (±14 m från landningen).
- Bild 15: bunkern är en stor brun kulle. Vid explosionen blir hela marken gulvit, så sprängljuset är för starkt på nära håll. Muren syntes inte på 20 och 60 %; kör fler tidpunkter, till exempel `--andel .05,.15,.3,.45`.
- Bild 13: robotarna slår ned bredvid en stenrad/rasmassor. Inget mål står där: `aa1` ställs bara ut i bild 11 och 17 (på 1340,690), och bild 17 visar redan luftvärnet träffas av robotar.
- Bild 22 och 23: kameran slutar *inne i trädkronor*, 95 m söder om fyren (`L.y-95`), så fyren och loggans bakgrund är bara mörka löv.
- Bild 8 och 9: kameran ligger 4,4 m från GETING och 9 till 11 m bakom HÖK, med skakning 0,02 och 0,06. Farkosterna gungar dessutom (sinus), och på det avståndet läses gungningen som skak.

## Plan (det Magnus sagt ja till)

1. **Röjning för filmen**, som `filmClearings`/`FILM_CLEAR` redan gör för träd. Förslag: varje bild får ett valfritt fält `lanes()` som ger stråk `[x1,z1,x2,z2,bredd]` räknade ur världen (till exempel ur `WORLD.landing` och `fDir(FILM.b0,WORLD.landing)`). Vid `filmStart` tas allt i stråken bort: träd, murinstanser (`W.walls`, en InstancedMesh på rad ~4371, spara den som `R3.wallM` och nolla matriserna) och vrak (ta bort ur `G.wrecks` i filmen; sync tar bort meshen). Samma stråk används av kontrollen nedan.
   - Bild 15 (MUS): hellre flytta bunkern och banan till en fri sträcka än riva en mur som syns i bild.
2. **Kontrollskript** (till exempel `tests/trailerkoll.js`, inte i run.js): stega varje bild med `__FILM.step` och flagga synliga aktörer (`FILM.act`, och `R3.movers` med `varg` när `FILM.useMovers`) som korsar murar (`W.walls`, ruta 3,6 x 1,8 m vriden `a`), vrak (`G.wrecks`), hus (`W.structs`, `W.decor.villas/sheds/cabins`), trädstammar (`W.trees`, höjd ungefär 13*s) och vatten för markfordon. Flagga också en kamera inne i en trädkrona, och siktlinjen kamera till motiv (`R3.lookAt`) mot terrängen (`groundY`) och kronor. Några sekunder och ingen rendering.
3. **Fyren (bild 22 och 23):** räkna kamerans slutläge ur `WORLD.decor.light`. Sök bäring och avstånd (60 till 140 m) där siktlinjen till både lampan och fyrens fot är fri från terräng och kronor, och där kameran inte står i ett träd. Ersätt även den fasta starten `sx=870,sz=1380` med en punkt räknad bakåt längs samma bäring. Bild 23 fortsätter från samma punkt.
4. **Musiken:** `FILM_MUS` och övertoningen finns på två ställen: `filmClick` (live) och `filmScore` (export). Håll dem lika, helst med en gemensam hjälpfunktion. I dag är det en skarv på 12 ms vid takt 13 till 65 (`fk(13)`, källa `fk(65)`). Rendera tre korta prov runt skarven (cirka 4 s före till 4 s efter) med OfflineAudioContext ur `music/theme.mp3` och låt Magnus lyssna:
   a. takt 12 klingar ut cirka ett slag (`FILM_BAR/4`, 0,56 s) under det nya avsnittet, som börjar för fullt på nedslaget;
   b. likeffekts-övertoning under ett slag före nedslaget (andra avsnittet startar ett slag tidigare i källan);
   c. som a men en halv takt.
   Nedslagen ska ligga kvar på samma ställe, eftersom klippen följer `fk()`.
5. **Bild 8 och 9:** 15 till 25 m avstånd, skakning 0, bildvinkel (`FILM.fov`) cirka 30, mindre gungning. Döp om bild 8 från `sparv` till `geting`. Kontrollera om id:t används någon annanstans (grep `'sparv'`) och uppdatera kommentaren.
6. **Bild 13:** sikta robotarna på stridsvagnen som exploderar i bild 14 (`et1`, banan `[[1300,752],[1332,734]]` i `traff`), ställ ut den i bild 13 och se till att nedslaget hamnar i bild. Då blir 13 till 14 orsak och verkan. Koordinaterna 1300,752 bör också gå genom kontrollen.
7. Kolla även övriga bilder med `node tests/trailer.js` (alla 23 bilder x 2, cirka 1 till 2 min lokalt). Bild 7, 10, 14, 16 och 18 till 20 står också på fasta koordinater i ängen kring `FILM_BF={x:1365,z:712}`.

## Läge 17 okt kväll (session 2)

Gjort, se commit: röjning med stråk (`lanes()`, `filmClearAt`, `R3.looseM`), `tests/trailerkoll.js` (inga flaggor), MUS från sydost (`FILM_MUS_P`), robotarna i bild 13 mot `et1` (`FILM_ET1`) med nedslaget i bild 14, bild 8 (`geting`, 11 m) och 9 (cirka 22 m, bildvinkel 30 och 38), fyren flyttad till krönet i filmen (`filmLighthouse`, Magnus ville ha den högre) med kameran ur `filmLhView`, sprängljuset dämpat i filmen och spårljus inte förbi linsen.
Musiken: `filmMusic` är gemensam för live och export, `FILM_XF` väljer skarven (`cut` nu). Prov ligger i scratchpad (skarv-0, a, b, c). **Väntar på Magnus val** och på hans ja till fyren på krönet. Därefter: sätt `FILM_XF`, för in besluten i designdokumentet och ta bort den här filen.

## Regler att komma ihåg (CLAUDE.md)

- Svara på svenska. Inga tankstreck (U+2013, U+2014) någonstans.
- `node tests/run.js` före varje commit. Rendering eller simulering över cirka två minuter kräver Magnus ja (trailerstillbilderna är godkända i den här uppgiften).
- Push till `claude/kind-maxwell-oi826z`, och publicera grenens artefakt "Uppdrag Arkipelag (gren kind-maxwell-oi826z)" med `music/theme.mp3` som fil bredvid och `capabilities: {downloads: true}`.
- För in besluten i designdokumentet (https://claude.ai/artifact/LV1DFpR3XjETznwTT17eku) när de är gjorda: musikskarvens lösning, bild 13 som siktar på stridsvagnen, avstånden i bild 8 och 9, och röjningen och kontrollen för trailern. Ingenting av det är infört än.
- Nämn `tests/trailer.js` (och kontrollskriptet) i CLAUDE.md. Raden om trailer.js är redan tillagd.
