var _GAMEID = null;
var _USERNM = null;
var _USERID = -1;
var _SDELAY = 70000;
var _TURN   = 0;
var _STATE  = 0;
var _CARDS  = [];
var _USERS  = [];
var _NUSER  = null;
var _NUP    = null;
var _HANDO  = false;
var _STATEO = false;
var _ANIM   = false;
var _ANIMMS = 25;
var _BRATIO = 14.6667;
var _TILT   = 10 * Math.PI / 180;
var _OUTPRC = 0.4;
var _COLOR  = null;
var _STACK  = 0;
var _CW     = true;
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
  "/resources/4cards.svg",
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
  "/resources/4cards.svg",
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
  "/resources/4cards.svg",
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
  "/resources/4cards.svg"
];

function mod(base, modulo) {
  var m = base % modulo;
  if (m < 0) m += modulo;
  return m;
}

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
  var mask = document.getElementById("AnimationMask").hidden = !on;
  _ANIM = on;
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
    var rf = false;
    var i  = 0;
    var ps = _STATE;
    var pt = _TURN;
    var pn = _NUP;
    var pc = _CARDS;
    var pu = _USERS;
    _STATE = data[i++];
    _TURN  = data[i++];
    _NUP   = data[i++];
    _CW    = data[i++];
    _COLOR = data[i++];
    _STACK = data[i++];
    if (_STACK != 0) {
      document.getElementById("Pick").hidden = false;
      document.getElementById("PickNumber").innerHTML = _STACK;
    } else {
      document.getElementById("Pick").hidden = true;
    }
    if (data[i] == 'C') {
      i++;
      document.getElementById("Distribute").hidden = true;
      _CARDS = [];
      while (data[i] != 'U' && i < data.length) {
        _CARDS.push({
          CardID: data[i++],
          UserID: data[i++],
          DeckPosition: data[i++] == "" ? null : parseInt(data[i - 1])
        });
      }
      if (_CARDS.length && pn === null) {
        rf = true;
      }
    }
    if (data[i] == 'U') {
      i++;
      _USERS = [];
      while (i < data.length) {
        if (data[i] == _USERID) _NUSER = _USERS.length;
        _USERS.push({
          UserID: data[i++],
          UserName: decodeURIComponent(data[i++]),
          HideCards: data[i++],
          Uno: data[i++],
          Signal: data[i++]
        })
      }
      if (pu.length != _USERS.length) {
        displayUsers();
      }
    }
    if (rf) {
      displayCards();
      if (_USERS[_NUSER].HideCards != document.getElementById("ShowHideButton").getAttribute("value")) {
        showHide(false);
      }
      for (var i = 0; i < _USERS.length; i++) {
        if (i != _NUSER) animateFan(i, _USERS[i].HideCards == "0");
      }
    }
    if (pn !== null) {
      if (ps != _STATE) _STATEO = animateState();
      if (pt != _TURN)  animateTurn(mod(_TURN, _USERS.length));
    }
    if (pu.length == _USERS.length) {
      for (var i = 0; i < _USERS.length; i++) {
        if (i == _NUSER) continue;
        if (pu[i].HideCards != _USERS[i].HideCards)                            animateFan(i, _USERS[i].HideCards == "0");
        if (pu[i].Uno       != _USERS[i].Uno && _USERS[i].Uno == "1")          animateUno(i);
        if (pu[i].Signal    != _USERS[i].Signal && _USERS[i].Signal == "1")    animateSig(i);
      }
    }
    if (pc.length) {
      var deckFlipped = false;
      for (var i = 0; i < _CARDS.length; i++) {
        if (pc[i].DeckPosition != _CARDS[i].DeckPosition) {
          if (_CARDS[i].DeckPosition === null) {
            var user = 0;
            for (user = 0; user < _USERS.length; user++) if (_USERS[user].UserID == _CARDS[i].UserID) break;
            animateCardFromDeck(user, _CARDS[i].CardID);
          } else if (_CARDS[i].DeckPosition < 0) {
            animateCardToPDeck(_CARDS[i].CardID);
          } else if (!deckFlipped && pc[i].DeckPosition == -_CARDS[i].DeckPosition) {
            animateFlipDeck();
            deckFlipped = true;
          }
        }
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
  displayCards();
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
    var fill    = "gold";
    var opacity = "0"
    if ((_STATE == 1) && (mod(_TURN, _USERS.length) == (i + _NUSER) % _USERS.length)) {
      fill    = "white";
      opacity = "1";
    }
    td.innerHTML += `<path id="Path${(i + _NUSER) % _USERS.length}" d="M ${300 + Math.sin(sector * -i - sector / 2) * 280} ${300 + Math.cos(sector * -i - sector / 2) * 280} A 280 280, 0, 0, 0 `
                 +  `${300 + Math.sin(sector * -i + sector / 2) * 280} ${300 + Math.cos(sector * -i + sector / 2) * 280}"/>`
    tt.innerHTML += `<text id="Filter${(i + _NUSER) % _USERS.length}" class="filter" x="${Math.PI * 280 / _USERS.length}" font-size="40" text-anchor="middle" `
                 +  `fill="#FF7" fill-opacity="${opacity}" font-family="Commissioner" style="filter: url(#glow)">`
                 +  `<textPath xlink:href="#Path${(i + _NUSER) % _USERS.length}">${_USERS[(i + _NUSER) % _USERS.length].UserName}</textPath>`
                 +  `</text>`
                 +  `<text id="User${(i + _NUSER) % _USERS.length}" x="${Math.PI * 280 / _USERS.length}" font-size="40" text-anchor="middle" fill="${fill}" font-family="Commissioner">`
                 +  `<textPath xlink:href="#Path${(i + _NUSER) % _USERS.length}">${_USERS[(i + _NUSER) % _USERS.length].UserName}</textPath>`
                 +  `</text>`;
  }
  var ty = t.clientHeight / 600;
  var tx = t.clientWidth  / 600;
  tt.setAttribute("transform", `scale(${tx}, ${ty})`);
}

