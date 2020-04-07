PARAMETER_GUESSTIME = 45;

STATUS_NOT_PAIRED = 0;
STATUS_PAIRED     = 1;
STATUS_TRYING     = 2;
STATUS_WAITING    = 4;
STATUS_PLAYING    = 8;
STATUS_GUESSING   = 16;
STATUS_ASKING     = 32;
STATUS_WRITING    = 64;

STATE_LASTMID  = -1;
STATE_GAME     = 0;
STATE_TIME     = 0;
STATE_USERS    = [];
STATE_PAIRS    = [];
STATE_MESSAGES = [];

function uGameTimer() {
    if (STATE_TIME) {
        var time = 15 * 60 - (new Date().getTime() - STATE_TIME) / 1000;
        var minutes = ((time / 60) | 0) + "";
        var seconds = ((time % 60) | 0) + "";
        document.getElementById("GlobalTime").innerHTML = minutes + ":" + seconds.padStart(2, '0');
    }
}

function uUsers() {
    var pairHTML = "<div id=\"PairedTitle\">PAIRÉ.E.S</div>";
    var userHTML = "<div id=\"UnpairedTitle\">NON-PAIRÉ.E.S</div>";

    var n = 0;
    for (pair of STATE_PAIRS) {
        pairHTML += "<div id=\"Pair" + n + "\" class=\"Pair\">" +
                    "<div class=\"PairTitle\" onclick=\"hidePair(" + n + ")\">" +
                        getPairStatusClass(pair) +
                        pair.PairName +
                    "<div class=\"PairTime\">" + getTime(pair) + "</div>" +
                    "</div>" +
                    "<div class=\"PairItem\">" +
                        getUserStatusClass(getUser(pair.UserA)) +
                        displayUser(getUser(pair.UserA)) +
                    "</div>" +
                    "<div class=\"PairItem\">" +
                        getUserStatusClass(getUser(pair.UserB)) +
                        displayUser(getUser(pair.UserB)) +
                    "</div>" +
                    (pair.UserC == "" ? "" :
                    "<div class=\"PairItem\">" +
                    getUserStatusClass(getUser(pair.UserC)) +
                        display(getUser(pair.UserC)) +
                    "</div>") +
                    "</div>";
        n++;
    }
    n=0;
    for (user of STATE_USERS) {
        if (!inPairs(user)) {
            userHTML += "<div class=\"User" + (user.UserName == USERNAME ? " Me\"" : "\" onclick=\"pair(" + n + ")\"") + ">" +
                            getUserStatusClass(user) +
                            displayUser(user) +
                        "</div>";
            n++;
        }
    }
    var paired = document.getElementById("Paired");
    var unpaired = document.getElementById("Unpaired");
    if (paired.innerHTML != pairHTML) paired.innerHTML = pairHTML;
    if (unpaired.innerHTML != userHTML) unpaired.innerHTML = userHTML;
}

function uMessages() {
    var messageHTML = "";
    for (message of STATE_MESSAGES) {
        messageHTML += "<div class=\"Message" + (message.UserName == USERNAME ? " Mine" : "") + "\">" +
                        "<div class=\"MessageTitle\">" + message.UserName + "</div>" +
                        "<div class=\"MessageTime\">" + getTimeMin(message.TimeSent) + "</div>" +
                            message.Content +
                        "</div>";
    }
    document.getElementById("MessageBox").innerHTML += messageHTML;
}

function pair(n) {
    var dialogHTML = "<div id=\"PairingDialog\">" +
                    + "Choisissez le nom de la paire que vous allez former avec " + STATE_USERS[n].UserName + ":<br>" +
                    + "<input id=\"PairingDialogInput\" type=\"text\"/>"
                    + "<input id=\"PairingDialogButton\" type=\"button\" value=\"OK!\" onclick=\"confirmPair(" + n + ")\"/>" +
                    + "</div>";

    var mask = document.getElementById("Mask");
    mask.innerHTML = dialogHTML;
    mask.hidden = false;
}

function confirmPair(n) {
    var mask = document.getElementById("Mask");
    mask.innerHTML = "";
    mask.hidden = true;
}

