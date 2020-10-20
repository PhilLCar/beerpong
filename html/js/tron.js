var _PLAYING;
var _GRID_RES      = 20;
var _GRID_SIZE     = 32;
var _HEIGHT_FACTOR = 1.2;
var _WIDTH_FACTOR  = 8.0;
var _APERTURE      = Math.PI / 8;
var _DISTANCE;
var _SCREENSIZE;
var _SCREENWIDTH;
var _CAMERA_HEIGHT;
var _ATOBOTTOM;
var _VTERRAIN;
var _VTERRAIN_START;
var _GAME_ID;
var _COLORS = [ "", "magenta", "lime", "orangered", "yellow", "darkmagenta", "darkgreen", "darkred", "darkgoldenrod" ];
var _SPECTATE = false;
var _CELL_SIZE;
var _RIGHT = 3;
var _LEFT  = 2;
var _DOWN  = 1;
var _UP    = 0;
var _SOCKET;
var _STATUS = null;
var _ID_BYTES;
var _ME    = null;
var _CLEAR = true;

function showJoin() {
  document.getElementsByName("GameID")[0].hidden = false;
  document.getElementById("SubmitButton").hidden = false;
}

function placeVLines() {
  var vlines   = document.getElementsByClassName("vline");
  _SCREENWIDTH = window.innerWidth;
  _SCREENSIZE  = window.innerHeight;
  var n  = vlines.length;
  var vh = _HEIGHT_FACTOR * _SCREENSIZE;
  var vw = _WIDTH_FACTOR  * _SCREENWIDTH;
  for (var i = 0; i < n; i++) {
    var rotation;
    if (i < n / 2) rotation = Math.PI - Math.atan(vh / (((n - 1) / 2.0 - i) / (n - 1) * vw));
    else if (i == (n - 1) / 2.0) rotation = Math.PI / 2;
    else rotation = Math.atan(vh / ((i - (n - 1) / 2.0) / (n - 1) * vw));
    var lh = vh / Math.sin(rotation);
    vlines[i].style.width     = lh + "px";
    vlines[i].style.bottom    = vh / 2 + "px";
    vlines[i].style.left      = i * vw / (n - 1) / 2 - (vw / 2 - _SCREENWIDTH) / 2 - lh / 2 + "px";
    vlines[i].style.transform = `rotate(${rotation}rad)`;
  }
  getCameraParameters();
  move(0);
}

function getCameraParameters() {
  var theta        = (Math.PI - _APERTURE) / 2;
  _DISTANCE        = _SCREENSIZE * Math.sin(theta) / Math.sin(2 * theta);
  var gamma        = Math.PI - theta;
  var dToHorizon   = (_HEIGHT_FACTOR - 1) * _SCREENSIZE;
  var aToHorizon   = Math.PI / 2 - gamma / 2 + Math.atan((dToHorizon - _DISTANCE) / (dToHorizon + _DISTANCE) / Math.tan(gamma / 2));
  _ATOBOTTOM       = Math.PI / 2 - aToHorizon - _APERTURE;
  _CAMERA_HEIGHT   = Math.cos(_ATOBOTTOM) * _DISTANCE;
  _VTERRAIN_START  = Math.sin(_ATOBOTTOM) * _DISTANCE;
  _VTERRAIN        = Math.tan(_ATOBOTTOM + _APERTURE) * _CAMERA_HEIGHT - _VTERRAIN_START;
}

function getScreenCoordFromTerrain(terrainPosition) {
  var theta = Math.atan(terrainPosition / _CAMERA_HEIGHT) - _ATOBOTTOM;
  if (theta < 0)         return -10;
  if (theta > _APERTURE) return _SCREENSIZE + 10;
  var gamma = (Math.PI - _APERTURE) / 2;
  return _DISTANCE * Math.sin(theta) / Math.sin(gamma + theta);
}

function move(prct) {
  var hlines = document.getElementsByClassName("hline");
  var space  = _VTERRAIN / hlines.length;
  for (var i = 0; i < hlines.length; i++) {
    var height = getScreenCoordFromTerrain(_VTERRAIN_START + ((i + 1) * space - prct / 100 * space));
    hlines[i].style.bottom = height + "px";
    var max   = _HEIGHT_FACTOR * _SCREENSIZE;
    var width = (max - height) / max * _WIDTH_FACTOR * _SCREENWIDTH;
    hlines[i].style.width = width + "px";
    hlines[i].style.left  = (_SCREENWIDTH - width) / 2 + "px";
  }
  setTimeout(function(){ move((prct + 1) % 100); }, 30);
}