function displayDeck() {
  var deck  = document.getElementById("Deck");
  var deckSize  = 0;
  var tableSize;
  var bwidth;
  var width;
  var bottom;
  var bshadow = "";
  for (var card of _CARDS) if (card.DeckPosition !== null && card.DeckPosition >= 0) deckSize++;
  deck.hidden = deckSize == 0;
  tableSize = document.getElementById("Table").getBoundingClientRect();
  width  = tableSize.width / 4 / (1 + 2 / _BRATIO);
  bwidth = width / _BRATIO;
  bottom = Math.floor(deckSize / 108 * 4 * bwidth);
  deck.style.width  = width + "px";
  deck.style.height =  1.5 * width + "px";
  deck.style.left   = width + "px";
  deck.style.top    = tableSize.height / 2 - (0.75 * width + bwidth) - bottom + "px";
  deck.style.borderWidth = bwidth + "px";
  deck.style.borderRadius = 2 * bwidth + "px";
  for (var i = 0; i < bottom; i++) {
    bshadow += `0 ${i}px 0 ${i % 2 ? 'white' : 'black'}, `;
  }
  deck.style.boxShadow = bshadow.substring(0, bshadow.length - 2);
}

function displayPDeck() {
  var deck  = document.getElementById("PlayDeck");
  var deckSize  = 0;
  var tableSize;
  var bwidth;
  var width;
  var bottom;
  var bshadow = "";
  for (var card of _CARDS) if (card.DeckPosition !== null && card.DeckPosition < 0) deckSize++;
  deck.hidden = deckSize == 0;
  tableSize = document.getElementById("Table").getBoundingClientRect();
  width  = tableSize.width / 4 / (1 + 2 / _BRATIO);
  bwidth = width / _BRATIO;
  bottom = Math.floor(deckSize / 108 * 4 * bwidth);
  deck.style.width  = width + "px";
  deck.style.height =  1.5 * width + "px";
  deck.style.left   = tableSize.width - 2 * width - 2 * bwidth + "px";
  deck.style.top    = tableSize.height / 2 - (0.75 * width + bwidth) - bottom + "px";
  deck.style.borderWidth = bwidth + "px";
  deck.style.borderRadius = 2 * bwidth + "px";
  for (var i = 0; i < bottom; i++) {
    bshadow += `0 ${i}px 0 ${i % 2 ? 'white' : 'black'}, `;
  }
  deck.style.boxShadow = bshadow.substring(0, bshadow.length - 2);
}

function displayCards() {
  var hidden = i != _NUSER || document.getElementById("ShowHideButton").getAttribute("value") == "1";
  displayDeck();
  displayPDeck();
  if (!_CARDS.length) return;
  var cards    = document.getElementById("Cards");
  var deck     = document.getElementById("Deck");
  var pdeck    = document.getElementById("PlayDeck");
  var deckpos  = deck.getBoundingClientRect();
  var tablepos = document.getElementById("Table").getBoundingClientRect();
  var sector   = Math.PI * 2 / _USERS.length;
  for (var i = 0; i < _USERS.length; i++) {
    var ncards = 0;
    var n      = 0;
    if (!hidden) {
      for (var c of _CARDS) if (c.UserID == _USERS[i].UserID) ncards++;
    }
    for (var c of _CARDS) {
      if (c.UserID != _USERS[i].UserID) continue;
      var finalAngle = sector * (i - _NUSER);
      var finalW     = 0.6 * deckpos.width;
      var finalX     = tablepos.left + tablepos.width  / 2 - Math.sin(finalAngle) * (tablepos.width  / 2 + 0.2 * tablepos.height) - finalW /    2 - finalW / _BRATIO;
      var finalY     = tablepos.top  + tablepos.height / 2 + Math.cos(finalAngle) * (tablepos.height / 2 + 0.2 * tablepos.height) - finalW * 0.75 - finalW / _BRATIO;
      var card;
      var created = false;
      while (!(card = document.getElementById(`Card${c.CardID}`))) {
        created = true;
        cards.innerHTML += `<div id="Card${c.CardID}" class="card${i == _NUSER ? " mine" : ""}" onclick="select(this)">`
                        +  `<img src="${hidden ? "/resources/back.svg" : _CID[c.CardID]}"/></div>`;
      }
      if (created) {
        if (hidden) card.style.zIndex = i == _NUSER ? n++ : -(++n);
        else        card.style.zIndex = ncards - ++n;
      }
      card.style.width  = finalW + "px";
      card.style.height = 1.5 * finalW + "px";
      card.style.left   = finalX + "px";
      card.style.top    = finalY + "px";
      card.style.borderWidth = finalW / _BRATIO + "px";
      card.style.borderRadius = 2 * finalW / _BRATIO + "px";
      card.style.transform = `rotate(${finalAngle}rad)`;
    }
  }
  var min = 0;
  for (var c of _CARDS) if (c.DeckPosition !== null && c.DeckPosition < min) {
    min = c.DeckPosition;
    cid = c.CardID;
  }
  pdeck.getElementsByTagName("img")[0].src = _CID[cid];
}

