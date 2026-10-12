# Uppdrag Arkipelag

Tidigare arbetsnamn: Brohuvud.

Prototyp av ett actionspel om att leda autonoma enheter från HMS Birka, en flytande varvspråm, och frigöra öarna i Stockholms yttre skärgård, en ö i taget. Inspirerat av Hostile Waters, Battlezone och Duskers.

Uppdrag Arkipelag, 2032: Ryssland har befäst öar i skärgården som språngbräda mot Sverige, och det som finns kvar av svensk försvarsindustri har byggt Birka, en fissionsdriven pråm som skriver ut och monterar obemannade stridsenheter. Hela bakgrunden finns i designdokumentet.

Spelet är en enda HTML-fil med Three.js (r128 från cdnjs) för 3D och ett 2D-sjökort ritat på canvas. Varje ö genereras från ett frö, så samma ö-variant blir alltid samma ö.

## Köra spelet

Temamusiken laddas från `music/theme.mp3`, så servera katalogen i stället för att öppna filen direkt:

```
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000. Utan server fungerar spelet, men utan musik.

## Innehåll

| Sökväg | Vad |
|---|---|
| `index.html` | Hela spelet: världsgenerering, simulering, sjökort, 3D, ljud och gränssnitt |
| `music/theme.mp3` | Temat, spelas bara på titel- och slutskärmen |
| `tests/` | Huvudlösa tester i Node och ett röktest i webbläsaren |

## Kort om spelet

- **Enheter:** SPARV (billig spanare som utforskar ön själv), HÖK (beväpnad drönare), VARG (svävare, slagkraft), BÄVER (ingenjör, bara på land, flygs i land av KROK) och KROK (bärgnings- och transporthelikopter).
- **Öarnas namn:** varje ö får ett namn ur fröet, en fågel, ett träd, ett bär eller ett däggdjur plus -ö, -skär, -holmen eller -näset (Tranholmen, Lingonskär).
- **Strategiska punkter:** ledningscentralen är målet. Verkstad, radarstation och fältvarv är frivilliga men ger service, spaning och en framskjuten byggplats.
- **Fiendens försvar:** fienden planerar försvaret när ön skapas. Den analyserar var man kan gå i land och vilka pass vägen till ledningscentralen måste ta, väljer doktrin (framskjutet, djup, fästning, rörligt) och fördelar en budget på spärrar, minfält, bunkrar, luftvärn, robotskyttar och reserv. Långa linjer stängs aldrig helt: det minst trafikerade passet lämnas öppet med en bunker bakom. Där en helikopter kan landsätta innanför försvaret förbi allt luftvärn stänger fästning och djupförsvar fickan med robotskyttar, medan framskjutet och rörligt försvar lämnar den. Laborera med `?budget=150&doktrin=djup` i adressen (standard 130, doktrinen väljs annars per ö).
- **Låsta sektorer och minor:** allt bakom en oröjd spärr är låst och kan inte försörjas (ingen service, ingen bärgning). Minfält på trånga vägar är nedgrävda och syns inte från luften: bara BÄVER:s detektor (48 m) hittar dem, och en VARG som kör på ett tar svår skada. BÄVER röjer dem.
- **Spanat område:** KROK flyger och bärgar bara där någon har tittat när den flyger själv. Luftvärnet ser och skjuter på KROK på 275 m, HÖK på 200 m och SPARV först inom radarns 110 m. Luftvärnet kan inte skjuta på markmål, så det slås ut från marken.
- **Ledningsnät:** Birka har bara kontakt inom radioräckvidd: 850 m från fartyget (som ankrar cirka 200 m utanför landstigningen) och 500 m runt varje tagen punkt. Radarstationen R2 finns alltid och är radiomast; med den tagen täcker nätet hela ön. Utanför fortsätter enheter med senaste ordern men tar inga nya, har ingen kamerabild och rapporterar inget. Planeraren värderar R2 högre (5 i stället för 3).
- **SPARV på radiolänk:** SPARV fungerar bara inom 250 m från Birka eller ett fordon (BÄVER, VARG), som själva når Birka. HÖK räknas inte, annars kunde en HÖK utanför kusten bära nätet. Spaningen följer alltså fronten. Sjökortet visar nätet när en SPARV är vald; en waypoint utanför stannar vid gränsen, och en SPARV som tappar länken vänder tillbaka.
- **SPARV utforskar:** ger kaptenen en SPARV ordern Utforska (knappen eller hjulet; fritt eller bara zonen man pekar på) utforskar den som uppdrag. En spanad zon rapporteras och SPARV väntar på order. Den väljer närmaste ospanade mark, håller sig utanför räckhåll för kända hot (45 m för bunkrar och robotskyttar, 110 m för luftvärnets radar), laddar vid fartyget och fortsätter. Ser 120 m och har batteri för tio minuter. Den går före HÖK när en VARG behöver spaning.
- **Kaptenen ger huvudordern:** autonomin verkar inom uppdragen och på händelser, aldrig förbi kaptenens kontroll. När BÄVER själv ber om lufttransport landar KROK den bara på spanad mark utanför kända hot, med en säker väg vidare till målet; finns ingen väntar BÄVER. BÄVER kör inte heller in i räckhåll för kända fiender. Kör ändå och Flyg ändå är kaptenens sätt att gå förbi reglerna.
- **Inställningar:** menyn i översta raden samlar musik, ljud, livebilder, autopaus, Starta om ön och Ny ö (med bekräftelse). Klockan på dygnet visas bredvid T+ i kameran och på sjökortets etikett.
- **Autopaus:** valfri (av från början, sparas i webbläsaren). Spelet pausar när någon annan enhet än den du kör upptäcker en ny fiende, med en rad i loggen och knappar för att visa enheten och fortsätta. Ingen ny autopaus inom 3 s efter att du fortsatt.
- **Omgivande skärgård:** runt spelytan ligger en kuliss av öar, slumpad per ö mellan inner- och ytterskärgård med havet alltid i öster: höga skogklädda öar och sund i väster, kala hällar och öppen horisont i öster. En sammanslagen lågpolygonmesh utan träd eller skuggor (cirka 30 000 trianglar), tunnare dis än över spelytan, tända fönster och blinkande sektorfyrar på natten, och landkonturer utanför sjökortets ram.
- **Luftstöd i gruppen:** en order till en grupp eller wing med både fordon och HÖK gör HÖK till eskort åt fordonen (uppdrag), och den HÖK:en går först när fordonen behöver spaning. Välj HÖK ensam för att skicka den på egen hand.
- **Spaning åt VARG:** en VARG som anfaller ett kamouflerat mål som ingen ser ropar in en ledig HÖK som spanar från utanför känt luftvärn och väntar själv utom målets räckvidd. HÖK har fyra målsökande robotar som når 120 m (som robotskyttarnas), eller 170 m mot ett mål som en annan enhet har ögon på just nu, och har halv verkan mot pansar; bunkrar skjuter mot flyg på 130 m. Med en SPARV som pekar ut målet kan HÖK alltså slå från utanför bunkrarnas räckvidd.
- **Markskydd för luftvärnet:** fienden har en egen öronmärkt budget för marktrupp (30 poäng utöver grundbudgeten 130). Den ställer ett dolt pansarvärnslag på flanken av varje luftvärn och varje robotskytt utan bunker i närheten, två vid de första nästena, och en stridsvagn vid ett luftvärn om det blir över. Området kring R1 lämnas som förut. Lagen håller sin plats i stället för att jaga larm. Pansarvärnets robot når 170 m (VARG 150) och laddar om på fyra sekunder, så luftvärnet går inte att plocka på avstånd: spana fram lagen och slå dem med HÖK (de kan inte skjuta mot flyg), eller ta striden. VARG tål 150 för att orka den. Testboten vinner lika ofta som före ändringen men tar längre tid och förlorar fler enheter.
- **KROK för hand:** välj KROK och tryck E. Inga säkerhetsmarginaler, en kamera rakt nedåt i hörnet, F lyfter fordonet eller högen under dig eller sätter ned lasten.
- **Fältreparation:** BÄVER lagar markfordon upp till 75 % där de står (B på en skadad VARG, eller automatiskt när den är ledig). Båda måste stå still och vara utanför eld, och det kostar material. Bakom en oröjd spärr är det den enda reparationen.
- **Ekonomi:** bärgning. Riv med BÄVER för fullt värde, skjut sönder för mindre.
- **Styrning:** klicka och dra för order, högerklick för orderhjulet, dra med höger musknapp för att panorera sjökortet, E tar och släpper kontroll, G får gruppen att följa den du kör.
- **Ropa in:** peka i kameran eller på sjökortet och tryck B (BÄVER), H (HÖK luftstöd), V (VARG) eller K (KROK). Fungerar även när du kör en enhet. Inropningen är tillfällig: enheten återgår sedan till sitt uppdrag (eskort, följ, observera). Skift gör den till nytt uppdrag; en vanlig order ersätter uppdraget. Hjulet (högerklick) visar också de enskilda enheterna som kan ropas in, närmast först, så att du väljer vem som går utan att välja den först. Q byter huvudvy; två livebilder visar andra enheter.

Hela reglerna finns under "Hur man spelar" i spelet.

## Tester

Testerna kör spelets skript utan webbläsare. `mk.py` plockar ut skriptet ur `index.html` till `tests/g2.js`.

```
node tests/run.js  # bygger g2.js och kör de fem snabba testerna parallellt (cirka en halv minut)
cd tests
python3 mk.py
node t23.js        # kartvalidering: målen nåbara, ledningscentralen försvarad, budgeten använd
node t51.js        # strategiska punkter: verkstad, radar, fältvarv, vinst
node t58.js        # låsta sektorer, minor och inropning
node t61.js        # uppdrag och tillfälliga order
node t60.js        # luftvärn efter målstorlek, KROK för hand, fältreparation, luckor och luftlandningsfickor
node t45.js base quick  # datorspelare på fyra öar (cirka en minut)
node t45.js base        # datorspelare på tio öar (två till tre minuter; öarna körs parallellt om det finns flera kärnor)
```

| Test | Prövar |
|---|---|
| `t23.js` | Kartgeneratorn och fiendens försvarsplan på tio öar |
| `t30.js` | Bärgning, manuell eld, rivning, bränsledepåns explosion |
| `t45.js` | Datorspelare, statistik per ö (vinster, tid, förluster, bärgning) |
| `t48.js` | Lufttransport av VARG och BÄVER |
| `t49.js`, `t50.js`, `t56.js` | Försök att flyga in VARG djupt bakom försvaret |
| `t51.js` | Strategiska punkter och motanfall mot fältvarvet |
| `t52.js` | KROK väntar på spaning innan automatisk bärgning |
| `t53.js` | HÖK som eskort, offensiv och defensiv |
| `t54.js` | Gruppen följer en manuellt styrd enhet |
| `t55.js` | VARG skjuter under förflyttning |
| `t57.js` | BÄVER beställer lufttransport från fartyget |
| `t58.js` | Låsta sektorer, försörjning bakom spärr, minor och inropning |
| `t61.js` | Uppdrag och tillfälliga order: inropning återgår till uppdraget, Skift ger nytt uppdrag; välj enhet i hjulet, HÖK som luftstöd i blandad grupp, autopaus |
| `t60.js` | Luftvärn efter målstorlek, KROK för hand, BÄVER lagar i fält, planerarens luckor och luftlandningsfickor, markskydd för luftvärnet, avbrutna byggen, fältlagning, HÖK-robotar, spaning åt VARG mot kamouflerade mål |

`smoke.py` laddar spelet i Chromium med Playwright, öppnar ordershjulet och fångar sidfel. Den behöver `npm install` i `tests/` (för Three.js) och Playwright för Python.

## Designdokument

Design, öppna frågor och planer finns i designdokumentet "Brohuvud: designdokument" i Claude.
