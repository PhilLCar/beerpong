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
var _HOST;
var _MYTRON;
var _COLORS = [ "", "magenta", "lime", "orangered", "yellow", "darkred" ];
var _SPECTATE = false;
var _CELL_SIZE;
var _RIGHT = 0;
var _LEFT  = 1;
var _DOWN  = 2;
var _UP    = 3;
var _NEXT = [];
var _DEAD = false;
var _CLOCK_STARTED = false;

function sendCommand(command, args, callback) {
  var xhttp = new XMLHttpRequest();
  var post = "GameID=" + _GAME_ID + "&Command=" + command;

  if (args) {
    for (arg in args) {
      post += `&${arg}=${args[arg]}`;
    }
  }
  
  xhttp.timeout = 8000;
  xhttp.onreadystatechange = async function() {
    if (this.readyState == 4 && this.status == 200) {
      // good answer
      callback(this.responseText);
    } else if (this.readyState == 4) {
      // wrong answer
      alert("Unknown error " + this.responseText + "!");
    }
  };
  xhttp.open("POST", "database.php", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(post);
}

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
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function update(info) {
  if (info) {
    var data = info.split(';');
    if (data.length == 1) { // ready update
      var ready = data[0];
      var i;
      var allReady = true;
      for (i = 0; i < 4; i++) {
        if (ready & 0xFF && !(ready & 0x2)) {
          allReady = false;
          break;
        }
      }
      if (allReady && i > 0 && !_CLOCK_STARTED) { // temporary should be > 1
        clock(0);
      }
    } else {
      var ready = data[_GRID_SIZE * 4];
      var n, k;
      for (var i = 0; i < 4; i++) {
        if (ready & 0xFF && !(ready & 0x4)) {
          k = i;
          n++;
          break;
        }
      }
      //if (n <= 1) { endGame(k); return; }
      var initial_update = data.length > _GRID_SIZE * 4 + 1;
      for (var i = 0; i < _GRID_SIZE; i++) {
        for (var j = 0; j < _GRID_SIZE; j++) {
          var cellValue = (data[4 * i + Math.floor(j / 8)] >> ((j % 8) * 4)) & 0xF;
          var cell      = document.getElementById("T" + i + "L" + j);
          var head  = cellValue & 8;
          var color = cellValue & 7;
          if (head) {
            var dir  = ready >> ((color - 1) * 8 + 4) & 0xF;
            var head = document.getElementById("Head" + (color - 1));
            if (initial_update) {
              head.hidden = false;
              head.style.top    = _CELL_SIZE * i + "px";
              head.style.left   = _CELL_SIZE * j + "px";
            } else {
              _NEXT.push({
                id:   color - 1,
                head: head,
                dir:  dir,
                i:    i,
                j:    j,
                die: false
              });
            }
            turnHead(head, dir);
          }
          cell.setAttribute("color", _COLORS[color]);
        }
      }
      if (!initial_update) eat();
    }
    if (initial_update) {
      _MYTRON = data[_GRID_SIZE * 4 + 1];
    }
  }
  sendCommand("UPDATE", _HOST ? { Host: true } : null, update);
}

async function clock(stop) {
  if (stop != 1) {
    _CLOCK_STARTED = true;
    await sleep(100);
    sendCommand("CLOCK", null, clock);
  } else {
    _CLOCK_STARTED = false;
  }
}

function changeDirection(e) {
  if (_MYTRON != "S" && !_DEAD) {
    var head = document.getElementById("Head" + _MYTRON);
    switch(e.keyCode) {
      case 37: // left
        turnHead(head, _LEFT);
        sendCommand("TURN", { MyTron: _MYTRON, Dir: _LEFT}, function(){})
        break;
      case 38: // up
        turnHead(head, _UP);
        sendCommand("TURN", { MyTron: _MYTRON, Dir: _UP}, function(){})
        break;
      case 39:// right
        turnHead(head, _RIGHT);
        sendCommand("TURN", { MyTron: _MYTRON, Dir: _RIGHT}, function(){})
        break;
      case 40: // down
        turnHead(head, _DOWN);
        sendCommand("TURN", { MyTron: _MYTRON, Dir: _DOWN}, function(){})
        break;
    }
  }
}

function eat() {
  if (!_NEXT.length) return;
  if (_HOST) sendCommand("RESET_HEADS", null, eat2);
}

function eat2(nothing) {
  for (var next1 of _NEXT) {
    for (var next2 of _NEXT) {
      if (next1 == next2) continue;
      if (next1.i == next2.i && next1.j == next2.j) {
        die(next1);
        die(next2);
        if (_HOST) {
          sendCommand("DIE", { ID: next1.id, Y: next1.i, X: next1.j }, function(){});
          sendCommand("DIE", { ID: next1.id, Y: next2.i, X: next2.j }, function(){});
        }
      }
    }
  }
  for (var next of _NEXT) {
    if (next.die) continue;
    switch (next.dir) {
      case _LEFT:  next.j--; break;
      case _RIGHT: next.j++; break;
      case _UP:    next.i--; break;
      case _DOWN:  next.i++; break;
    }
    if (next.i < 0 || next.i >= _GRID_SIZE || next.j < 0 || next.j >= _GRID_SIZE) {
      if (next.i < 0) next.i++;
      if (next.i >= _GRID_SIZE) next.i--;
      if (next.j < 0) next.j++;
      if (next.j >= _GRID_SIZE) next.j--;
      die(next);
      if (_HOST) {
        sendCommand("DIE", { ID: next.id, Y: next.i, X: next.j }, function(){});
      }
    } else {
      next.head.style.top    = _CELL_SIZE * next.i + "px";
      next.head.style.left   = _CELL_SIZE * next.j + "px";
      document.getElementById("T" + next.i + "L" + next.j).setAttribute("color", _COLORS[next.id + 1]);
      if (_HOST) {
        sendCommand("EAT", { ID: next.id, Y: next.i, X: next.j }, function(){});
      }
    }
  }
  _NEXT = [];
}

function die(next) {
  if (next.id == _MYTRON) _DEAD = true;
  next.die = true;
}