///////////////////////////////////////////////////////////////////////////////////////////////
function color(c) {
  _COLOR = c;
  document.getElementById("Color").hidden = true;
}

async function select(card) {
  if (mod(_TURN, _USERS.length) != _NUSER) {
    if (getCookie("Language") == "FR") alert("Ce n'est pas votre tour!");
    else                               alert("It's not your turn!");
    return;
  }
  var cid = card.id.substring(4);
  var min = 0;
  var dcid = 0;
  for (var c of _CARDS) {
    if (c.DeckPosition < min) {
      min = c.DeckPosition;
      dcid = c.CardID;
    }
  }
  if (((Math.floor(cid / 14) % 4) == _COLOR || _COLOR == "" || (cid % 14 == 13) || (cid % 14) == (dcid % 14)) && 
      (_STACK == "0" || ((cid % 14) == 13 && cid >= 56) || (cid % 14) == 12)) {
    if (cid % 14 == 13) {
      document.getElementById("Color").hidden = false;
      while (!document.getElementById("Color").hidden) {
        await sleep(100);
      }
    }
  } else {
    if (getCookie("Language") == "FR") alert("Vous ne pouvez pas jouer cette carte!");
    else                               alert("You can't play this card!");
    return;
  }
  sendCommand("PLAY", { CardID: cid, Color: _COLOR }, function(){});
}

function pick() {
  if (mod(_TURN, _USERS.length) != _NUSER) {
    if (getCookie("Language") == "FR") alert("Ce n'est pas votre tour!");
    else                               alert("It's not your turn!");
    return;
  }
  sendCommand("PICK", null, function(){});
}

function uno() {
  sendCommand("UNO", null, function(){});
}

function signal() {
  sendCommand("SIG", null, function(){});
}

function showHide(toserver) {
  var button = document.getElementById("ShowHideButton");
  var input = button.getElementsByTagName("input")[0];
  var text  = button.getAttribute("alternate");
  if (button.getAttribute("value") == "1") {
    animateFlip(true);
    button.setAttribute("value", "0");
  } else {
    animateFlip(false);
    button.setAttribute("value", "1");
  }
  button.setAttribute("alternate", input.value);
  input.value = text;
  if (toserver) sendCommand("SWHD", null, function(){});
}

///////////////////////////////////////////////////////////////////////////////////////////////
async function animateState() {
  if (_STATE == 1) { // Start of game
    displayDeck();
    var cards    = document.getElementById("Cards");
    var deck     = document.getElementById("Deck");
    var pdeck    = document.getElementById("PlayDeck");
    var deckpos  = deck.getBoundingClientRect();
    var tablepos = document.getElementById("Table").getBoundingClientRect();
    var sector   = Math.PI * 2 / _USERS.length;
    animationMask(true);
    for (var i = 0; i < 7; i++) {
      for (var j = 0; j < _USERS.length; j++) {
        var finalAngle = sector * (j - _NUSER);
        var startW     = deckpos.width;
        var finalW     = 0.6 * startW;
        var startX     = deckpos.left;
        var startY     = deckpos.top;
        var finalX     = tablepos.left + tablepos.width  / 2 - Math.sin(finalAngle) * (tablepos.width  / 2 + 0.2 * tablepos.height) - finalW / 2    - finalW / _BRATIO;
        var finalY     = tablepos.top  + tablepos.height / 2 + Math.cos(finalAngle) * (tablepos.height / 2 + 0.2 * tablepos.height) - finalW * 0.75 - finalW / _BRATIO;
        var card;
        var cid;
        var n = 0;
        for (var c of _CARDS) {
          if (c.UserID == _USERS[j].UserID) {
            if (n == i) {
              cid = c.CardID;
              break;
            }
            n++;
          }
        }
        cards.innerHTML += `<div id="Card${cid}" class="card${j == _NUSER ? " mine" : ""}" onclick="select(this)"><img src="/resources/back.svg"/></div>`;
        card = document.getElementById(`Card${cid}`);
        card.style.zIndex = j == _NUSER ? i : -1;
        for (var k = 0, anim = 10; k <= anim; k++) {
          var a  = finalAngle * k / anim;
          var x  = startX + (finalX - startX) * k / anim;
          var y  = startY + (finalY - startY) * k / anim;
          var w  = startW + (finalW - startW) * k / anim;
          var h  = 1.5 * w;
          var bw = w / _BRATIO;
          card.style.width  = w + "px";
          card.style.height = h  + "px";
          card.style.left   = x + "px";
          card.style.top    = y + "px";
          card.style.borderWidth = bw + "px";
          card.style.borderRadius = 2 * bw + "px";
          card.style.transform = `rotate(${a}rad)`;
          await sleep(_ANIMMS);
        }
      }
    }
    animateTurnFirst();
    animateTurn(mod(_TURN, _USERS.length));
    animationMask(false);
  }
  for (var i = 0; i < _USERS.length; i++) {
    if (i != _NUSER) animateFan(i, true)
    else             showHide(false);
  }
  _STATEO = false;
}

