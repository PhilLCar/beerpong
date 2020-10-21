var _GAMEID = null;
var _USERNM = null;
var _USERID = -1;
var _SDELAY = 70000;
var _TURN   = 0;
var _STATE  = 0;
var _PREVC  = [];
var _CARDS  = [];
var _USERS  = [];
var _NUSER  = null;
var _NUP    = null;
var _CID    = [
  "/resources/0red.svg",
  "/resources/1red.svg",
  "/resources/2red.svg",
  "/resources/3red.svg",
  "/resources/4red.svg",
  "/resources/5red.svg",
  "/resources/6red.svg",
  "/resources/7red.svg",
  "/resources/8red.svg",
  "/resources/9red.svg",
  "/resources/Sred.svg",
  "/resources/Rred.svg",
  "/resources/2cardsred.svg",
  "/resources/multi.svg",
  "/resources/0yellow.svg",
  "/resources/1yellow.svg",
  "/resources/2yellow.svg",
  "/resources/3yellow.svg",
  "/resources/4yellow.svg",
  "/resources/5yellow.svg",
  "/resources/6yellow.svg",
  "/resources/7yellow.svg",
  "/resources/8yellow.svg",
  "/resources/9yellow.svg",
  "/resources/Syellow.svg",
  "/resources/Ryellow.svg",
  "/resources/2cardsyellow.svg",
  "/resources/multi.svg",
  "/resources/0green.svg",
  "/resources/1green.svg",
  "/resources/2green.svg",
  "/resources/3green.svg",
  "/resources/4green.svg",
  "/resources/5green.svg",
  "/resources/6green.svg",
  "/resources/7green.svg",
  "/resources/8green.svg",
  "/resources/9green.svg",
  "/resources/Sgreen.svg",
  "/resources/Rgreen.svg",
  "/resources/2cardsgreen.svg",
  "/resources/multi.svg",
  "/resources/0blue.svg",
  "/resources/1blue.svg",
  "/resources/2blue.svg",
  "/resources/3blue.svg",
  "/resources/4blue.svg",
  "/resources/5blue.svg",
  "/resources/6blue.svg",
  "/resources/7blue.svg",
  "/resources/8blue.svg",
  "/resources/9blue.svg",
  "/resources/Sblue.svg",
  "/resources/Rblue.svg",
  "/resources/2cardsblue.svg",
  "/resources/multi.svg",
  null,
  "/resources/1red.svg",
  "/resources/2red.svg",
  "/resources/3red.svg",
  "/resources/4red.svg",
  "/resources/5red.svg",
  "/resources/6red.svg",
  "/resources/7red.svg",
  "/resources/8red.svg",
  "/resources/9red.svg",
  "/resources/Sred.svg",
  "/resources/Rred.svg",
  "/resources/2cardsred.svg",
  "/resources/multi.svg",
  null,
  "/resources/1yellow.svg",
  "/resources/2yellow.svg",
  "/resources/3yellow.svg",
  "/resources/4yellow.svg",
  "/resources/5yellow.svg",
  "/resources/6yellow.svg",
  "/resources/7yellow.svg",
  "/resources/8yellow.svg",
  "/resources/9yellow.svg",
  "/resources/Syellow.svg",
  "/resources/Ryellow.svg",
  "/resources/2cardsyellow.svg",
  "/resources/multi.svg",
  null,
  "/resources/1green.svg",
  "/resources/2green.svg",
  "/resources/3green.svg",
  "/resources/4green.svg",
  "/resources/5green.svg",
  "/resources/6green.svg",
  "/resources/7green.svg",
  "/resources/8green.svg",
  "/resources/9green.svg",
  "/resources/Sgreen.svg",
  "/resources/Rgreen.svg",
  "/resources/2cardsgreen.svg",
  "/resources/multi.svg",
  null,
  "/resources/1blue.svg",
  "/resources/2blue.svg",
  "/resources/3blue.svg",
  "/resources/4blue.svg",
  "/resources/5blue.svg",
  "/resources/6blue.svg",
  "/resources/7blue.svg",
  "/resources/8blue.svg",
  "/resources/9blue.svg",
  "/resources/Sblue.svg",
  "/resources/Rblue.svg",
  "/resources/2cardsblue.svg",
  "/resources/multi.svg"
];