function playMusic() {
  _PLAYING = document.getElementById("Track1");
  _PLAYING.play();
  document.getElementById("AudioPopUp").hidden = true;
}

function togglePlaying() {
  if (_PLAYING.paused) _PLAYING.play();
  else                 _PLAYING.pause();
}


function drawGrid() {
  var gridSize = window.innerHeight / (_GRID_RES - 1);
  var nvlines  = Math.floor(window.innerWidth / gridSize) + 1;
  var lines    = document.getElementById("Lines");
  lines.innerHTML = "";
  for (var i = 0; i < _GRID_RES; i++) lines.innerHTML += '<div class="hline"></div>';
  for (var i = 0; i < nvlines; i++)   lines.innerHTML += '<div class="vline"></div>';
  var hlines = lines.getElementsByClassName("hline");
  var vlines = lines.getElementsByClassName("vline");
  for (var i = 0; i < _GRID_RES; i++) {
    hlines[i].style.width = window.innerWidth + "px";
    hlines[i].style.top   = i / (_GRID_RES - 1) * window.innerHeight - 2 + "px";
  }
  var offset = (window.innerWidth - (nvlines - 1) * gridSize) / 2;
  for (var i = 0; i < nvlines; i++) {
    vlines[i].style.width = window.innerHeight + "px";
    vlines[i].style.top   = window.innerHeight / 2 + "px";
    vlines[i].style.left  = offset + i * gridSize - window.innerHeight / 2 + "px";
    vlines[i].style.transform = "rotate(90deg)"
  }
  var fontSize = window.innerHeight / 12;
  document.getElementById("Title").style.fontSize  = fontSize + "px";
  document.getElementById("GameID").style.fontSize = fontSize + "px";
  //================================================================================
  fontSize *= 1.3;
  var boardSize = Math.min(window.innerHeight - fontSize, window.innerWidth) * 0.9;
  var board     = document.getElementById("Board");
  board.style.width  = boardSize + "px";
  board.style.height = boardSize + "px";
  board.style.left   = (window.innerWidth             - boardSize) / 2            - 1 + "px";
  board.style.top    = (window.innerHeight - fontSize - boardSize) / 2 + fontSize - 1 + "px";

  _CELL_SIZE = boardSize / _GRID_SIZE;
  for (var i = 0; i < _GRID_SIZE; i++) {
    for (var j = 0; j < _GRID_SIZE; j++) {
      var cell = document.getElementById("T" + i + "L" + j);
      cell.style.width  = _CELL_SIZE - 2 + "px";
      cell.style.height = _CELL_SIZE - 2 + "px";
      cell.style.top    = i * _CELL_SIZE + "px";
      cell.style.left   = j * _CELL_SIZE + "px";
    }
  }
  for (var head of document.getElementsByClassName("head")) {
    head.style.width  = _CELL_SIZE + "px";
    head.style.height = _CELL_SIZE + "px";
  }
}

// GAME LOGIC
////////////////////////////////////////////////////////////////////////////////////////////
var UPDATE_STANDARD = 0;
var UPDATE_FULL     = 1;
var UPDATE_ASSIGN   = 2;

function sendCommand(byte1, byte2) {
  var message = new Uint8Array(6);
  for (var i = 0; i < 4; i++) message[i] = _ID_BYTES[i];
  message[4] = byte1;
  message[5] = byte2;
  _SOCKET.send(message);
}