async function animateTurnFirst() {
  var deck  = document.getElementById("Deck");
  var pdeck = document.getElementById("PlayDeck");
  var cards = document.getElementById("Cards");
  var tablepos = document.getElementById("Table").getBoundingClientRect();
  var card;
  //////////////////
  while (!(card = document.getElementById("AnimCard"))) {
    cards.innerHTML += `<div id="AnimCard" class="card"><img src="/resources/back.svg"/></div>`;
  }
  var refX       = tablepos.left;
  var refY       = tablepos.top;
  var startX     = parseFloat(deck.style.left);
  var startY     = parseFloat(deck.style.top)
  var finalX     = parseFloat(pdeck.style.left);
  var finalY     = parseFloat(pdeck.style.top);
  var startW     = parseFloat(pdeck.style.width);
  var cid;
  card.hidden = false;
  card.style.height = pdeck.style.height;
  card.style.borderWidth = pdeck.style.borderWidth;
  card.style.borderRadius = pdeck.style.borderRadius;

  for (var c of _CARDS) if (c.DeckPosition == -1) {
    cid = c.CardID;
    break;
  }

  for (var k = 0, anim = 10; k <= anim; k++) {
    var y  = startY + (finalY - startY) * k / anim;
    var x  = startX + (finalX - startX) * k / anim;
    var w  = startW * Math.abs((k - anim / 2) / (anim / 2));
    if (k == Math.floor(anim / 2)) card.innerHTML = `<img src="${_CID[cid]}"/>`;
    card.style.width  = w + "px";
    card.style.left   = refX + x + "px";
    card.style.top    = refY + y + "px";
    card.style.borderLeftWidth  = w / _BRATIO + "px";
    card.style.borderRightWidth = w / _BRATIO + "px";
    await sleep(_ANIMMS);
  }
  card.hidden  = true;
  displayPDeck();
  pdeck.getElementsByTagName("img")[0].src = _CID[cid];
}

async function animateOpenHand() {
  animationMask(true);
  var fan   = document.getElementById("Fan").getBoundingClientRect();
  var deck  = document.getElementById("Deck").getBoundingClientRect();
  var cards = document.getElementsByClassName("mine");
  var final = [];
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var ang  = _TILT * (i - (cards.length - 1) / 2) / ((cards.length - 1) / 2);
    final.push({
      A0: 0,
      A1: ang,
      X0: parseFloat(card.style.left),
      X1: fan.left + i * (fan.width - deck.height - 2 * deck.height / _BRATIO) / (cards.length - 1),
      Y0: parseFloat(card.style.top),
      Y1: parseFloat(card.style.top) + Math.cos(ang + Math.PI) * fan.height + fan.height,
      W0: parseFloat(card.style.width),
      W1: deck.height
    });
    card.setAttribute("pos", final[i].X1 + ";" + final[i].Y1);
  }
  for (var i = 0, anim = 5; i <= anim; i++) {
    var left = anim - i;
    for (var j = 0; j < cards.length; j++) {
      var target = final[j];
      var card = cards[j];
      var width = target.W0 + (target.W1 - target.W0) * i / anim;
      card.style.transform = `rotate(${target.A0 + (target.A1 - target.A0) * i / anim}rad)`;
      card.style.left = target.X0 + (target.X1 - target.X0) * i / anim + "px";
      card.style.top  = target.Y0 + (target.Y1 - target.Y0) * i / anim + "px";
      card.style.width  = width + "px";
      card.style.height = 1.5 * width + "px";
      card.style.borderWidth  = width / _BRATIO + "px";
      card.style.borderRadius = 2 * width / _BRATIO + "px";
    }
    await sleep(_ANIMMS);
  }
  animationMask(false);
}