// https://www.w3schools.com/js/js_cookies.asp
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function sendCommand(command, args, callback) {
  var xhttp = new XMLHttpRequest();
  var post = "GameID=" + _GAMEID + "&Command=" + command;
  if (_USERID !== null) post += "&UserID=" + _USERID;

  if (args) {
    for (arg in args) {
      post += `&${arg}=${encodeURIComponent(args[arg])}`;
    }
  }

  xhttp.timeout = _SDELAY;
  xhttp.onreadystatechange = async function() {
    if (this.readyState == 4 && this.status == 200) {
      // good answer
      callback(this.responseText);
    } else if (this.readyState == 4) {
      // wrong answer
      alert("Unknown error!");
    }
  };
  xhttp.open("POST", "database.php", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(post);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function animationMask(on) {
  var mask = document.getElementById("Mask").hidden = !on;
}

/////////////////////////////////////////////////////////////////////////////////
function showJoin() {
  var inputs = document.getElementsByTagName("form")[0].getElementsByTagName("input");
  inputs[0].hidden = false;
  inputs[1].hidden = false;
}

async function getUserName() {
  var question;
  var tmp = getCookie("UserID");
  if (tmp) {
    _USERID = tmp;
    _USERNM = getCookie("UserName");
  }
  while (_USERID == -1) {
    if (getCookie("Language") == "FR") question = "Entrez votre nom:";
    else                               question = "Enter your name:";
    _USERNM = prompt(question, "");
    if (_USERNM == "") continue;
    var promise = new Promise(resolve => sendCommand("GET_USER_ID", { UserName: _USERNM }, resolve));
    promise.then(value => _USERID = value);
    await promise;
  }
  document.cookie = "UserID="   + _USERID + "; path=/uno; SameSite=Lax";
  document.cookie = "UserName=" + _USERNM + "; path=/uno; SameSite=Lax";
  document.cookie = "GameID="   + _GAMEID + "; path=/uno; SameSite=Lax";
  document.cookie = "Host="     + _HOST   + "; path=/uno; SameSite=Lax";
  sendCommand("UPDATE", { Immediate: true }, update);
}

function update(info) {
  if (info) {
    var data = info.split(';');
    var nu = _USERS.length;
    var i  = 0;
    var ps = _STATE;
    var pt = _TURN;
    var pn = _NUP;
    _STATE = data[i++];
    _TURN  = data[i++];
    _NUP   = data[i++];
    if (pn !== null) {
      if (ps != _STATE) animateState();
      if (pt != _TURN)  animateTurn();
    }
    if (data[i++] == 'C') {
      document.getElementById("Distribute").hidden = true;
      _PREVC = _CARDS;
      _CARDS = [];
      while (data[i] != 'U' && i < data.length) {
        _CARDS.push({
          CardID: data[i++],
          UserID: data[i++],
          DeckPosition: data[i++]
        });
      }
      if (_CARDS.length) {
        displayCards();
      }
    }
    if (data[i++] == 'U') {
      _USERS = []
      while (i < data.length) {
        if (data[i] == _USERID) _NUSER = _USERS.length;
        _USERS.push({
          UserID: data[i++],
          UserName: decodeURIComponent(data[i++]),
          HideCards: data[i++]
        })
      }
      if (nu != _USERS.length) {
        displayUsers();
      }
    }
  }
  sendCommand("UPDATE", { RequestUpdate: _NUP }, update);
}

function fitTable() {
  var table = document.getElementById("Table");
  var min = Math.min(window.innerHeight, window.innerWidth);
  table.style.width  = 0.7  * min + "px";
  table.style.height = 0.5  * min + "px";
  table.style.left   = window.innerWidth  / 2 - 0.35 * min + "px";
  table.style.top    = 0.2 * min + "px";
  displayUsers();
  if (_HOST) {
    var button = document.getElementById("Distribute");
    button.hidden = _CARDS.length > 0;
    button.style.position = "absolute";
    button.style.left = 0.35 * min - button.clientWidth  / 2 + "px";
    button.style.top  = 0.25 * min - button.clientHeight / 2 + "px";
  }
}

function displayUsers() {
  if (_USERS.length < 2) return;
  var td = document.getElementById("TableDefs");
  var tt = document.getElementById("TableTransform");
  var t  = document.getElementById("Table");
  var sector = Math.PI * 2 / _USERS.length;
  // https://www.w3.org/People/Dean/svg/texteffects/glow.svg
  td.innerHTML = `<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">`
               + `<feGaussianBlur stdDeviation="2 2" result="glow"/>`
               + `<feMerge>`
               + `<feMergeNode in="glow"/>`
               + `<feMergeNode in="glow"/>`
               + `<feMergeNode in="glow"/>`
               + `</feMerge>`
               + `</filter>`;
  tt.innerHTML = "";
  for (var i = 0; i < _USERS.length; i++) {
    var fill   = "gold";
    var filter = "";
    if ((_STATE == 1) && ((_TURN % _USERS.length) == i)) {
      fill   = "white";
      filter = `<text x="${Math.PI * 280 / _USERS.length}" font-size="40" text-anchor="middle" fill="#FF7" font-family="Commissioner" style="filter: url(#glow)">`
             + `<textPath id="User${i}" xlink:href="#Path${i}">${_USERS[(i + _NUSER) % _USERS.length].UserName}</textPath>`
             + `</text>`;
    }
    td.innerHTML += `<path id="Path${i}" d="M ${300 + Math.sin(sector * i - sector / 2) * 280} ${300 + Math.cos(sector * i - sector / 2) * 280} A 280 280, 0, 0, 0 `
                 +  `${300 + Math.sin(sector * i + sector / 2) * 280} ${300 + Math.cos(sector * i + sector / 2) * 280}"/>`
    tt.innerHTML += filter
                 +  `<text x="${Math.PI * 280 / _USERS.length}" font-size="40" text-anchor="middle" fill="${fill}" font-family="Commissioner">`
                 +  `<textPath id="User${i}" xlink:href="#Path${i}">${_USERS[(i + _NUSER) % _USERS.length].UserName}</textPath>`
                 +  `</text>`;
  }
  var ty = t.clientHeight / 600;
  var tx = t.clientWidth  / 600;
  tt.setAttribute("transform", `scale(${tx}, ${ty})`);
}

function displayCards() {

}

///////////////////////////////////////////////////////////////////////////////////////////////
function animateState() {
  if (_STATE == 1) { // Start of game

  }
}