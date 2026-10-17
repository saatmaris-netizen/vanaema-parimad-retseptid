// ===== MUUDETAVAD NUMBRILISED PARAMEETRID =====
const LOUENDI_LAIUS = 1000;
const LOUENDI_KORGUS = 800;
const KAARDI_LAIUS = 650;
const KAARDI_KORGUS = 430;
const KARBI_LAIUS = 840;
const KARBI_KORGUS = 210;
const AVANEMISE_KIIRUS = 0.035;
const KUPSISE_RAADIUS = 26;
const PURU_KOGUS = 140;
const PURU_KIIRUS = 8;
const PURU_GRAVITATSIOON = 0.09;

// Kleebi kogu kood p5.js veebiredaktori sketch.js faili.
// Klõpsa küpsisel: retsept tuleb karbist välja.
// Klõpsa samal küpsisel uuesti: retsept läheb karpi tagasi.
// Kõik küpsisepildid joonistatakse koodiga.

const recipeIds = ['retsept','mustad-kupsised','sinised-kupsised','maapahklivoikupsised','maasikakupsised','sokolaadikupsised'];
const colors = ['#DEA17D','#51403B','#48A7BF','#C69977','#CC939A','#865D49'];
const retseptid = recipeIds.map((id,i)=>{const el=document.getElementById(id);return {nimi:el.querySelector('h2').innerHTML.replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim(),kirjeldus:'Sinu küpsisekogu · ava täielik retsept',info:el.querySelector('.note').textContent,toon:colors[i],liik:i,koostis:Array.from(el.querySelectorAll('ul li')).slice(0,7).map(x=>x.firstChild.textContent.trim()),sammud:['Vali küpsis, et avada täielik retsept.','Koostisosad ja kõik sammud leiad retseptiaknast.']};});
let giftOpened=false;
let lidProgress=0;
let recipeTimer;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let kaardid = [];
let puru = [];
let valitud = -1;
let skaala = 1;
let niheX = 0;
let niheY = 0;

let cookiePhotos=[];
function preload(){for(let i=0;i<6;i++)cookiePhotos[i]=loadImage('pildid/kupsis'+(i+1)+'.jpg',()=>{},()=>{cookiePhotos[i]=null;});}
function setup() {
  const host = document.getElementById('cookie-stage');
  const canvas = createCanvas(host.clientWidth, host.clientWidth * .8);
  canvas.parent(host); canvas.attribute('aria-hidden','true');
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  textFont("Georgia");

  kaardid = retseptid.map(() => ({
    avatus: 0,
    siht: 0
  }));
}

function draw() {
  clear();

  skaala = min(width / LOUENDI_LAIUS, height / LOUENDI_KORGUS);
  niheX = (width - LOUENDI_LAIUS * skaala) / 2;
  niheY = (height - LOUENDI_KORGUS * skaala) / 2;

  const dt = min(deltaTime / 16.667, 3);
  const samm = 1 - pow(1 - AVANEMISE_KIIRUS, dt);

  for (const kaart of kaardid) {
    kaart.avatus = reducedMotion ? kaart.siht : lerp(kaart.avatus, kaart.siht, samm);

    if (abs(kaart.avatus - kaart.siht) < 0.001) {
      kaart.avatus = kaart.siht;
    }
  }

  push();
  translate(niheX, niheY);
  scale(skaala);

  joonistaTaust();
  joonistaPealkiri();
  joonistaKarbiTagakulg();

  // Kaardid on nähtavad ainult karbi ülaserva kohal.
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, 0, LOUENDI_LAIUS, 523);
  drawingContext.clip();
  for (let i = 0; i < kaardid.length; i++) {
    if (i !== valitud) joonistaKaart(i);
  }

  if (valitud >= 0) joonistaKaart(valitud);

  drawingContext.restore();
  joonistaKarbiEsikulg();
  joonistaPuru(dt);
  if(giftOpened) lidProgress=min(1,lidProgress+dt/80);
  if(lidProgress<1) joonistaKingitus(lidProgress);

  noStroke();
  fill("#8C7562");
  textFont("Georgia");
  textAlign(CENTER, CENTER);
  textSize(16);
  text(
    giftOpened ? "Klõpsa küpsisel, et retsept välja võtta või tagasi panna." : "Vajuta lehvile ja ava vanaema kingitus.",
    500,
    755
  );

  pop();

  const hiir = hiireAsukoht();
  cursor((!giftOpened ? hiir.x>400 && hiir.x<600 && hiir.y>410 && hiir.y<570 : leiaKupsis(hiir.x, hiir.y)>=0) ? "pointer" : "default");
}

