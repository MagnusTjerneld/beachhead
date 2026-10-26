// Measures the sound bench headless: three seconds of HÖK, GETING and a wing, old and new, and GÄDDA in both variants, A-weighted level relative to the old HÖK
// and the share of the energy below 1 kHz, between 1 and 4 kHz and above 4 kHz (node proto/ljud.js, a few seconds)
const path=require('path'),fs=require('fs'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
execSync('python3 '+path.join(__dirname,'mkljud.py'));
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined});const p=await b.newPage();
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'ljud.html')).href);
  console.table(await p.evaluate(()=>window.__measure()));await b.close();})();