function update(data) {
  if (_STATUS == null) {
    _STATUS = [];
    for (var i = 1; i <= 4; i++) _STATUS.push(data[i]);
    sendCommand(0xFF, 0xFF);
  } else {
    if (data[0] == UPDATE_STANDARD) {
      var c = true;
      for (var i = 0; i < 4; i++) {
        if ((data[1 + i] &~ 0x30) > 1) { c = false; break; }
      }
      if (c) clear();
      for (var i = 0; i < 4; i++) {
        var status = data[1 + i];
        if (!(status & 1)) continue;
        var x      = data[5 + 2 * i];
        var y      = data[6 + 2 * i];
        if (status & 0x40) continue;
        if ((x == 0xFF) || (y == 0xFF)) continue;
        var cell   = data[13 + i];
        var prog   = cell & 0x20;
        var dcell  = document.getElementById("T" + y + "L" + x);
        var dhead  = document.getElementById("Head" + i);

        _STATUS[i] = status;
        _CLEAR     = false;
        
        dhead.style.left = x * _CELL_SIZE + "px";
        dhead.style.top  = y * _CELL_SIZE + "px";
        dhead.hidden     = false;
        if (status & 0x8) {
          die(dhead, dcell, (status >> 4) & 0x3, i, prog);
        } else {
          if (prog) {
            dcell.setAttribute("color", "white");
            var eyes = dhead.getElementsByClassName("eye");
            eyes[0].style.backgroundColor = "blue";
            eyes[1].style.backgroundColor = "blue";
          } else dcell.setAttribute("color", _COLORS[i + 1]);
          turnHead(dhead, (status >> 4) & 0x3);
        }
      }
    }
    if (data[0] == UPDATE_ASSIGN) {
      _ME = data[1];
      var grid = document.getElementById("Board");
      grid.style.border = "1px solid " + _COLORS[_ME + 1];
      grid.style.boxShadow = "0px 0px 5px " + _COLORS[_ME + 1];
      for (var line of document.getElementsByClassName("hline")) line.style.borderColor = _COLORS[_ME + 1];
      for (var line of document.getElementsByClassName("vline")) line.style.borderColor = _COLORS[_ME + 1];
    }
  }
}

function turnHead(head, dir) {
  var eye1 = head.getElementsByClassName("eye00")[0];
  var eye2 = head.getElementsByClassName("eye11")[0];
  switch (dir) {
    case _RIGHT:
      eye1.style.left   = "";
      eye1.style.bottom = "";
      eye2.style.left   = "";
      eye2.style.top    = "";
      eye1.style.top    = "20%";
      eye1.style.right  = "20%";
      eye2.style.bottom = "20%";
      eye2.style.right  = "20%";
      break;
    case _LEFT:
      eye1.style.right  = "";
      eye1.style.bottom = "";
      eye2.style.right  = "";
      eye2.style.top    = "";
      eye1.style.top    = "20%";
      eye1.style.left   = "20%";
      eye2.style.bottom = "20%";
      eye2.style.left   = "20%";
      break;
    case _DOWN:
      eye1.style.left   = "";
      eye1.style.top    = "";
      eye2.style.right  = "";
      eye2.style.top    = "";
      eye1.style.bottom = "20%";
      eye1.style.right  = "20%";
      eye2.style.bottom = "20%";
      eye2.style.left   = "20%";
      break;
    case _UP:
      eye1.style.left   = "";
      eye1.style.bottom = "";
      eye2.style.right  = "";
      eye2.style.bottom = "";
      eye1.style.top    = "20%";
      eye1.style.right  = "20%";
      eye2.style.top    = "20%";
      eye2.style.left   = "20%";
      break;
  }
}

function clear() {
  if (_CLEAR) return;
  for (var i = 0; i < _GRID_SIZE; i++) {
    for (var j = 0; j < _GRID_SIZE; j++) {
      document.getElementById("T" + i + "L"  + j).setAttribute("color", "");
    }
  }
  for (var i = 0; i < 4; i++) {
    var head = document.getElementById("Head" + i);
    head.hidden = true;
    var eye1 = head.getElementsByClassName("eye00")[0];
    var eye2 = head.getElementsByClassName("eye11")[0];
    var eye3 = head.getElementsByClassName("eye01")[0];
    var eye4 = head.getElementsByClassName("eye10")[0];
    var eye5 = head.getElementsByClassName("eye02")[0];
    var eye6 = head.getElementsByClassName("eye20")[0];
    eye1.hidden = false;
    eye2.hidden = false;
    eye3.hidden = true;
    eye4.hidden = true;
    eye5.hidden = true;
    eye6.hidden = true;
  }
  _CLEAR = true;
}