function joonistaTaust() {


  noStroke();
  fill(98, 65, 40, 18);
  ellipse(500, 731, 885, 32);

  // Dekoratiivsed purukesed laual.
  for (let i = 0; i < 26; i++) {
    const x = (i * 173 + 51) % LOUENDI_LAIUS;
    const y = 180 + ((i * 89) % 510);

    if (x < 105 || x > 895) {
      fill("#CDB28B");
      circle(x, y, 2 + i % 3);
    }
  }
}

function joonistaPealkiri() {
  noStroke();
  textFont("Georgia");
  textAlign(CENTER, CENTER);

  fill("#5B4031");
  textSize(40);
  text("Vanaema parimad retseptid", 500, 53);

  fill("#97775F");
  textSize(15);
  text("KUUS RETSEPTI JA PEOTÄIS KODUSOOJUST", 500, 96);
}

function joonistaKarbiTagakulg() {
  const x = (LOUENDI_LAIUS - KARBI_LAIUS) / 2;

  noStroke();
  fill("#AF724D");
  rect(x - 7, 495, KARBI_LAIUS + 14, 205, 15);

  fill("#805238");
  rect(x + 12, 509, KARBI_LAIUS - 24, 165, 10);

  fill("#593C2C");
  rect(x + 25, 518, KARBI_LAIUS - 50, 130, 8);
}

function kaardiAsend(i) {
  const a = kaardid[i].avatus;
  const sujuv = a * a * (3 - 2 * a);

  return {
    x: (LOUENDI_LAIUS - KAARDI_LAIUS) / 2,
    y: lerp(452, 143, sujuv),
    nurk: sin(a * PI) * (i % 2 === 0 ? -0.025 : 0.025)
  };
}

function sakiX(i) {
  return 53 + i * ((KAARDI_LAIUS - 106) / (retseptid.length - 1));
}

function joonistaKaart(i) {
  const r = retseptid[i];
  const p = kaardiAsend(i);

  push();
  translate(p.x + KAARDI_LAIUS / 2, p.y + KAARDI_KORGUS / 2);
  rotate(p.nurk);
  translate(-KAARDI_LAIUS / 2, -KAARDI_KORGUS / 2);

  noStroke();
  fill(70, 40, 20, 25);
  rect(6, 8, KAARDI_LAIUS, KAARDI_KORGUS, 12);

  fill("#FFF9ED");
  rect(0, 0, KAARDI_LAIUS, KAARDI_KORGUS, 12);

  fill(r.toon);
  rect(0, 0, KAARDI_LAIUS, 9, 12, 12, 0, 0);

  // Viis küpsisesakki jäävad suletud karbi kohal nähtavale.
  const sx = sakiX(i);
  fill(r.toon);
  rect(sx - 40, -43, 80, 50, 17, 17, 0, 0);
  if(cookiePhotos[i]){push();drawingContext.save();drawingContext.beginPath();drawingContext.arc(sx,-17,KUPSISE_RAADIUS,0,Math.PI*2);drawingContext.clip();image(cookiePhotos[i],sx-KUPSISE_RAADIUS,-17-KUPSISE_RAADIUS,KUPSISE_RAADIUS*2,KUPSISE_RAADIUS*2);drawingContext.restore();pop();}else joonistaKupsis(sx, -17, KUPSISE_RAADIUS, r.liik);

  textFont("Georgia");
  textAlign(LEFT, TOP);
  fill("#604332");
  textSize(23);
  textSize(i === 5 ? 19 : 23);
  text(r.nimi, 32, 18, KAARDI_LAIUS - 64, 65);

  fill("#A07E65");
  textSize(15);
  text(r.kirjeldus, 33, 88);

  textFont("Arial");
  fill("#806B58");
  textSize(13);
  text('Täielik retsept avaneb eraldi aknas', 33, 110);

  stroke("#E5D7C2");
  strokeWeight(1);
  line(32, 129, KAARDI_LAIUS - 32, 129);
  line(274, 151, 274, 363);

  noStroke();
  fill("#956443");
  textStyle(BOLD);
  textSize(12);
  text("KOOSTISOSAD", 33, 150);
  text("VALMISTAMINE", 295, 150);
  textStyle(NORMAL);

  fill("#5D4D3E");
  textSize(14);

  for (let n = 0; n < r.koostis.length; n++) {
    text("•  " + r.koostis[n], 33, 181 + n * 25, 225, 24);
  }

  for (let n = 0; n < r.sammud.length; n++) {
    const y = 190 + n * 38;

    fill(r.toon);
    circle(303, y, 20);

    fill("#5D4433");
    textAlign(CENTER, CENTER);
    textSize(11);
    text(n + 1, 303, y);

    fill("#5D4D3E");
    textAlign(LEFT, TOP);
    textSize(13);
    text(r.sammud[n], 322, y - 10, 295, 36);
  }

  if(cookiePhotos[i]){fill('#FFF9ED');rect(285,170,330,215);const img=cookiePhotos[i];const ratio=min(310/img.width,210/img.height);image(img,295+(310-img.width*ratio)/2,173,img.width*ratio,img.height*ratio);}
  textFont("Georgia");
  fill("#A18A73");
  textSize(13);
  textAlign(LEFT, CENTER);
  text("Küpsetatud armastusega", 33, 400);

  textAlign(RIGHT, CENTER);
  text("RETSEPT " + (i + 1) + " / 6", KAARDI_LAIUS - 32, 400);

  pop();
}