async function animateCloseHand() {
  if (_HANDO) await _HANDO;
  animationMask(true);
  var deck  = document.getElementById("Deck").getBoundingClientRect();
  var table = document.getElementById("Table").getBoundingClientRect();
  var cards = document.getElementsByClassName("mine");
  var final = [];
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var rect = card.getBoundingClientRect();
    final.push({
      A0: parseFloat(card.style.transform.substring(7)),
      A1: 0,
      X0: parseFloat(card.style.left),
      X1: table.left + table.width  /   2 -  0.3 * deck.width - 0.6 * deck.width / _BRATIO,
      Y0: parseFloat(card.style.top),
      Y1: table.top  + table.height * 1.2 - 0.45 * deck.width - 0.6 * deck.width / _BRATIO,
      W0: parseFloat(card.style.width),
      W1: 0.6 * deck.width
    });
  }
  for (var i = 0, anim = 5; i <= anim; i++) {
    for (var j = 0; j < cards.length; j++) {
      var target = final[j];
      var card = cards[j];
      var width = target.W0 + (target.W1 - target.W0) * i / anim;
      card.style.transform = `rotate(${target.A0 + (target.A1 - target.A0) * i / anim}rad)`;
      card.style.left = target.X0 + (target.X1 - target.X0) * i / anim + "px";
      card.style.top  = target.Y0 + (target.Y1 - target.Y0) * i / anim + "px";
      card.style.width  = width + "px";
      card.style.height = 1.5 * width + "px";
      card.style.borderWidth  = width / _BRATIO + "px";
      card.style.borderRadius = 2 * width / _BRATIO + "px";
    }
    await sleep(_ANIMMS);
  }
  animationMask(false);
  _HANDO = false;
}

function openHand() {
  if (_HANDO) return;
  _HANDO = animateOpenHand();
}

async function animateOut(card) {
  var ang  = parseFloat(card.style.transform.substring(7));
  var dist = parseFloat(card.style.height) * _OUTPRC;
  var X0   = parseFloat(card.style.left);
  var X1   = X0 + Math.sin(ang) * dist;
  var Y0   = parseFloat(card.style.top);
  var Y1   = Y0 - Math.cos(ang) * dist;
  card.setAttribute("out", "true");
  for (var i = 0, anim = 5; i <= anim; i++) {
    card.style.left = X0 + (X1 - X0) * i / anim + "px";
    card.style.top  = Y0 + (Y1 - Y0) * i / anim + "px";
    await sleep(_ANIMMS);
  }
}

async function animateBackIn(card) {
  var pos  = card.getAttribute("pos").split(';');
  var X0   = parseFloat(card.style.left);
  var X1   = pos[0];
  var Y0   = parseFloat(card.style.top);
  var Y1   = pos[1]
  card.setAttribute("out", "");
  for (var i = 0, anim = 5; i <= anim; i++) {
    card.style.left = X0 + (X1 - X0) * i / anim + "px";
    card.style.top  = Y0 + (Y1 - Y0) * i / anim + "px";
    await sleep(_ANIMMS);
  }
}

function fanCards() {
  openHand();
  var cards = document.getElementsByClassName("mine");
  for (var card of cards) {
    if (card.matches(":hover")) {
      if (!card.getAttribute("out")) animateOut(card);
    } else if (card.getAttribute("out")) {
      animateBackIn(card);
    }
  }
}

async function animateFlip(visible) {
  animationMask(true);
  var cards = document.getElementsByClassName("mine");
  var width = document.getElementById("Deck").getBoundingClientRect().width * 0.6;
  var table = document.getElementById("Table").getBoundingClientRect();
  var left  = table.left + table.width  / 2 - width / 2 - width / _BRATIO;
  var animcard;
  for (var card of cards) {
    if ((visible && card.style.zIndex != "0") || (!visible && card.style.zIndex != cards.length - 1)) {
      card.hidden = true;
    } else {
      animcard = card;
    }
    card.style.zIndex = cards.length - 1 - card.style.zIndex;
  }
  for (var i = 0, anim = 10; i <= anim; i++) {
    var t = Math.abs((i - anim / 2) / (anim / 2)) * width;
    if (i == Math.floor(anim / 2)) {
      if (visible) {
        var id = parseInt(animcard.id.substring(4));
        animcard.getElementsByTagName("img")[0].src = _CID[id];
      } else {
        animcard.getElementsByTagName("img")[0].src = "/resources/back.svg";
      }
    }
    animcard.style.width = t + "px";
    animcard.style.left  = left + (width - t) / 2 + "px";
    animcard.style.borderLeftWidth  = t / _BRATIO + "px";
    animcard.style.borderRightWidth = t / _BRATIO + "px";
    await sleep(_ANIMMS);
  }
  for (var card of cards) {
    card.hidden = false;
    if (visible) {
      var id = parseInt(card.id.substring(4));
      card.getElementsByTagName("img")[0].src = _CID[id];
    } else {
      card.getElementsByTagName("img")[0].src = "/resources/back.svg";
    }
  }
  animationMask(false);
}

