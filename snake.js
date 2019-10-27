// Peruspeli toimii.
//jshint esversion:6
const CANVAS_VARI = "black";
const SNAKE_VARI = "pink";
const ALKU_PITUUS = 5;
let dx = 10;
let dy = 0;
let ruokaX = 0;
let ruokaY = 0;
let suuntaMuuttumassa = false;
let score = 0;
let nopeus = 100;
let nopeusTalletus = 100;
let shiftPaaX = 0;
let shiftPaaY = 0;
let paaX = 5;
let paaY = 9;
let ympyraKeskipisteX = 4.5;
let ympyraKeskipisteY = 4.5;
let ympyraKulmaAlku = -Math.PI / 2;
let ympyraKulmaLoppu = Math.PI / 2;
let viivaAlkuX = 5;
let viivaAlkuY = 0;
let viivaLoppuX = 5;
let viivaLoppuY = 10;
let viimeinenOsa = {
  x: 0,
  y: 0
};
let kaynnissa = false;
let pause = false;
let bite = new Audio("sounds/bite.mp3");
let gameOver = new Audio("sounds/gameover.wav");

const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d"); // Piirretään 2D -canvas.

ctx.fillStyle = CANVAS_VARI; // Täyttöväri.
ctx.strokeStyle = CANVAS_VARI; // Reunaväri.

ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height); // Täytetään pelialue.
ctx.strokeRect(0, 0, gameCanvas.width, gameCanvas.height); // Pelialueen reunat.

// Luodaan käärme.
// Halutaan, että käärme on aluksi leveyssuunnassa välillä [0, gameCanvas.width / 2].
// Aluksi käärme on kooltaan X ruutua. Oikea reuna on jokin arvo väliltä [100 + 10X, gameCanvas.width / 2].
// Arvon tulee olla jaollinen kymmenellä.
// Sama juttu y-koordinaatille.
const ALKU_X = satunnainenKymppi(100 + ALKU_PITUUS * 10, (gameCanvas.width / 2));
const ALKU_Y = satunnainenKymppi(100 + ALKU_PITUUS * 10, (gameCanvas.height / 2));
let snake = muodostaSnake();

// Piirretään snake valmiiksi. Luodaan ruoka myös.
piirraSnake();
luoRuoka();

// Peli alkaa välilyönnillä. Pelin voi pysäyttäää välilyönnillä ja jatkaa taas.
// R:llä päivitetään sivu jotta voidaan aloittaa uudellen.
document.addEventListener("keydown", function(event) {
  if (event.key == " " && !kaynnissa) {
    kaynnissa = true;
    piirraSnake();
    piirraRuoka();
    main();
  } else if (event.key == " " && kaynnissa) {
    clearTimeout(omaTimeout);
    kaynnissa = false;
    pause = true;
    tyhjennaCanvas();
    piirraPause();
  } else if (event.key == "r" && !kaynnissa && !pause) {
    location.reload();
  }
});

// Pääohjelma. Liikutetaan matoa ajan nopeus välein.
function main() {

  // Muutetaan suuntaa näppäimen painalluksesta. Toimii vasta, kun peli on aloitettu.
  document.addEventListener("keydown", function(event) {
    muutaSuuntaa(event);
  });

  // Päivitetään näkymää ajan nopeus välein.
  omaTimeout = setTimeout(function() {

    // Tallennetaan tieto siitä, että suunta ei ole muuttumassa.
    suuntaMuuttumassa = false;

    // Tyhjennetään canvas, liikutetaan käärmettä ja piirretään ruoka.
    tyhjennaCanvas();
    liikuta();
    piirraRuoka();

    // Jos peli ei päättynyt, piirretään käärme.
    if (!peliLoppu()) {
      piirraSnake();
    }

    // Jos peli päättyy, poistetaan piiloon mennyt pää, piirretään snake
    // ja piirretään aiempi viimeinen osa. Poistutaan ohjelmasta.
    else {
      gameOver.play();
      palaa();
      piirraSnake();
      piirraSnakeOsa(viimeinenOsa);
      return;
    }

    // Jatketaan ohjelman suorittamista.
    main();
  }, nopeus);

}