function joonistaKarbiEsikulg() {
  const x = (LOUENDI_LAIUS - KARBI_LAIUS) / 2;
  const y = 523;

  noStroke();
  fill("#C58B5E");
  rect(x, y, KARBI_LAIUS, KARBI_KORGUS, 8, 8, 18, 18);

  // Puidusüü.
  stroke("#B67C51");
  strokeWeight(1);

  for (let i = 0; i < 6; i++) {
    const sy = y + 35 + i * 25;
    line(x + 15, sy, x + KARBI_LAIUS - 15, sy + sin(i) * 4);
  }

  noStroke();
  fill("#DCAD7C");
  rect(x, y, KARBI_LAIUS, 14, 6);

  fill(80, 45, 25, 25);
  rect(360, 561, 285, 104, 10);

  fill("#FFF2DA");
  rect(356, 556, 285, 104, 8);

  noFill();
  stroke("#C7A77C");
  rect(365, 565, 267, 86, 4);

  noStroke();
  textFont("Georgia");
  textAlign(CENTER, CENTER);

  fill("#6A4932");
  textSize(18);
  text("VANAEMA PARIMAD RETSEPTID", 499, 593);

  fill("#A07C58");
  textSize(14);
  text("küpseta · jaga · naudi", 499, 626);

  fill("#97613E");

  for (const nx of [x + 23, x + KARBI_LAIUS - 23]) {
    circle(nx, y + 33, 5);
    circle(nx, y + KARBI_KORGUS - 23, 5);
  }
}

function joonistaKupsis(x, y, raadius, liik) {
  push();
  translate(x, y);
  noStroke();

  fill(65, 38, 20, 45);
  ellipse(2, 4, raadius * 2.12, raadius * 1.98);

  fill("#B77A41");
  beginShape();

  for (let i = 0; i < 40; i++) {
    const nurk = TWO_PI * i / 40;
    const r = raadius * (1 + 0.035 * sin(i * 2.7 + liik));
    vertex(cos(nurk) * r, sin(nurk) * r);
  }

  endShape(CLOSE);

  fill(["#DDB173","#42332F","#38A7CD","#C69977","#E3A6AF","#795044"][liik]);
  ellipse(-1, -2, raadius * 1.83, raadius * 1.77);

  // Kohtade arvutus on püsiv: küpsis ei värele kaadrite vahel.
  for (let i = 0; i < 19; i++) {
    const nurk = i * 2.399 + liik;
    const kaugus = sqrt((i + 0.5) / 19) * raadius * 0.76;
    const px = cos(nurk) * kaugus;
    const py = sin(nurk) * kaugus;

    if (liik === 0) {
      fill("#563626");
      ellipse(px, py, 5 + i % 3, 4 + i % 3);
    } else if (liik === 1) {
      push();
      translate(px, py);
      rotate(nurk);
      fill(i % 2 === 0 ? "#F0D5A3" : "#BE8A4F");
      ellipse(0, 0, 7, 2.5);
      pop();
    } else {
      fill("#BD8F52");
      circle(px, py, 1.8);
    }
  }

  if (liik === 2) {
    stroke("#FFF0BF");
    strokeWeight(2);

    for (let i = 0; i < 5; i++) {
      line(-12 + i * 6, -12, -18 + i * 6, 11);
    }
  }

  if (liik === 3) {
    stroke("#AA7644");
    strokeWeight(1.8);

    for (let i = -1; i <= 1; i++) {
      line(-16, i * 7, 16, i * 7);
      line(i * 7, -16, i * 7, 16);
    }
  }

  if (liik === 4) {
    noStroke();
    fill("#A03D4A");
    circle(0, -1, raadius * 0.9);
    fill("#C65866");
    ellipse(-2, -4, raadius * 0.5, raadius * 0.33);
    fill("#F2B5A9");
    ellipse(-4, -6, 5, 3);
  }

  pop();
}