async function animateFan(nuser, open) {
  animationMask(true);
  var table  = document.getElementById("Table").getBoundingClientRect();
  var sector = Math.PI * 2 / _USERS.length;
  var ang    = sector * (nuser - _NUSER);
  var cards  = [];
  var finals = [];
  for (var c of document.getElementsByClassName("card")) {
    var id = c.id.substring(4);
    for (var cc of _CARDS) if (cc.CardID == id) {
      if (cc.UserID == _USERS[nuser].UserID) cards.push(cc);
      break;
    }
  }
  for (var i = 0; i < cards.length; i++) {
    var c          = cards[i];
    var card       = document.getElementById("Card" + c.CardID);
    var width      = parseFloat(card.style.width);
    finals.push({
      C:  card,
      X0: parseFloat(card.style.left),
      Y0: parseFloat(card.style.top),
      X1: table.left + table.width  / 2 - Math.sin(ang) * (table.width  / 2 + 0.2 * table.height) - width / 2    - width / _BRATIO,
      Y1: table.top  + table.height / 2 + Math.cos(ang) * (table.height / 2 + 0.2 * table.height) - width * 0.75 - width / _BRATIO
    });
    if (open) {
      var fanwidth = Math.min(table.height * Math.PI / _USERS.length, 2 * width);
      var distance = (i - (cards.length - 1) / 2) / ((cards.length - 1) / 2) * fanwidth / 2;
      finals[i].X1 += Math.cos(ang) * distance;
      finals[i].Y1 += Math.sin(ang) * distance;
    }
  }
  for (var k = 0, anim = 5; k <= anim; k++) {
    for (var i = 0; i < finals.length; i++) {
      var final = finals[i];
      var x  = final.X0 + (final.X1 - final.X0) * k / anim;
      var y  = final.Y0 + (final.Y1 - final.Y0) * k / anim;
      final.C.style.left   = x + "px";
      final.C.style.top    = y + "px";
    }
    await sleep(_ANIMMS);
  }
  animationMask(false);
}

async function animateCardToPDeck(cid) {
  animationMask(true);
  var hidden = document.getElementById("ShowHideButton").getAttribute("value") == "1";
  var deck   = document.getElementById("PlayDeck");
  var deckr  = deck.getBoundingClientRect();
  var card   = document.getElementById("Card" + cid);
  var img    = card.getElementsByTagName("img")[0];
  var hidden = img.src.includes("/resources/back.svg");

  var A0 = parseFloat(card.style.transform.substring(7));
  var X0 = parseFloat(card.style.left);
  var Y0 = parseFloat(card.style.top);
  var W0 = parseFloat(card.style.width);
  
  var A1 = 0;
  var X1 = deckr.left + parseFloat(deck.style.borderWidth);
  var Y1 = deckr.top  + parseFloat(deck.style.borderWidth);
  var W1 = parseFloat(deck.style.width);

  for (var i = 0, anim = 10; i <= anim; i++) {
    var width = W0 + (W1 - W0) * i / anim;
    var wm    = hidden ? (i - anim / 2) / (anim / 2) : 1;
    card.style.transform = `rotate(${A0 + (A1 - A0) * i / anim}rad)`;
    card.style.left = X0 + (X1 - X0) * i / anim + "px";
    card.style.top  = Y0 + (Y1 - Y0) * i / anim + "px";
    card.style.width  = width * wm + "px";
    if (hidden && i == Math.floor(anim / 2)) {
      img.src = _CID[cid];
    }
    card.style.height = 1.5 * width + "px";
    card.style.borderWidth  = width / _BRATIO * wm + "px";
    card.style.borderRadius = 2 * width / _BRATIO + "px";
    await sleep(_ANIMMS);
  }
  deck.getElementsByTagName("img")[0].src = _CID[cid];
  card.parentNode.removeChild(card);
  var min = 0;
  var index;
  for (var i = 0; i < _CARDS.length; i++) {
    var c = _CARDS[i];
    if (c.DeckPosition < min) min = c.DeckPosition;
    if (c.CardID == cid) index = i;
  }
  var nmine = document.getElementsByClassName("mine").length;
  var indices = [];
  for (var i = 0; i < _USERS.length; i++) indices.push(0);
  for (var c of document.getElementsByClassName("card")) {
    var ccid = c.id.substring(4);
    var cuid;
    for (var cc of _CARDS) {
      if (cc.CardID == ccid) {
        cuid = cc.UserID;
      }
    }
    if (cuid == _USERS[_NUSER].UserID) {
      if (hidden) {
        c.zIndex = nmine - ++indices[_NUSER];
      } else {
        c.zIndex = indices[_NUSER]++;
      }
    } else {
      var i;
      for (i = 0; i < _USERS.length; i++) {
        if (_USERS[i].UserID == cuid) break;
      }
      c.zIndex = -(++indices[i]);
    }
  }
  displayPDeck();
  animationMask(false);
}