// Satunnainen kymmenellä jaollinen kokonaisluku väliltä [min, max].
function satunnainenKymppi(min, max) {
  return Math.floor((Math.random() * (max - min + 1) + min) / 10) * 10;
}

// Muodostetaan snake. Alkupituus on määrätty alussa.
function muodostaSnake() {
  var snake_alku = [];
  for (var i = 0; i < ALKU_PITUUS; i++) {
    snake_alku.push({
      x: ALKU_X - i * 10,
      y: ALKU_Y
    });
  }
  return snake_alku;
}

// Piirretään yksi osa. Väritetään 10x10 ruutu vartalosta, pää on pyöreä.
function piirraSnakeOsa(snakeOsa, index) {

  // Varmistetaan värit.
  ctx.fillStyle = SNAKE_VARI;
  ctx.strokeStyle = CANVAS_VARI;

  // Piirretään pää.
  if (index == 0) {
    // Piirretään päästä "puolet" suorakulmiona.
    ctx.fillRect(snakeOsa.x + shiftPaaX, snakeOsa.y + shiftPaaY, paaX, paaY);
    // Viedään reunat pään ohi, jotta ympyräosan ja suorakulmio-osan väliin ei jää rakoa.
    //ctx.strokeRect(snakeOsa.x + shiftPaaX, snakeOsa.y + shiftPaaY, 10, 10);
    // Piirretään ympyräosa.
    ctx.beginPath();
    ctx.arc(snakeOsa.x + ympyraKeskipisteX, snakeOsa.y + ympyraKeskipisteY, 4.5, ympyraKulmaAlku, ympyraKulmaLoppu);
    ctx.fill();
  }
  // Piirretään vartalo.
  else {
    ctx.fillRect(snakeOsa.x, snakeOsa.y, 9, 9);
    //ctx.strokeRect(snakeOsa.x + 0.5, snakeOsa.y + 0.5, 10, 10);
  }
}

// Piirretään koko snake.
function piirraSnake() {
  snake.forEach(piirraSnakeOsa);
}

// Liikutetaan.
function liikuta() {

  // Jos pää osuu ruokaan, soiRuokaa = true.
  const soiRuokaa = snake[0].x === ruokaX && snake[0].y === ruokaY;

  // Pää liikkuu x- ja y-suunnassa minne kulkusuunta määrää.
  const paa = {
    x: snake[0].x + dx,
    y: snake[0].y + dy
  };

  // Lisätään uusi pää alkuun.
  snake.unshift(paa);

  // Jos söi ruokaa, luodaan uusi, muuten poistetaan viimeinen käärmeen osa.
  if (soiRuokaa) {
    bite.play();
    score++;
    if (score % 5 == 0) {
      nopeus -= 10;
    }
    $("#score").text(score);
    $("#nopeus").text(150 - nopeus);
    luoRuoka();
  } else {
    viimeinenOsa = {
      x: snake[snake.length - 1].x,
      y: snake[snake.length - 1].y
    };
    snake.pop();
  }

}

// Jos peli päättyy, pysäytetään käärme.
function palaa() {
  // Poistetaan piiloon mennyt pää.
  snake.shift();
}