// Arvestab ka kaardi pöördenurka, et klõps tabaks liikuvat küpsist.
function kupsiseAsukoht(i) {
  const p = kaardiAsend(i);
  const dx = sakiX(i) - KAARDI_LAIUS / 2;
  const dy = -17 - KAARDI_KORGUS / 2;

  return {
    x: p.x + KAARDI_LAIUS / 2 +
      dx * cos(p.nurk) - dy * sin(p.nurk),
    y: p.y + KAARDI_KORGUS / 2 +
      dx * sin(p.nurk) + dy * cos(p.nurk)
  };
}

function leiaKupsis(x, y) {
  const jarjekord = [];

  if (valitud >= 0) jarjekord.push(valitud);

  for (let i = kaardid.length - 1; i >= 0; i--) {
    if (i !== valitud) jarjekord.push(i);
  }

  for (const i of jarjekord) {
    const p = kupsiseAsukoht(i);

    if (
      y < 523 &&
      dist(x, y, p.x, p.y) <= KUPSISE_RAADIUS + 8
    ) {
      return i;
    }
  }

  return -1;
}

function hiireAsukoht() {
  return {
    x: (mouseX - niheX) / skaala,
    y: (mouseY - niheY) / skaala
  };
}

function klops(x, y) {
  if(!giftOpened){if(x>400&&x<600&&y>410&&y<570) window.openGift();return false;}
  if(lidProgress<1)return false;
  const i = leiaKupsis(x, y);
  if (i < 0) return false;

  const p = kupsiseAsukoht(i);
  const oliAvatud = kaardid[i].siht === 1;

  for (const kaart of kaardid) {
    kaart.siht = 0;
  }

  if (!oliAvatud) {
    kaardid[i].siht = 1;
    valitud = i;
  }

  clearTimeout(recipeTimer);
  if (!reducedMotion) looPuru(p.x, p.y, retseptid[i].liik);
  if (!oliAvatud) recipeTimer = setTimeout(() => window.openCookieRecipe(recipeIds[i]), reducedMotion ? 0 : 1800);
  return true;
}

function mousePressed() {
  // Puute puhul käsitleb vajutust touchStarted().
  if (touches.length > 0) return;

  const p = hiireAsukoht();
  klops(p.x, p.y);
}

function touchStarted() {
  if (touches.length > 0) {
    const puudutus = touches[0];

    klops(
      (puudutus.x - niheX) / skaala,
      (puudutus.y - niheY) / skaala
    );
  }

  if (touches.length && leiaKupsis((touches[0].x-niheX)/skaala,(touches[0].y-niheY)/skaala)>=0) return false;
}

function looPuru(x, y, liik) {
  for (let i = 0; i < PURU_KOGUS; i++) {
    const nurk = random(TWO_PI);
    const kiirus = random(0.6, PURU_KIIRUS);

    puru.push({
      x: x,
      y: y,
      vx: cos(nurk) * kiirus,
      vy: sin(nurk) * kiirus - 2,
      suurus: random(2, 6),
      nurk: random(TWO_PI),
      poorlemine: random(-0.16, 0.16),
      elu: random(90, 150),
      tume: liik === 0 && random() < 0.35
    });
  }

  if (puru.length > 600) {
    puru.splice(0, puru.length - 600);
  }
}

function joonistaPuru(dt) {
  for (let i = puru.length - 1; i >= 0; i--) {
    const p = puru[i];

    p.vy += PURU_GRAVITATSIOON * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.nurk += p.poorlemine * dt;
    p.elu -= dt;

    push();
    translate(p.x, p.y);
    rotate(p.nurk);
    noStroke();

    const alfa = constrain(p.elu / 30, 0, 1) * 255;

    if (p.tume) {
      fill(85, 53, 35, alfa);
    } else {
      fill(192, 138, 76, alfa);
    }

    rectMode(CENTER);
    rect(0, 0, p.suurus, p.suurus * 0.7, 1);
    pop();

    if (p.elu <= 0 || p.y > LOUENDI_KORGUS + 20) {
      puru.splice(i, 1);
    }
  }
}

function windowResized() {
  const host=document.getElementById('cookie-stage');
  resizeCanvas(host.clientWidth,host.clientWidth*.8);
}
document.addEventListener('visibilitychange',()=>{if(window.noLoop) document.hidden ? noLoop() : loop();});