async function animateCardFromDeck(user, cid) {
  animationMask(true);
  var hidden     = user != _NUSER || document.getElementById("ShowHideButton").getAttribute("value") == "1";
  var cards      = document.getElementById("Cards");
  var deck       = document.getElementById("Deck");
  var deckpos    = deck.getBoundingClientRect();
  var tablepos   = document.getElementById("Table").getBoundingClientRect();
  var sector     = Math.PI * 2 / _USERS.length;
  var finalAngle = sector * (user - _NUSER);
  var startW     = deckpos.width;
  var finalW     = 0.6 * startW;
  var startX     = deckpos.left;
  var startY     = deckpos.top;
  var finalX     = tablepos.left + tablepos.width  / 2 - Math.sin(finalAngle) * (tablepos.width  / 2 + 0.2 * tablepos.height) - finalW / 2    - finalW / _BRATIO;
  var finalY     = tablepos.top  + tablepos.height / 2 + Math.cos(finalAngle) * (tablepos.height / 2 + 0.2 * tablepos.height) - finalW * 0.75 - finalW / _BRATIO;
  var card;
  cards.innerHTML += `<div id="Card${cid}" class="card${user == _NUSER ? " mine" : ""}" onclick="select(this)"><img src="/resources/back.svg"/></div>`;
  card = document.getElementById(`Card${cid}`);
  if (hidden) {
    var z = 0;
    if (user != _NUSER) {
      for (var c of _CARDS) {
        if (c.UserID == _USERS[user].UserID) z++;
      }
    }
    card.style.zIndex = user == _NUSER ? document.getElementsByClassName("mine").length - 1 : -z;
  } else {
    card.style.zIndex = -1;
    for (mine of document.getElementsByClassName("mine")) {
      mine.style.zIndex = parseInt(mine.style.zIndex) + 1;
    }
  }
  for (var k = 0, anim = 10; k <= anim; k++) {
    var wm = !hidden ? (k - anim / 2) / (anim / 2) : 1;
    var a  = finalAngle * k / anim;
    var x  = startX + (finalX - startX) * k / anim;
    var y  = startY + (finalY - startY) * k / anim;
    var w  = startW + (finalW - startW) * k / anim;
    var h  = 1.5 * w;
    var bw = wm * w / _BRATIO;
    if (!hidden && k == Math.floor(anim / 2)) {
      card.getElementsByTagName("img")[0].src = _CID[cid];
    }
    card.style.width  = wm * w + "px";
    card.style.height = h  + "px";
    card.style.left   = x + "px";
    card.style.top    = y + "px";
    card.style.borderWidth = bw + "px";
    card.style.borderRadius = 2 * bw + "px";
    card.style.transform = `rotate(${a}rad)`;
    await sleep(_ANIMMS);
  }
  var n = 0;
  for (var c of _CARDS) if (c.DeckPosition !== null && c.DeckPosition < 0) n++;
  if (n > 1) displayDeck();
  animateFan(user, _USERS[user].HideCards == "0");
  animationMask(false);
}

async function animateTurn(user) {
  if (_STATEO) await _STATEO;
  var white = [ 0xFF, 0xFF, 0xFF ];
  var gold  = [ 0xFF, 0xD7, 0x00 ];
  var filters = document.getElementsByClassName("filter");
  var fo = null, fn;
  for (var filter of filters) {
    if (filter.getAttribute("fill-opacity") != "0") fo = filter;
    if (filter.id == "Filter" + user)               fn = filter;
  }
  var o = null;
  if (fo) o = document.getElementById("User" + fo.id.substring(6));
  var n = document.getElementById("User" + user);
  for (var k = 0, anim = 10; k <= anim; k++) {
    var opacity = k / anim;
    var ocolor = "#";
    var ncolor = "#";
    for (var i = 0; i < 3; i++) {
      var diff = white[i] - gold[i];
      var ot = "0" + Math.round(gold[i] + (anim - k) / anim * diff).toString(16);
      var nt = "0" + Math.round(gold[i] + k / anim * diff).toString(16);
      ocolor += ot.substring(ot.length - 2);
      ncolor += nt.substring(nt.length - 2);
    }
    if (fo) o.setAttribute("fill", ocolor);
    n.setAttribute("fill", ncolor);
    if (fo) fo.setAttribute("fill-opacity", 1 - opacity);
    fn.setAttribute("fill-opacity", opacity);
    await sleep(_ANIMMS);
  }
}