function getUsers(vars) {
    STATE_USERS = [];
    var n = 0;
    for (item of vars) {
        if (item[0] == 'U') {
            var user = item.split(';');
            STATE_USERS[n++] = {
                "UserName": user[1],
                "Host": user[2],
                "UserStatus": user[3],
                "Score": user[4]
            }
        }
    }
}

function getPairs(vars) {
    STATE_PAIRS = []
    var n = 0;
    for (item of vars) {
        if (item[0] == 'P') {
            var pair = item.split(';');
            STATE_USERS[n++] = {
                "PairName": pair[1],
                "UserA": pair[2],
                "UserB": pair[3],
                "UserC": pair[4]
            }
        }
    }
}

function getMessages(vars) {
    var n = STATE_MESSAGES.length;
    for (item of vars) {
        if (item[0] == 'M') {
            var message = item.split(';');
            var content = message[4];
            for (var i = 5; i < message.length; i++) content += ";" + message[i];
            STATE_MESSAGES[n++] = {
                "MessageID": message[1],
                "UserName": message[2],
                "TimeSent": message[3],
                "Content": content
            }
        }
    }
}

function inPairs(user) {
    for (pair of STATE_PAIRS) {
        if (user.UserName == pair.UserA ||
            user.UserName == pair.UserB ||
            user.UserName == pair.UserC)
            return pair;
    }
    return null;
}

function getUser(username) {
    for (user of STATE_USERS) {
        if (user.UserName == username) return user;
    }
    return null;
}

function getPairStatusClass(pair) {
    var user = getUser(pair.UserA);
    if ((user.UserStatus & STATUS_GUESSING) || (user.UserStatus & STATUS_ASKING)) 
        return "<div class=\"Status StatusPlaying\">J</div>";
    else return "<div class=\"Status StatusWaiting\">A</div>";
}

function getUserStatusClass(user) {
    if (user.UserStatus & STATUS_WRITING) {
        return "<div class=\"Status StatusWriting\">...</div>";
    } else if (user.UserStatus & STATUS_GUESSING) {
        return "<div class=\"Status StatusGuessing\">D</div>";
    } else if (user.UserStatus & STATUS_ASKING) {
        return "<div class=\"Status StatusAsking\">P</div>";
    } else if (user.UserStatus & STATUS_WAITING) {
        return "<div class=\"Status StatusWaiting\">A</div>";
    } else if (user.UserStatus & STATUS_TRYING) {
        return "<div class=\"Status StatusTrying\">?</div>";
    } else if (user.UserStatus == STATUS_NOT_PAIRED) {
        return "<div class=\"Status StatusUnpaired\">N</div>";
    }
    return "<div class=\"Status StatusUnknown\">U</div>"
}

function displayUser(user) {
    return user.UserName + (user.Host == 1 ? " (Hôte)" : "");
}

function getTime(pair) {
    var user = getUser(pair.UserA);
    if (user.UserStatus == STATUS_GUESSING || user.UserStatus == STATUS_ASKING) {
        var time = PARAMETER_GUESSTIME - (new Date().getTime() - STATE_TIME) / 1000;
        var minutes = ((time / 60) | 0) + "";
        var seconds = ((time % 60) | 0) + "";
        return minutes + ":" + seconds.padStart(2, '0');
    } else return "";
}

function getTimeMin(timestamp) {
    var date = Date.parse(timestamp);
    return date.getHours() + ":" + date.getMinutes();
}

function update() {
    uGameTimer();
    uUsers();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var vars = this.responseText.split('`');
        var game = vars[0].split(';');
        STATE_GAME = game[0];
        STATE_TIME = Date.parse(game[1]);
        getUsers(vars);
        getMessages(vars);
      }
    };
    xhttp.open("POST", "update.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var post = "";
    post = buildpost(post, "LobbyID", LOBBY_ID);
    post = buildpost(post, "LastMID", STATE_LASTMID)
    xhttp.send(post);
}

//////////////////////////////////////////////////////////////////////////////////////////////
function buildpost(post, variable, value) {
    if (post != "") post += "&";
    return post + variable + "=" + value;
}

function hidePair(pair) {
    var items = document.getElementById("Pair" + pair).getElementsByClassName("PairItem");

    for (let item of items) item.hidden = !item.hidden;
}