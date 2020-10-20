var _GAMEID = null;
var _USERNM = null;
var _USERID = -1;
var _SDELAY = 70000;
var _TURN   = 0;
var _STATE  = 0;
var _CARDS  = [];
var _USERS  = [];

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

/////////////////////////////////////////////////////////////////////////////////
async function getUserName() {
  var question;
  while (_USERID == -1) {
    if (getCookie("Language") == "FR") question = "Entrez votre nom:";
    else                               question = "Enter your name:";
    _USERNM = prompt(question, "");
    if (_USERNM == "") continue;
    var promise = new Promise(resolve => sendCommand("GET_USER_ID", { UserName: _USERNM }, resolve));
    promise.then(value => _USERID = value);
    await promise;
  }
  sendCommand("UPDATE", { Immediate: true }, update);
}

function update(info) {
  if (info) {
    var data = info.split(';');
    var nu = _USERS.length;
    var i  = 0;
    _STATE = data[i++];
    _TURN  = data[i++];
    _CARDS = [];
    while (data[i++] != 'U') {
      _CARDS.push({
        CardID: data[i++],
        UserID: data[i++],
        DeckPosition: data[i++]
      });
    }
    _USERS = []
    while (i < data.length) {
      _USERS.push({
        UserID: data[i++],
        UserName: decodeURIComponent(data[i++]),
        HideCards: data[i++]
      })
    }
    if (n != _USERS.length) {
      displayUsers();
    }
  }
  sendCommand("UPDATE", null, update);
}

function fitTable() {
  var table = document.getElementById("Table");
  var min = Math.min(window.innerHeight, window.innerWidth);
  table.style.width  = 0.7  * min + "px";
  table.style.height = 0.5  * min + "px";
  table.style.left   = window.innerWidth  / 2 - 0.35 * min + "px";
  table.style.top    = 0.2 * min + "px";
  displayUsers();
}

function displayUsers() {

}