// Vaihdetaan snaken kulkusuunta.
function muutaSuuntaa(event) {

  if (suuntaMuuttumassa) {
    return;
  }
  suuntaMuuttumassa = true;

  // Muutetaan aina tietoa, mihin suuntaan snake kulkee.
  const menossaYlos = dy === -10;
  const menossaAlas = dy === 10;
  const menossaVasen = dx === -10;
  const menossaOikea = dx === 10;

  // Hetaan painettu näppäin.
  const nappain = event.key;

  // Vaihdetaan kulkusuunta näppäimen mukaan. Kulkusuuntaa ei voi vaihtaa
  // päinvastaiseksi kuin nykyinen.
  if ((nappain === "ArrowUp" || nappain === "w") && !menossaAlas) {
    dx = 0;
    dy = -10;
    shiftPaaX = 0;
    shiftPaaY = 4;
    paaX = 9;
    paaY = 5;
    ympyraKulmaAlku = Math.PI;
    ympyraKulmaLoppu = 0;
  }
  if ((nappain === "ArrowDown" || nappain === "s") && !menossaYlos) {
    dx = 0;
    dy = 10;
    shiftPaaX = 0;
    shiftPaaY = 0;
    paaX = 9;
    paaY = 5;
    ympyraKulmaAlku = 0;
    ympyraKulmaLoppu = -Math.PI;
  }
  if ((nappain === "ArrowLeft" || nappain === "a") && !menossaOikea) {
    dx = -10;
    dy = 0;
    shiftPaaX = 4;
    shiftPaaY = 0;
    paaX = 5;
    paaY = 9;
    ympyraKulmaAlku = Math.PI / 2;
    ympyraKulmaLoppu = 3 * Math.PI / 2;
  }
  if ((nappain === "ArrowRight" || nappain === "d") && !menossaVasen) {
    dx = 10;
    dy = 0;
    shiftPaaX = 0;
    shiftPaaY = 0;
    paaX = 5;
    paaY = 9;
    ympyraKulmaAlku = -Math.PI / 2;
    ympyraKulmaLoppu = Math.PI / 2;
  }

}

// Jos snake osuu seinään tai itseensä, peli päättyy.
function peliLoppu() {

  // Pää osuu seinään.
  const osumaVasen = snake[0].x < 0;
  const osumaOikea = snake[0].x > gameCanvas.width - 10;
  const osumaYla = snake[0].y < 0;
  const osumaAla = snake[0].y > gameCanvas.height - 10;

  // Pää osuu vartaloon. Alkaa nelosesta, jotta täyskäännöksen yrittäminen
  // ei tapa snakea.
  for (var i = 4; i < snake.length; i++) {
    const osumaOma = (snake[0].x === snake[i].x && snake[0].y === snake[i].y);
    if (osumaOma) {
      kaynnissa = false;
      pause = false;
      return true;
    }
  }

  if (osumaVasen || osumaOikea || osumaYla || osumaAla) {
    kaynnissa = false;
    pause = false;
    return true;
  }

  return false;

}

// Luodaan ruoka. Jos ruoka on snaken alla, luodaan se uudelleen.
function luoRuoka() {
  ruokaX = satunnainenKymppi(0, gameCanvas.width - 10);
  ruokaY = satunnainenKymppi(0, gameCanvas.height - 10);
  snake.forEach(function(snakeOsa) {
    if (ruokaX == snakeOsa.x && ruokaY == snakeOsa.y) {
      luoRuoka();
    }
  });
}

// Piirretään ruoka.
function piirraRuoka() {
  ctx.fillStyle = "white";
  // ctx.strokeStyle = CANVAS_VARI;
  // ctx.fillRect(ruokaX, ruokaY, 10, 10);
  // ctx.strokeRect(ruokaX, ruokaY, 10, 10);
  ctx.beginPath();
  ctx.arc(ruokaX + ympyraKeskipisteX, ruokaY + ympyraKeskipisteY, 4.5, 0, 2 * Math.PI);
  ctx.fill();
}

// Tyhjennetään ruutu, jotta voidaan piirtää uusi snake.
function tyhjennaCanvas() {
  ctx.fillStyle = CANVAS_VARI; // Täyttöväri.
  ctx.strokeStyle = CANVAS_VARI; // Reunaväri.
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height); // Täytetään pelialue.
  ctx.strokeRect(0, 0, gameCanvas.width, gameCanvas.height); // Pelialueen reunat.
}

function piirraPause() {
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.textBaseline = "bottom";
  ctx.fillText("\u258c\u258c", 15, gameCanvas.height - 15);
}