async function animateUno(user) {
  if (document.getElementById("UnoBubble" + user)) return;
  var cards  = document.getElementById("Cards");
  var bubble = document.createElement("div");
  bubble.id = "UnoBubble" + user;
  bubble.className = "infoBubble";
  bubble.innerHTML = `<div class="bubbleText">UNO!</div>`
                   + `<svg class="bubbleTail" width="25" height="25" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
                   + `<polygon points="5,0 25,0 2,25" fill="lightgrey"/>`
                   + `</svg>`;
  cards.appendChild(bubble);
  var table  = document.getElementById("Table").getBoundingClientRect();
  var angle  = Math.PI * 2 / _USERS.length * (user - _NUSER);

  bubble.style.left = table.left + table.width  / 2 - Math.sin(angle) * table.width  / 2.2 - 40 + "px";
  bubble.style.top  = table.top  + table.height / 2 + Math.cos(angle) * table.height / 2.2 - 75 + "px";

  for (var i = 0, anim = 10; i <= anim; i++) {
    var a = 6 * Math.PI / anim * i;
    bubble.style.transform = `rotate(${Math.sin(a) * (anim - i) / anim * 0.2}rad)`;
    await sleep(_ANIMMS);
  }
  await sleep(2000);
  bubble = document.getElementById("SigBubble" + user);
  bubble.parentElement.removeChild(bubble);
}

async function animateSig(user) {
  if (document.getElementById("SigBubble" + user)) return;
  var cards  = document.getElementById("Cards");
  var bubble = document.createElement("div");
  bubble.id = "SigBubble" + user;
  bubble.className = "infoBubble";
  bubble.innerHTML = `<div class="bubbleText">HA!</div>`
                   + `<svg class="bubbleTail" width="25" height="25" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
                   + `<polygon points="5,0 25,0 2,25" fill="lightgrey"/>`
                   + `</svg>`;
  cards.appendChild(bubble);
  var table  = document.getElementById("Table").getBoundingClientRect();
  var angle  = Math.PI * 2 / _USERS.length * (user - _NUSER);

  bubble.style.left = table.left + table.width  / 2 - Math.sin(angle) * table.width  / 2.2 - 40 + "px";
  bubble.style.top  = table.top  + table.height / 2 + Math.cos(angle) * table.height / 2.2 - 75 + "px";

  for (var i = 0, anim = 10; i <= anim; i++) {
    var a = 6 * Math.PI / anim * i;
    bubble.style.transform = `rotate(${Math.sin(a) * (anim - i) / anim * 0.2}rad)`;
    await sleep(_ANIMMS);
  }
  await sleep(2000);
  bubble = document.getElementById("SigBubble" + user);
  bubble.parentElement.removeChild(bubble);
}

async function animateFlipDeck() {
  animationMask(true);
  var cards = document.getElementById("Cards");
  var pdeck = document.getElementById("PlayDeck");
  var tableSize = document.getElementById("Table").getBoundingClientRect()
  var card;
  var deckSize  = 0;
  var tableSize;
  var bottom;
  var bshadow = "";
  var min = 0;
  var cid = 0;
  while (!(card = document.getElementById("AnimCard"))) {
    cards.innerHTML += `<div id="AnimCard" class="card"><img src="/resources/back.svg"/></div>`;
  }
  for (var c of _CARDS){
    if (c.DeckPosition < min) {
      min = c.DeckPosition;
      cid = c.CardID;
    }
    if (c.DeckPosition !== null && c.DeckPosition < 0) {
      deckSize++;
    }
  }
  pdeck.hidden = true;
  card.hidden  = false;
  card.getElementsByTagName("img")[0].src = _CID[cid];
  card.style.height = pdeck.style.height;
  card.style.width  = pdeck.style.width;
  card.style.top    = parseFloat(pdeck.style.top) + tableSize.top + "px";
  card.style.left   = parseFloat(pdeck.style.left) + tableSize.left + "px";
  card.style.borderRadius = pdeck.style.borderRadius;
  card.style.borderWidth  = pdeck.style.borderWidth;
  bottom = Math.floor(deckSize / 108 * 4 * parseFloat(pdeck.style.width) / _BRATIO)
  for (var i = 0; i < bottom; i++) {
    bshadow += `0 ${i}px 0 ${i % 2 ? 'white' : 'black'}, `;
  }
  card.style.boxShadow = bshadow.substring(0, bshadow.length - 2);

  var startX = parseFloat(card.style.left);
  var finalX = tableSize.width / 4 / (1 + 2 / _BRATIO) + tableSize.left;
  var startW = parseFloat(card.style.width);

  for (var k = 0, anim = 10; k <= anim; k++) {
    var w = startW * Math.abs(k - anim / 2) / (anim / 2);
    card.style.left  = startX + (finalX - startX) * k / anim + "px";
    card.style.width = w + "px";
    card.style.borderLeftWidth  = w / _BRATIO + "px";
    card.style.borderRightWidth = w / _BRATIO + "px";
    if (k == Math.floor(anim / 2)) {
      card.getElementsByTagName("img")[0].src = "/resources/back.svg";
    }
    bshadow = "";
    if (k <= Math.floor(anim / 2)) {
      for (var i = 0; i < bottom; i++) {
        bshadow += `${i * k / (anim / 2)}px ${i}px 0 ${i % 2 ? 'white' : 'black'}, `;
      }
    } else {
      for (var i = 0; i < bottom; i++) {
        bshadow += `${i * -(anim - k) / (anim / 2)}px ${i}px 0 ${i % 2 ? 'white' : 'black'}, `;
      }
    }
    card.style.boxShadow = bshadow.substring(0, bshadow.length - 2);

    await sleep(_ANIMMS);
  }

  displayDeck();
  animateTurnFirst();
  animationMask(false);
}