window.closeCookieCard=()=>{clearTimeout(recipeTimer);kaardid.forEach(k=>k.siht=0);};

window.selectCookieRecipe=(id)=>{const i=recipeIds.indexOf(id);if(i<0)return;const p=kupsiseAsukoht(i);klops(p.x,p.y);};




function joonistaKingitus(progress){
  const ease=progress*progress;
  push();
  drawingContext.globalAlpha=1-progress;
  translate(500+ease*650,560-ease*850);
  rotate(ease*.85);
  noStroke();
  fill('#A76C49');rect(-434,-155,868,335,18);
  fill('#C58B5E');rect(-428,-150,856,322,16);
  fill('#DCAA79');rect(-435,-160,870,32,9);
  fill('#9E3E32');rect(-29,-160,58,332);rect(-428,-93,856,45);
  fill('#7C2B27');rect(-29,-93,58,45);
  // Creme kaartje op het geschenk.
  fill('#FFF2DA');rect(-165,0,330,105,8);
  noFill();stroke('#C7A77C');strokeWeight(1);rect(-156,9,312,87,4);
  noStroke();fill('#6A4932');textFont('Georgia');textAlign(CENTER,CENTER);textSize(23);
  text('Vanaema parimad',0,35);text('retseptid',0,66);
  // Satiinpaela varjud, kumerad aasad ja murduvad paelaotsad.
  const ctx=drawingContext;
  ctx.save();ctx.translate(0,-70);
  ctx.shadowColor='rgba(55,12,10,.35)';ctx.shadowBlur=12;ctx.shadowOffsetY=7;
  function ribbonPath(points,colors){const grad=ctx.createLinearGradient(-80,-45,65,75);colors.forEach(([stop,color])=>grad.addColorStop(stop,color));ctx.fillStyle=grad;ctx.beginPath();points(ctx);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(98,27,25,.5)';ctx.lineWidth=1;ctx.stroke();}
  const satin=[[0,'#70251f'],[.25,'#bb5146'],[.43,'#ee9986'],[.55,'#c96857'],[.77,'#8c302a'],[1,'#62201d']];
  ribbonPath(c=>{c.moveTo(-8,6);c.bezierCurveTo(-28,17,-27,58,-64,91);c.lineTo(-39,85);c.lineTo(-28,103);c.bezierCurveTo(-4,74,-16,39,7,11);},satin);
  ribbonPath(c=>{c.moveTo(7,7);c.bezierCurveTo(25,25,24,65,64,79);c.lineTo(43,83);c.lineTo(42,105);c.bezierCurveTo(3,86,7,40,-8,12);},satin);
  ribbonPath(c=>{c.moveTo(-5,2);c.bezierCurveTo(-37,-48,-91,-52,-101,-16);c.bezierCurveTo(-115,25,-62,43,-7,11);c.bezierCurveTo(-25,11,-59,11,-78,-7);c.bezierCurveTo(-55,-10,-29,0,-5,2);},satin);
  ribbonPath(c=>{c.moveTo(5,2);c.bezierCurveTo(37,-49,92,-50,103,-15);c.bezierCurveTo(116,27,60,42,7,11);c.bezierCurveTo(28,11,60,10,80,-8);c.bezierCurveTo(55,-11,30,-1,5,2);},satin);
  ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,205,184,.55)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-88,-20);ctx.bezierCurveTo(-70,-37,-35,-23,-14,-3);ctx.moveTo(88,-20);ctx.bezierCurveTo(70,-36,37,-25,14,-3);ctx.moveTo(-21,28);ctx.bezierCurveTo(-25,50,-35,68,-47,80);ctx.moveTo(22,32);ctx.bezierCurveTo(29,53,34,66,48,74);ctx.stroke();
  ribbonPath(c=>{c.moveTo(-14,-14);c.bezierCurveTo(-4,-21,12,-17,17,-10);c.bezierCurveTo(11,0,11,13,16,20);c.bezierCurveTo(3,24,-9,21,-16,14);c.bezierCurveTo(-11,4,-10,-5,-14,-14);},[[0,'#762720'],[.4,'#d77b68'],[.5,'#f4af94'],[.64,'#b95345'],[1,'#71261f']]);
  ctx.restore();
  pop();
}
window.openGift=()=>{
  if(giftOpened)return;
  giftOpened=true;
  if(reducedMotion)lidProgress=1;
  else looPuru(500,485,0);
  document.getElementById('gift-bow').hidden=true;
  document.getElementById('hint').textContent='Kingitus on avatud! Vali küpsis ja leia vanaema retsept.';
};


