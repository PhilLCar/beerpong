D = [ `<div id="Center" class="dot"></div>`,
      `<div id="TopLeft" class="dot"></div><div id="BottomRight" class="dot"></div>`,
      `<div id="TopLeft" class="dot"></div><div id="Center" class="dot"></div><div id="BottomRight" class="dot"></div>`,
      `<div id="TopLeft" class="dot"></div><div id="TopRight" class="dot"></div><div id="BottomLeft" class="dot"></div><div id="BottomRight" class="dot"></div>`,
      `<div id="Center" class="dot"></div><div id="TopLeft" class="dot"></div><div id="TopRight" class="dot"></div><div id="BottomLeft" class="dot"></div><div id="BottomRight" class="dot"></div>`,
      `<div id="TopLeft" class="dot"></div><div id="TopRight" class="dot"></div><div id="CenterLeft" class="dot"></div><div id="CenterRight" class="dot"></div><div id="BottomLeft" class="dot"></div><div id="BottomRight" class="dot"></div>`
]
CONNECTED = false;
SESSIONID = "";
THROWID   = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function doNothing(dummy) {}

function sendCommand(command, args, callback) {
  var xhttp = new XMLHttpRequest();
  var post = "Command=" + command;

  if (SESSIONID !== null) post += "&SessionID=" + SESSIONID;

  if (args) {
    for (arg in args) {
      post += `&${arg}=${args[arg]}`;
    }
  }

  xhttp.timeout = 120000;
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

async function update(diceInfo) {
  if (diceInfo != "") {
    var dice = diceInfo.split(';');
    var d  = [];
    var dn = [];
    var ds = [];
    var roll     = document.getElementById("Roll");
    var diceHTML = document.getElementsByClassName("die");

    roll.onclick = null;

    SESSIONID = dice[0];
    CONNECTED = SESSIONID != "";
    for (var i = 0; i < 5; i++) {
      d.push (dice[2 + i * 3]);
      dn.push(dice[3 + i * 3]);
      ds.push(dice[4 + i * 3]);
    }
  
    for (var i = 0; i < 5; i++) {
      diceHTML[i].setAttribute("disabled", ds[i] == "1" ? "true" : "false");
    }
  
    if (THROWID != dice[1] && THROWID !== null) {
      for (var i = 0; i <= 50; i++) {
        var finished = true;

        for (var j = 0; j < 5; j++) {
          if (ds[j] == "0") {
            if (i < dn[j])       { diceHTML[j].innerHTML = D[Math.floor(Math.random() * 6)]; finished = false; }
            else if (i == dn[j]) { diceHTML[j].innerHTML = D[d[j]]; diceHTML[j].setAttribute("value", d[j]); }
          }
        }
        
        if (finished) break;
    
        await sleep(50);
      }
    } else {
      for (var i = 0; i < 5; i++) {
        diceHTML[i].innerHTML = D[d[i]];
      }
    }
    THROWID = dice[1];

    roll.onclick = rollDice;
  }
  if (CONNECTED) {
    sendCommand("UPDATE", {}, update);
    document.getElementById("DBButtons").hidden    = "true";
    document.getElementById("SessionID").innerHTML = "Session: " + SESSIONID;
  }
}

function disableDice(dice) {
  var disable = null;
  if (dice.getAttribute("disabled") == "true") disable = false;
  else                                         disable = true;
  if (!CONNECTED) dice.setAttribute("disabled", disable ? "true" : "false");
  else {
    var die = "D" + dice.id.substring(3) + "S";
    sendCommand("DISABLE", { Die: die, Value: disable ? "TRUE" : "FALSE" }, doNothing);
  }
}

function rollDice() {
  var diceHTML = document.getElementsByClassName("die");
  var d  = [];
  var dn = [];
  var ds = [];

  for (var i = 0; i < 5; i++) {
    ds.push(diceHTML[i].getAttribute("disabled"));
    if (ds[i] != "true") {
      d.push (Math.floor(Math.random() * 6));
      dn.push(Math.floor(Math.random() * 50));
    } else {
      d. push(document.getElementById("Die" + (i + 1)).getAttribute("value"));
      dn.push(0);
    }
  }
  if (CONNECTED) {
    sendCommand("ROLL", {
      D1: d[0], D1N: dn[0], D1S: ds[0],
      D2: d[1], D2N: dn[1], D2S: ds[1],
      D3: d[2], D3N: dn[2], D3S: ds[2],
      D4: d[3], D4N: dn[3], D4S: ds[3],
      D5: d[4], D5N: dn[4], D5S: ds[4],
    }, doNothing);
  } else {
    var diceInfo = ";";

    if (THROWID === null) THROWID = 0;
    diceInfo += THROWID + 1;
    for (var i = 0; i < 5; i++) {
      diceInfo += ";" + d[i] + ";" + dn[i] + ";" + (ds[i] == "true" ? "1" : "0");
    }
    update(diceInfo);
  }
}

function newSession() {
  THROWID = null;
  sendCommand("NEW_SESSION", {}, update);
}

function connect() {
  SESSIONID = prompt("Enter the session ID you want to join:", "").toUpperCase();
  THROWID = null;
  sendCommand("UPDATE", { Immediate: "true" }, update);
}