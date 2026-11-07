// A scenario on the island and date the captain chose (issue 129, Magnus 5 nov: Strömmen was always 15 november on ö 3100 whatever Ny ö said):
// when.isle and the date are his, the hour the scenario's unless he chose one; scenFit tells whether an island holds the scenario's places,
// and gives the world in play back untouched; the start keeps the island, so Spela igen plays the same one.
global.performance={now:()=>0};
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
require('./g2.js');const B=globalThis.__BH,S=B.SCEN.stroemmen,F=B.SCEN.farjelaget;
B.newGame(3100,'auto',{uppdrag:'scen'});let G=B.G;
ok(G.seed===3100&&G.doy===S.when.doy&&Math.abs(G.tod-S.when.tod)<1e-6&&!!G.scen,'with nothing chosen Strömmen is its own island, date and hour ('+G.seed+', '+G.doy+', '+G.tod+')');
B.newGame(5555,'auto',{uppdrag:'scen',isle:5555,doy:200});G=B.G;
ok(G.seed===5555&&G.doy===200&&Math.abs(G.tod-S.when.tod)<1e-6,'a chosen island and date are taken, the hour stays the scenario\'s ('+G.seed+', '+G.doy+', '+G.tod+')');
ok(!!G.scen&&G.mission==='scen'&&G.relays.some(r=>r.type==='kraft'),'and the scenario is set up there, with its power station');
ok(G.start.isle===5555,'the start keeps the island for Spela igen ('+G.start.isle+')');
B.newGame(G.seed,G.doc,G.start);G=B.G;ok(G.seed===5555&&G.doy===200&&!!G.scen,'Spela igen plays the same island and date');
B.newGame(5555,'auto',{uppdrag:'scen',isle:5555,tod:9.5});ok(Math.abs(B.G.tod-9.5)<1e-6,'a chosen hour is taken ('+B.G.tod+')');
{const W0=B.W,f1=B.scenFit(S,5555),f2=B.scenFit(S,7341),f3=B.scenFit(F,8080),f4=B.scenFit(F,5555);
  ok(B.W===W0,'scenFit gives the world in play back');
  ok(f1.ok&&!f2.ok&&/kraftverk/.test(f2.why),'Strömmen fits on 5555 and not on 7341 ('+f2.why+')');
  ok(f3.ok&&!f4.ok&&/färjeläge/.test(f4.why),'Färjeläget fits on 8080 and not on 5555 ('+f4.why+')');}
B.newGame(8080,'auto',{uppdrag:'scenfarjelaget',isle:8080});G=B.G;ok(G.seed===8080&&!!G.scen&&G.scen.id==='farjelaget','Färjeläget is set up on 8080');
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
