# Brohuvud

Prototyp av ett strategispel om att leda obemannade enheter från ett basfartyg och frigöra öarna i Stockholms yttre skärgård, en ö i taget. Inspirerat av Hostile Waters, Battlezone och Duskers.

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

- **Enheter:** SPARV (billig spanare), HÖK (drönare och ögon), VARG (svävare, slagkraft), BÄVER (ingenjör, bara på land, flygs i land av KROK) och KROK (bärgnings- och transporthelikopter).
- **Strategiska punkter:** ledningscentralen är målet. Verkstad, radarstation och fältvarv är frivilliga men ger service, spaning och en framskjuten byggplats.
- **Fiendens försvar:** fienden planerar försvaret när ön skapas. Den analyserar var man kan gå i land och vilka pass vägen till ledningscentralen måste ta, väljer doktrin (framskjutet, djup, fästning, rörligt) och fördelar en budget på spärrar, minfält, bunkrar, luftvärn, robotskyttar och reserv. Långa linjer stängs aldrig helt: det minst trafikerade passet lämnas öppet med en bunker bakom. Där en helikopter kan landsätta innanför försvaret förbi allt luftvärn stänger fästning och djupförsvar fickan med robotskyttar, medan framskjutet och rörligt försvar lämnar den. Laborera med `?budget=150&doktrin=djup` i adressen (standard 130, doktrinen väljs annars per ö).
- **Låsta sektorer och minor:** allt bakom en oröjd spärr är låst och kan inte försörjas (ingen service, ingen bärgning). Minfält på trånga vägar syns från luften och röjs av BÄVER.
- **Spanat område:** KROK flyger och bärgar bara där någon har tittat när den flyger själv. Luftvärnet ser och skjuter på KROK på 275 m, HÖK på 200 m och SPARV först inom radarns 110 m. Luftvärnet kan inte skjuta på markmål, så det slås ut från marken.
- **KROK för hand:** välj KROK och tryck E. Inga säkerhetsmarginaler, en kamera rakt nedåt i hörnet, F lyfter fordonet eller högen under dig eller sätter ned lasten.
- **Fältreparation:** BÄVER lagar markfordon upp till 75 % där de står (B på en skadad VARG, eller automatiskt när den är ledig). Båda måste stå still och vara utanför eld, och det kostar material. Bakom en oröjd spärr är det den enda reparationen.
- **Ekonomi:** bärgning. Riv med BÄVER för fullt värde, skjut sönder för mindre.
- **Styrning:** klicka och dra för order, högerklick för orderhjulet, dra med höger musknapp för att panorera sjökortet, E tar och släpper kontroll, G får gruppen att följa den du kör.
- **Ropa in:** peka i kameran eller på sjökortet och tryck B (BÄVER), H (HÖK luftstöd), V (VARG) eller K (KROK). Fungerar även när du kör en enhet. Inropningen är tillfällig: enheten återgår sedan till sitt uppdrag (eskort, följ, observera). Skift gör den till nytt uppdrag; en vanlig order ersätter uppdraget. Q byter huvudvy; två livebilder visar andra enheter.

Hela reglerna finns under "Hur man spelar" i spelet.

## Tester

Testerna kör spelets skript utan webbläsare. `mk.py` plockar ut skriptet ur `index.html` till `tests/g2.js`.

```
cd tests
python3 mk.py
node t23.js        # kartvalidering: målen nåbara, ledningscentralen försvarad, budgeten använd
node t51.js        # strategiska punkter: verkstad, radar, fältvarv, vinst
node t58.js        # låsta sektorer, minor och inropning
node t61.js        # uppdrag och tillfälliga order
node t60.js        # luftvärn efter målstorlek, KROK för hand, fältreparation, luckor och luftlandningsfickor
node t45.js base   # datorspelare som spelar hela öar (tar några minuter per ö)
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
| `t61.js` | Uppdrag och tillfälliga order: inropning återgår till uppdraget, Skift ger nytt uppdrag |
| `t60.js` | Luftvärn efter målstorlek, KROK för hand, BÄVER lagar i fält, planerarens luckor och luftlandningsfickor |

`smoke.py` laddar spelet i Chromium med Playwright, öppnar ordershjulet och fångar sidfel. Den behöver `npm install` i `tests/` (för Three.js) och Playwright för Python.

## Designdokument

Design, öppna frågor och planer finns i designdokumentet "Brohuvud: designdokument" i Claude.
