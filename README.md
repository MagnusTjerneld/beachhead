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

- **Enheter:** SPARV (billig spanare som utforskar ön själv), HÖK (beväpnad drönare), VARG (svävare, slagkraft, bär en fjärrstyrd MUS), BÄVER (ingenjör, bara på land, flygs i land av KROK) och KROK (bärgnings- och transporthelikopter).
- **Starten:** BÄVER och KROK finns från början, och kaptenen har 820 material att bygga resten för (samma värde som den gamla starten med HÖK, två VARG och 300 material). Testerna och testboten använder den gamla starten via `B.START`, så att resultaten går att jämföra bakåt.
- **Återvinn:** en enhet inom Birkas servicezon (eller på däck) plockas isär direkt för 80 % av byggkostnaden, en MUS ombord inräknad (VARG 160 + 24). Knappen Återvinn visar värdet och kräver ett andra klick, med varning för sista BÄVER; i hjulet finns Återvinn på en egen enhet vid fartyget. Enheten lämnar urval och wing och frigör en plats under taket. KROK återvinns inte, eftersom en förlorad KROK byggs om.
- **Byggbädden:** medan varvet bygger sveper portalkranen över bädden på Birkas däck, skrivhuvudet följer utskriften nedåt och svetsgnistor sprutar från munstycket (ett Points-anrop, additivt). Den nya enheten växer fram lager för lager (klippt vid utskriftshöjden, med ett glödande lager i snittet) och startar i bädden: HÖK och SPARV lyfter därifrån, VARG glider av däcket ut till styrbord, BÄVER kör längs däcket till en ledig helikopterplatta i aktern (en som ingen KROK äger och ingen annan BÄVER står på) och väntar där på KROK, även den BÄVER som finns från start. Utan bygge parkerar kranen akterut över en tom bädd. KROK byggs på sin plattform. Klippningen kräver `localClippingEnabled` på alla renderare.
- **Uppgiftsmärken:** det BÄVER arbetar med (spränga spärr: bomb, röja minor: mina, ta punkt: flagga, riva: hacka, laga: skiftnyckel) och det KROK har order att lyfta eller bärga (krok) märks över själva objektet, med en förloppsring. I 3D snurrar symbolen som ett mynt medan ringen alltid vänds mot kameran, och märket håller samma storlek på skärmen oavsett avstånd och syns genom terrängen; på sjökortet står samma symbol och ring ovanför målet.
- **BÄVER arbetar på plats:** den spränger en spärr först när den står i rutan intill (inom 12 m från spärrens rutor) och röjer ett minfält från kanten (6 till 7 m från den, närmare går inte eftersom kanten är spärrad mark). Från start står BÄVER på en ledig helikopterplatta, och från byggbädden kör den runt kontrolltornet på babordssidan.
- **Öarnas namn:** varje ö får ett namn ur fröet, en fågel, ett träd, ett bär eller ett däggdjur plus -ö, -skär, -holmen eller -näset (Tranholmen, Lingonskär).
- **Strategiska punkter:** ledningscentralen är målet. Verkstad, radarstation och fältvarv är frivilliga men ger service, spaning och en framskjuten byggplats.
- **Fiendens försvar:** fienden planerar försvaret när ön skapas. Den analyserar var man kan gå i land och vilka pass vägen till ledningscentralen måste ta, väljer doktrin (framskjutet, djup, fästning, rörligt) och fördelar en budget på spärrar, minfält, bunkrar, luftvärn, robotskyttar och reserv. Långa linjer stängs aldrig helt: det minst trafikerade passet lämnas öppet med en bunker bakom. Där en helikopter kan landsätta innanför försvaret förbi allt luftvärn stänger fästning och djupförsvar fickan med robotskyttar, medan framskjutet och rörligt försvar lämnar den. Laborera med `?budget=150&doktrin=djup` i adressen (standard 130, doktrinen väljs annars per ö).
- **Låsta sektorer och minor:** allt bakom en oröjd spärr är låst och kan inte försörjas (ingen service, ingen bärgning). Minfält på trånga vägar är nedgrävda och syns inte från luften: bara BÄVER:s detektor (48 m) hittar dem, och en VARG som kör på ett tar svår skada. BÄVER röjer dem.
- **Spanat område:** KROK flyger och bärgar bara där någon har tittat när den flyger själv. Luftvärnet ser och skjuter på KROK på 275 m, HÖK på 200 m och SPARV först inom radarns 110 m. Luftvärnet kan inte skjuta på markmål, så det slås ut från marken.
- **Ledningsnät:** Birka har bara kontakt inom radioräckvidd: 850 m från fartyget (som ankrar cirka 200 m utanför landstigningen) och 500 m runt varje tagen punkt. Radarstationen R2 finns alltid och är radiomast; med den tagen täcker nätet hela ön. Utanför fortsätter enheter med senaste ordern men tar inga nya, har ingen kamerabild och rapporterar inget. Planeraren värderar R2 högre (5 i stället för 3).
- **SPARV på radiolänk:** SPARV fungerar bara inom 250 m från Birka eller ett fordon (BÄVER, VARG), som själva når Birka. HÖK räknas inte, annars kunde en HÖK utanför kusten bära nätet. Spaningen följer alltså fronten. Sjökortet visar nätet när en SPARV är vald; en waypoint utanför stannar vid gränsen, och en SPARV som tappar länken vänder tillbaka.
- **SPARV utforskar:** ger kaptenen en SPARV ordern Utforska (knappen eller hjulet; fritt eller bara zonen man pekar på) utforskar den som uppdrag. En spanad zon rapporteras och SPARV väntar på order. Den väljer närmaste ospanade mark, håller sig utanför räckhåll för kända hot (45 m för bunkrar och robotskyttar, 110 m för luftvärnets radar), laddar vid fartyget och fortsätter. Ser 120 m och har batteri för tio minuter. Den går före HÖK när en VARG behöver spaning.
- **Kaptenen ger huvudordern:** autonomin verkar inom uppdragen och på händelser, aldrig förbi kaptenens kontroll. När BÄVER själv ber om lufttransport landar KROK den bara på spanad mark utanför kända hot, med en säker väg vidare till målet; finns ingen väntar BÄVER. BÄVER kör inte heller in i räckhåll för kända fiender. Kör ändå och Flyg ändå är kaptenens sätt att gå förbi reglerna.
- **Inställningar:** menyn i översta raden samlar musik, ljud, livebilder, autopaus, Starta om ön (med bekräftelse) och Ny ö, som öppnar en ruta för öns nummer (1000 till 9999, namnet visas medan du skriver) och klockslaget vid start; tomma fält ger slumpad ö och öns eget klockslag. Klockan på dygnet visas bredvid T+ i kameran och på sjökortets etikett.
- **Ljud:** varje enhet har en egen motorröst. Mixen går genom ett högpassfilter på 40 Hz, en mjuk kompressor och en begränsare strax under full nivå, så att flera bastunga motorer samtidigt (VARG, BÄVER, KROK) inte klipper. MUS har en egen ljus elmotorröst.
- **Autopaus:** valfri (av från början, sparas i webbläsaren). Spelet pausar när någon annan enhet än den du kör upptäcker en ny fiende, med en rad i loggen och knappar för att visa enheten och fortsätta. Ingen ny autopaus inom 3 s efter att du fortsatt.
- **Omgivande skärgård:** runt spelytan ligger en kuliss av öar, slumpad per ö mellan inner- och ytterskärgård med havet alltid i öster: höga skogklädda öar och sund i väster, kala hällar och öppen horisont i öster. En sammanslagen lågpolygonmesh utan träd eller skuggor (cirka 30 000 trianglar), tunnare dis än över spelytan, tända fönster och blinkande sektorfyrar på natten, och landkonturer utanför sjökortets ram.
- **Farleden:** öster om spelytan, på havssidan, går en farled med två körfält (norrgående på östra sidan) som kulissens skär hålls borta från. Där går två passagerarfärjor, en tanker, ett containerfartyg och ett mindre lastfartyg i slinga, med kölvatten, lanternor och upplysta fönster på natten. Varje skrov är en sammanslagen modell (ett ritanrop) med samma tunna dis som kulissen och utan skuggor, så kostnaden är liten. Ren kuliss utan påverkan på spelet.
- **Luftstöd i gruppen:** en order till en grupp eller wing med både fordon och HÖK gör HÖK till eskort åt fordonen (uppdrag), och den HÖK:en går först när fordonen behöver spaning. Välj HÖK ensam för att skicka den på egen hand.
- **Spaning åt VARG:** en VARG som anfaller ett kamouflerat mål som ingen ser ropar in en ledig HÖK som spanar från utanför känt luftvärn och väntar själv utom målets räckvidd. HÖK har fyra målsökande robotar som når 120 m (som robotskyttarnas), eller 170 m mot ett mål som en annan enhet har ögon på just nu, och har halv verkan mot pansar; bunkrar skjuter mot flyg på 130 m. Med en SPARV som pekar ut målet kan HÖK alltså slå från utanför bunkrarnas räckvidd.
- **Service på vald plats:** Till service skickar enheten till närmaste serviceplats. Högerklick på Birka eller en tagen verkstad eller ett fältvarv ger Service här, som skickar de valda just dit (BÄVER bara till land). Flygande enheter räknas som på plats vid en verkstad eller ett fältvarv inom 44 m, så en HÖK som cirklar där laddar robotar och batteri. När robotarna tar slut säger HÖK till och har en knapp Till service.
- **MUS:** varje VARG bär en MUS, en liten fjärrstyrd terrängbil utan autonomi. X (eller knappen MUS) sätter ut den och ger kaptenen kontroll; E släpper och den står kvar. Räckvidd 200 m från sin VARG (stannar vid gränsen, kan tas över av en annan VARG utan MUS om dess egen dör), syn 70 m även mot kamouflage och trupp i skog, minsökare 30 m, utlöser aldrig minor och kör genom den mark som ett hittat minfält spärrar för andra fordon (men inte genom spärrar, klippor eller vatten). F spränger laddningen: 200 i skada inom 8 m, avtagande till noll vid 12 m, så en stridsvagn eller bunker går. Rörliga förband ser den på 35 m och skjuter med gevär (3 i skada, var halva sekund, träff en på tre), fasta ställningar på 40 m men med en sjättedel av sin vanliga träffchans. Tål 10. Körs den tillbaka till sin VARG kommer den ombord igen; en förbrukad eller förlorad ersätts vid Birka, en tagen verkstad eller ett fältvarv för 30 material och 15 s. Räknas inte mot taket på tio enheter. En MUS som är ombord syns inte och kan inte väljas: inte i rutan på sjökortet, inte i wingar och inte i listan med enheter; den dyker upp först när den är utsatt.
- **Inget markförsvar är ett sittande mål:** inget markförsvar ska kunna skjutas ut från ett avstånd där det inte kan svara (tills en eventuell sabotageenhet finns). Bunker, stridsvagn, lätt pansar och robotskytt når 140 m mot mark, samma som VARG; bara pansarvärnet (170 m) når längre. Bunkern skjuter mot flyg på 130 m, robotskytten på 120 m. Infanteriet har granatgevär: 150 m, 18 i skada, omladdning 6 s, obegränsat, hör VARG på 220 m. Mot flyg bara granatgeväret, på 90 m och med en träff på fyra. Robotskytten har halv verkan mot fordon. Infanteri och pansarvärn i skog eller bebyggelse syns från luften först på 40 m, och infanteriet söker skydd inom 40 m från sin post. Mynningsflamman visar skytten för alla inom synhåll. Det ger en cirkel: VARG slår luftvärn och bunkrar, marktrupp i bakhåll slår VARG, HÖK slår marktrupp, luftvärn och robotskyttar slår HÖK. Luftvärnet kan inte skjuta mot mark och skyddas av pansarvärnslag. En VARG som väntar på spaning ställer sig strax utanför målets räckvidd och kör in när målet syns.
- **VARG mot stridsvagn och stöd i wingen:** VARG och fiendens stridsvagnar når båda 140 m. En mot en förlorar VARG oftast (den retirerar vid 30 %), så striden vinns med fler. VARG i samma wing (eller, utan wing, fordon inom 120 m) stöttar varandra: beskjuts en av en känd fiende kör de andra inom 300 m fram tills skytten är inom räckhåll och bekämpar den. En dold skytt angrips som vid en vanlig anfallsorder, med spaning först. Stödet slutar när skytten är slagen eller inte har skjutit på 12 s, och då återgår enheten till sin order. Det gäller inte på Dold, vid retirering eller när du har tagit kontrollen över enheten.
- **Markskydd för luftvärnet:** fienden har en egen öronmärkt budget för marktrupp (30 poäng utöver grundbudgeten 130). Den ställer ett dolt pansarvärnslag på flanken av varje luftvärn och varje robotskytt utan bunker i närheten, två vid de första nästena, och en stridsvagn vid ett luftvärn om det blir över. Området kring R1 lämnas som förut. Lagen håller sin plats i stället för att jaga larm. Pansarvärnets robot når 170 m (VARG 140) och laddar om på fyra sekunder, så luftvärnet går inte att plocka på avstånd: spana fram lagen och slå dem med HÖK (de kan inte skjuta mot flyg), eller ta striden. VARG tål 150 för att orka den. Testboten vinner lika ofta som före ändringen men tar längre tid och förlorar fler enheter.
- **KROK för hand:** välj KROK och tryck E. Inga säkerhetsmarginaler, en kamera rakt nedåt i hörnet, F lyfter fordonet eller högen under dig eller sätter ned lasten.
- **Fältreparation:** BÄVER lagar markfordon upp till 75 % där de står (B på en skadad VARG, eller automatiskt när den är ledig). Båda måste stå still och vara utanför eld, och det kostar material. Bakom en oröjd spärr är det den enda reparationen.
- **Ekonomi:** bärgning. Riv med BÄVER för fullt värde, skjut sönder för mindre.
- **Styrning:** klicka och dra för order, högerklick för orderhjulet, dra med höger musknapp för att panorera sjökortet, E tar och släpper kontroll, G får gruppen att följa den du kör.
- **Ropa in:** peka i kameran eller på sjökortet och tryck B (BÄVER), H (HÖK luftstöd), V (VARG) eller K (KROK). Fungerar även när du kör en enhet. Inropningen är tillfällig: enheten återgår sedan till sitt uppdrag (eskort, följ, observera). Skift gör den till nytt uppdrag; en vanlig order ersätter uppdraget. Hjulet (högerklick) har två nivåer: först vem (VARG överst, sedan medurs HÖK, SPARV, BÄVER och KROK på fasta platser, gråade om de saknas; wingarna i raden under eller med 1 till 4; flera av en sort öppnar en ring med Alla först), sedan vad de valda kan göra där du pekade, inklusive den tillfälliga inropningen för deras sort. Med ett urval börjar hjulet på andra nivån; mitten tar dig tillbaka till den första. Q byter huvudvy. Två livebilder: den första följer den valda enheten (den första valda som huvudkameran inte redan visar), den andra den enhet som senast rapporterade i loggen, eller byggbädden med förlopp när ett bygge startas på fartyget. Har en bild inget sådant att visa tar den enheten med mest händelser (beskjuten, i strid). FÄST låser en bild. Listen mellan huvudvyn och sidopanelen går att dra i för en bredare sidopanel med större livebilder (piltangenterna fungerar när listen har fokus, dubbelklick återställer); bredden sparas i webbläsaren.

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
| `t62.js` | MUS: ombord från start, bara fjärrstyrning, länkens gräns, minor utan att utlösa dem, kör genom spärrat minfält, laddningen, ersättning vid Birka, sikt mot dold trupp, bunkern träffar sällan |
| `t61.js` | Uppdrag och tillfälliga order: inropning återgår till uppdraget, Skift ger nytt uppdrag;  HÖK som luftstöd i blandad grupp, autopaus, stöd inom wingen, service på vald plats, återvinning |
| `t60.js` | Luftvärn efter målstorlek, KROK för hand, BÄVER lagar i fält, planerarens luckor och luftlandningsfickor, markskydd för luftvärnet, avbrutna byggen, fältlagning, HÖK-robotar, spaning åt VARG mot kamouflerade mål |

`smoke.py` laddar spelet i Chromium med Playwright, öppnar ordershjulet och fångar sidfel. Den behöver `npm install` i `tests/` (för Three.js) och Playwright för Python.

## Designdokument

Design, öppna frågor och planer finns i designdokumentet "Brohuvud: designdokument" i Claude.