function changeDirection(e) {
  if (_ME != 0xFF ) {
    var mystatus = _STATUS[_ME];
    var bits     =   mystatus &= ~0x30;
    var turn     =  (bits     &   0x07) == bits;
    var done     =   bits     &   0x80;
    var reset    =   bits     &   0x40;
    if (bits == 1) { mystatus |=  0x02; turn = true; }
    switch(e.keyCode) {
      case 37: // left
        if (turn) sendCommand(_ME, mystatus | (_LEFT << 4));
        break;
      case 38: // up
        if (turn) sendCommand(_ME, mystatus | (_UP << 4));
        break;
      case 39:// right
        if (turn) sendCommand(_ME, mystatus | (_RIGHT << 4));
        break;
      case 40: // down
        if (turn) sendCommand(_ME, mystatus | (_DOWN << 4));
        break;
      case 13: // reset
        if (done && !reset) sendCommand(_ME, mystatus | (1 << 6));
        break;
      case 80: // new progam
        sendCommand(0xFF, 0x0A);
        break;
    }
  }
}

function die(head, cell, dir, id, prog) {
  var eye1 = head.getElementsByClassName("eye00")[0];
  var eye2 = head.getElementsByClassName("eye11")[0];
  var eye3 = head.getElementsByClassName("eye01")[0];
  var eye4 = head.getElementsByClassName("eye10")[0];
  var eye5 = head.getElementsByClassName("eye02")[0];
  var eye6 = head.getElementsByClassName("eye20")[0];
  eye1.hidden = true;
  eye2.hidden = true;
  eye3.hidden = false;
  eye4.hidden = false;
  eye5.hidden = false;
  eye6.hidden = false;
  switch (dir) {
    case _RIGHT:
      eye3.style = "";
      eye4.style = "";
      eye5.style = "";
      eye6.style = "";
      eye3.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye3.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      eye4.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye4.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      eye5.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye5.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      eye6.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye6.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      break;
    case _LEFT:
      eye3.style = "";
      eye4.style = "";
      eye5.style = "";
      eye6.style = "";
      eye3.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye3.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      eye4.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye4.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      eye5.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye5.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      eye6.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye6.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      break;
    case _DOWN:
      eye3.style = "";
      eye4.style = "";
      eye5.style = "";
      eye6.style = "";
      eye3.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye3.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      eye4.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye4.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      eye5.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye5.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      eye6.style.bottom = 0.3  * _CELL_SIZE - 2 + "px";
      eye6.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      break;
    case _UP:
      eye3.style = "";
      eye4.style = "";
      eye5.style = "";
      eye6.style = "";
      eye3.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye3.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      eye4.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye4.style.right  = 0.15 * _CELL_SIZE - 2 + "px";
      eye5.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye5.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      eye6.style.top    = 0.3  * _CELL_SIZE - 2 + "px";
      eye6.style.left   = 0.15 * _CELL_SIZE - 2 + "px";
      break;
  }
  if (prog) {
    cell.setAttribute("color", "blue");
  } else cell.setAttribute("color", _COLORS[id + 5]);
}

// SOCKETS
////////////////////////////////////////////////////////////////////////////
_SOCKET = null;

function wakeupServer() {
  var xhttp = new XMLHttpRequest();
  
  xhttp.timeout = 1000;
  xhttp.onreadystatechange = async function() {
    if (this.readyState == 4 && this.status == 200) {
      // good answer
      startSocketConnection();
      console.log(this.responseText);
    } else if (this.readyState == 4) {
      // wrong answer
      alert("Unknown error!");
    }
  };
  xhttp.open("GET", "wakeup.php", true);
  xhttp.send();
}

function startSocketConnection() {
  try {
      // Connexion vers un serveur HTTP
      // prennant en charge le protocole WebSocket ("ws://").
      var sockaddr = window.location.hostname;
      _SOCKET = new WebSocket("ws://" + sockaddr + ":8000");
  } catch (exception) {
      alert("Failed to connect to server...");
      window.location = "/tron.php";
  }

  // Récupération des erreurs.
  // Si la connexion ne s'établie pas,
  // l'erreur sera émise ici.
  _SOCKET.onerror = function(error) {
      // alert(error.content);
      // window.location = "/tron";
  };

  // Lorsque la connexion est établie.
  _SOCKET.onopen = function(event) {
      console.log("Connexion établie.");

      // Lorsque la connexion se termine.
      this.onclose = function(event) {
          console.log("Connexion terminée.");
          console.log(event.reason);
          window.location = "/tron";
      };

      // Lorsque le serveur envoi un message.
      this.onmessage = function(event) {
        var data = new Uint8Array(event.data);
        update(data);
      };
      
      this.binaryType = "arraybuffer";
      var enc = new TextEncoder();
      _ID_BYTES = enc.encode(_GAME_ID);
      this.send(_ID_BYTES);
  };
}