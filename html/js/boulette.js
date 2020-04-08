PARAMETER_GUESSTIME = 45;
PARAMETER_GAMETIME  = 60 * 60;

STATUS_NOT_PAIRED = 0;
STATUS_PAIRED     = 1;
STATUS_TRYING     = 2;
STATUS_WAITING    = 4;
STATUS_PLAYING    = 8;
STATUS_GUESSING   = 16;
STATUS_ASKING     = 32;
STATUS_DONE       = 64;
STATUS_WRITING    = 128;

GAME_STARTING = 0;
GAME_TRIOS    = 1;
GAME_ROUND1   = 2;
GAME_ROUND2   = 4;
GAME_ROUND3   = 8;
GAME_CATCHOSE = 16
GAME_PAUSED   = 32;
GAME_TIMEOUT  = 64;
GAME_FINISHED = 128;

STATE_HOST     = false;
STATE_LOCAL    = null;
STATE_SWITCH   = 0;
STATE_MYUSER   = null;
STATE_MYPAIR   = null;
STATE_STATUS   = 0;
STATE_LASTMID  = -1;
STATE_GAME     = 0;
STATE_TIME     = 0;
STATE_HIDDEN   = [];
STATE_USERS    = [];
STATE_PAIRS    = [];
STATE_MEMPTY   = true;
STATE_MESSAGES = [];
STATE_QUIT     = false;

PUSH_PAIR     = null;
PUSH_MESSAGES = null;

BLOCKERS_PAIRING  = false;
BLOCKERS_CLEARFOR = 0;

/////////////////////////////////// UPDATE //////////////////////////////////////////////

function uGameTimer() {
    if (STATE_TIME && ((~GAME_TRIOS & STATE_GAME) == GAME_STARTING)) {
        var time = PARAMETER_GAMETIME - (new Date().getTime() - Date.parse(STATE_TIME)) / 1000;
        var minutes = ((time / 60) | 0);
        var seconds = ((time % 60) | 0);
        if (minutes < 0) minutes = 0;
        if (seconds < 0) seconds = 0;
        if (minutes == 0 && seconds == 0) {
            if (STATE_HOST) STATE_LOCAL = GAME_TIMEOUT;
        }
        seconds = seconds + "";
        document.getElementById("GlobalTime").innerHTML = minutes + ":" + seconds.padStart(2, '0');
    } else {
        document.getElementById("GlobalTime").innerHTML = "";
    }
}

function uUsers() {
    var pairHTML = "<div id=\"PairedTitle\">PAIRÉ.E.S</div>";
    var userHTML = "<div id=\"UnpairedTitle\">NON-PAIRÉ.E.S</div>";

    var n = 0;
    for (var pair of STATE_PAIRS) {
        var userA = getUser(pair.UserA);
        var userB = getUser(pair.UserB);
        var userC = getUser(pair.UserC);

        pairHTML += "<div id=\"Pair" + n + "\" class=\"Pair\">" +
                    "<div class=\"PairTitle\" onclick=\"hidePair(" + n + ")\">" +
                        getPairStatusClass(pair) +
                        pair.PairName +
                    "<div class=\"PairTime\">" + getPairInfo(pair) + "</div>" +
                    "</div>" +
                    "<div class=\"PairItem" + (userA.UserName == USERNAME ? " Me" : "") + "\"" + (n in STATE_HIDDEN ? " hidden=\"true\"" : "" ) + ">" +
                        getUserStatusClass(userA) +
                        displayUser(userA) +
                        "<div class=\"PairScore\">" + userA.Score + " pts</div>" +
                    "</div>" +
                    "<div class=\"PairItem" + (userB.UserName == USERNAME ? " Me" : "") + "\"" + (n in STATE_HIDDEN ? " hidden=\"true\"" : "" ) + ">" +
                        getUserStatusClass(userB) +
                        displayUser(userB) +
                        "<div class=\"PairScore\">" + userB.Score + " pts</div>" +
                    "</div>" +
                    (userC == null ? "" :
                    "<div class=\"PairItem" + (userC.UserName == USERNAME ? " Me" : "") + "\"" + (n in STATE_HIDDEN ? " hidden=\"true\"" : "" ) + ">" +
                        getUserStatusClass(userC) +
                        displayUser(userC) +
                        "<div class=\"PairScore\">" + userC.Score + " pts</div>" +
                    "</div>") +
                    "</div>";
        n++;
    }
    n=0;
    for (var user of STATE_USERS) {
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
    if (STATE_HOST && ((~GAME_TRIOS & STATE_GAME) == GAME_STARTING)) {
        if (STATE_GAME & 1) userHTML += "<div id=\"AllowTrios\" class=\"CButton Block\" onclick=\"allowTrios()\">Restreindre les trios</div>";
        else userHTML += "<div id=\"AllowTrios\" class=\"CButton Allow\" onclick=\"allowTrios()\">Permettre les trios</div>";
        userHTML += "<div id=\"StartGame\" class=\"CButton\" onclick=\"startGame()\">Commencer la partie</div>";
    }
    userHTML += "<div id=\"QuitGame\" class=\"CButton\" onclick=\"quitGame()\">Quitter la partie</div>";
    if (paired.innerHTML != pairHTML) paired.innerHTML = pairHTML;
    if (unpaired.innerHTML != userHTML) unpaired.innerHTML = userHTML;
}

function uPairs() {
    var me = STATE_USERS[STATE_MYUSER];
    var mypair = STATE_PAIRS[STATE_MYPAIR];
    if (me && mypair && (me.UserStatus & STATUS_TRYING) && (BLOCKERS_CLEARFOR == 0)) {
        if (USERNAME == mypair.UserA) {
            if (mypair.UserC == "") pairWait(mypair.UserB);
            else pairWait(mypair.UserB);
        } else if (USERNAME == mypair.UserB) {
            if (mypair.UserC == "") pairAsked(mypair.PairName, mypair.UserA, null);
            else pairWait(mypair.UserB);
        } else {
            pairAsked(mypair.PairName, mypair.UserA, mypair.userB);
        }
    } else if (!BLOCKERS_PAIRING) {
        clearDialog();
        if (BLOCKERS_CLEARFOR > 0) BLOCKERS_CLEARFOR--;
    }
}

function uMessages() {
    var messages = document.getElementById("MessageBox");
    var messageHTML = "";
    for (var message of STATE_MESSAGES) {
        if (STATE_MEMPTY) {
            messages.innerHTML = "";
            STATE_MEMPTY = false;
        }
        messageHTML += "<div class=\"Message" + (message.UserName == USERNAME ? " Mine" : "") + "\">" +
                        "<div class=\"MessageTitle\">" + message.UserName + "</div>" +
                        "<div class=\"MessageTime\">" + getTime(message.TimeSent) + "</div>" +
                            message.Content +
                        "</div>";
    }
    messages.innerHTML += messageHTML;
    if (messageHTML != "")  messages.scrollTop = 100000;
    STATE_MESSAGES = [];
}

/////////////////////////////////// STATE //////////////////////////////////////////////

function getState(vars) {
    if (vars[0][0] == 'F') {
        alert("L'hôte a quitté la partie, elle va maintenant se terminer.");
        window.location = "index.php";
        return;
    } else if (vars[0][0] == 'Q') {
        window.location = "index.php";
        return;
    }
    var game = vars[0].split(';');
    STATE_GAME = game[0] | 0;
    STATE_TIME = game[1];

    if (STATE_LOCAL == null) STATE_LOCAL = STATE_GAME;

    switch (STATE_GAME & ~GAME_TRIOS) {
        case GAME_TIMEOUT:
            alert("La partie n'a pas débutée avant le temps limite.");
            window.location = "index.php";
            return;
    }
}

function getUsers(vars) {
    STATE_USERS = [];
    STATE_MYUSER = null;
    var n = 0;
    for (var item of vars) {
        if (item[0] == 'U') {
            var user = item.split(';');
            STATE_USERS[n++] = {
                "UserName": user[1],
                "Host": user[2],
                "UserStatus": user[3],
                "Score": user[4]
            }
            if (user[1] == USERNAME) {
                STATE_MYUSER = n - 1;
                STATE_HOST   = user[2] == "1";
                STATE_STATUS = user[3];
                STATE_SWITCH = 0;
            }
        }
    }
}

function getPairs(vars) {
    STATE_PAIRS = []
    STATE_MYPAIR = null;
    var n = 0;
    for (var item of vars) {
        if (item[0] == 'P') {
            var pair = item.split(';');
            STATE_PAIRS[n++] = {
                "PairName": pair[1],
                "UserA": pair[2],
                "UserB": pair[3],
                "UserC": pair[4]
            }
            if (pair[2] == USERNAME ||
                pair[3] == USERNAME ||
                pair[4] == USERNAME) {
                STATE_MYPAIR = n - 1;
            } else {
                STATE_MYPAIR = null;
            }
        }
    }
}

function getMessages(vars) {
    var n = STATE_MESSAGES.length;
    for (var j = 1; j < vars.length; j++) {
        item = vars[j];
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
            if ((0 | message[1]) > STATE_LASTMID) STATE_LASTMID = (0 | message[1]);
        }
    }
}

/////////////////////////////////// PAIRING //////////////////////////////////////////////

function pair(n) {
    if (STATE_MYPAIR != null && !(STATE_GAME & 1)) {
        alert("Vous faites déjà partie d'une paire!");
        return;
    } else if (STATE_USERS[n].UserStatus != 0) {
        alert("Impossible de former une paire avec cet utilisateur pour l'instant!");
        return;
    }
    var dialogHTML;
    if (STATE_MYPAIR != null) {
        dialogHTML = "<div id=\"PairingDialog\">" +
                        "Voulez-vous former un trio avec avec <b>" + STATE_USERS[n].UserName + "</b>?<br>" +
                        "<input id=\"PairingDialogOK\" type=\"button\" value=\"OK!\" onclick=\"pairConfirm(" + n + ")\"/>" +
                        "<input id=\"PairingDialogCancel\" type=\"button\" value=\"Annuler\" onclick=\"clearDialog();PAIRING=false\"/>" +
                        "</div>";
    } else {
        dialogHTML = "<div id=\"PairingDialog\">" +
                        "Choisissez le nom de la paire que vous allez former avec <b>" + STATE_USERS[n].UserName + "</b>:<br>" +
                        "<input id=\"PairingDialogInput\" type=\"text\"/><br>" +
                        "<input id=\"PairingDialogOK\" type=\"button\" value=\"OK!\" onclick=\"pairConfirm(" + n + ")\"/>" +
                        "<input id=\"PairingDialogCancel\" type=\"button\" value=\"Annuler\" onclick=\"clearDialog();BLOCKERS_PAIRING=false\"/>" +
                        "</div>";
    }
    var mask = document.getElementById("Mask");
    mask.innerHTML = dialogHTML;
    mask.hidden = false;
    BLOCKERS_PAIRING = true;
}

function pairWait(username) {
    var dialogHTML = "<div id=\"PairingDialog\">" +
                    "En attente de la réponse de <b>" + username + "</b>..." +
                    "</div>";

    var mask = document.getElementById("Mask");
    if (mask.innerHTML != dialogHTML) mask.innerHTML = dialogHTML;
    mask.hidden = false;
}

function pairAsked(pairname, username, userb) {
    var dialogHTML = "<div id=\"PairingDialog\">" +
                    (userb == null ? "<b>" + username + "</b> veut former la paire '<b>" + pairname + "</b>' avec vous!<br>" :
                    "<b>" + username + "</b> et <b>" + userb + "</b> veulent former le trio '<b>" + pairname + "</b>' avec vous!<br>") +
                    "<input id=\"PairingDialogOK\" type=\"button\" value=\"Accepter!\" onclick=\"pairAccept('" + pairname + "')\"/>" +
                    "<input id=\"PairingDialogCancel\" type=\"button\" value=\"Refuser\" onclick=\"pairDeny('" + pairname + "')\"/>" +
                    "</div>";

    var mask = document.getElementById("Mask");
    if (mask.innerHTML != dialogHTML) mask.innerHTML = dialogHTML;
    mask.hidden = false;
}

function pairAccept(pairname) {
    PUSH_PAIR = {
        "PairName": pairname,
        "PairStatus": "Confirm"
    }
    clearDialog();
    BLOCKERS_CLEARFOR = 2;
}

function pairDeny(pairname) {
    PUSH_PAIR = {
        "PairName": pairname,
        "PairStatus": (STATE_PAIRS[STATE_MYPAIR].UserC != "" ? "NotC" : "Delete")
    }
    clearDialog();
    BLOCKERS_CLEARFOR = 2;
}

function pairConfirm(n) {
    var input;
    if (STATE_MYPAIR != null) {
        input = STATE_PAIRS[STATE_MYPAIR].PairName;
    } else {
        input = document.getElementById("PairingDialogInput").value;
    }
    if (input.value == "") {
        alert("Le nom de paire ne peut pas être vide!");
    }

    PUSH_PAIR = {
        "PairName": input,
        "UserName" : USERNAME,
        "UserB" : STATE_USERS[n].UserName,
        "PairStatus" : (STATE_MYPAIR != null ? "Append" : "New")
    }
    BLOCKERS_PAIRING = false;
    pairWait(STATE_USERS[n].UserName);
}

/////////////////////////////////// GETTERS //////////////////////////////////////////////

function getUser(username) {
    for (var user of STATE_USERS) {
        if (user.UserName == username) return user;
    }
    return null;
}

function getPairStatusClass(pair) {
    var user = getUser(pair.UserA);
    if ((user.UserStatus & STATUS_GUESSING) || (user.UserStatus & STATUS_ASKING)) 
        return "<div class=\"Status StatusPlaying\">J</div>";
    else if ((user.UserStatus & STATUS_TRYING))
        return "<div class=\"Status StatusTrying\">?</div>";
    else return "<div class=\"Status StatusWaiting\">A</div>";
}

function getUserStatusClass(user) {
    if (user.UserStatus & STATUS_WRITING) {
        return "<div class=\"Status StatusWriting\">...</div>";
    } else if (user.UserStatus & STATUS_DONE) {
        return "<div class=\"Status StatusDone\">F</div>";
    } else if (user.UserStatus & STATUS_GUESSING) {
        return "<div class=\"Status StatusGuessing\">D</div>";
    } else if (user.UserStatus & STATUS_ASKING) {
        return "<div class=\"Status StatusAsking\">P</div>";
    } else if (user.UserStatus & STATUS_PLAYING) {
        return "<div class=\"Status StatusPlaying\">J</div>";
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

function getPairInfo(pair) {
    var user = getUser(pair.UserA);
    if (user.UserStatus == STATUS_GUESSING || user.UserStatus == STATUS_ASKING) {
        var time = PARAMETER_GUESSTIME - (new Date().getTime() - STATE_TIME) / 1000;
        var minutes = ((time / 60) | 0) + "";
        var seconds = ((time % 60) | 0) + "";
        return minutes + ":" + seconds.padStart(2, '0');
    } else {
        var userb = getUser(pair.UserB);
        var userc = getUser(pair.UserC);
        return (parseInt(user.Score) + parseInt(userb.Score) + (userc ? parseInt(userc.Score) : 0)) + " pts";
    }
}

function getTime(timestamp) {
    var date = new Date(timestamp);
    return date.getHours() + ":" + ("" + date.getMinutes()).padStart(2, '0');
}

function setStatus(status, enabled) {
    STATE_SWITCH &= ~status;
    STATE_SWITCH |= (STATE_STATUS & status) ^ (enabled ? status : 0);
}

/////////////////////////////////// SENDING //////////////////////////////////////////////

function sendWriting() {
    try {
        setStatus(STATUS_WRITING, document.getElementById("WriteBox").value != "");
    } catch {}
}


function sendMessage() {
    if (PUSH_MESSAGES) PUSH_MESSAGES += "`";
    else PUSH_MESSAGES = "";
    PUSH_MESSAGES += document.getElementById("WriteBox").value;
    document.getElementById("WriteBox").value = "";
}

/////////////////////////////////// GAME //////////////////////////////////////////////

function startGame() {
    var ready = true;
    for (var user of STATE_USERS) {
        if (inPairs(user)) continue;
        if ((user.UserStatus & ~STATUS_WRITING) != STATUS_NOT_PAIRED) continue;
        ready = false;
        break;
    }
    if (!ready) {
        alert("Tous les utilisateurs ne sont pas en paire!");
        return;
    }
    STATE_LOCAL = GAME_CATCHOSE;
}

function quitGame() {
    STATE_QUIT = true;
}

/////////////////////////////////// REFRESH //////////////////////////////////////////////
function update(n) {
    var xhttp = new XMLHttpRequest();
    var post = "";

    sendWriting();
    //////////// POST ////////////
    post = buildpost(post, "LobbyID", LOBBY_ID);
    post = buildpost(post, "LastMID", STATE_LASTMID)
    if (PUSH_PAIR) {
        post = buildpost(post, "PairStatus", PUSH_PAIR.PairStatus);
        post = buildpost(post, "PairName", encodeURIComponent(PUSH_PAIR.PairName));
        post = buildpost(post, "UserB", encodeURIComponent(PUSH_PAIR.UserB));
        PUSH_PAIR = null;
    }
    if (PUSH_MESSAGES) {
        post = buildpost(post, "Messages", encodeURIComponent(PUSH_MESSAGES));
        PUSH_MESSAGES = null;
    }
    post = buildpost(post, "UserName", encodeURIComponent(USERNAME));
    post = buildpost(post, "UserStatus", STATE_SWITCH);
    if (STATE_HOST && STATE_LOCAL != null && STATE_LOCAL != STATE_GAME) {
        post = buildpost(post, "GameState", STATE_LOCAL);
        post = buildpost(post, "Timer", encodeURIComponent(STATE_TIME));
    }
    if (STATE_HOST) {
        post = buildpost(post, "RemoveInactive", true);
    }
    if (STATE_QUIT) {
        post = buildpost(post, "Quit", true);
    }
    xhttp.onreadystatechange = async function() {
      if (this.readyState == 4 && this.status == 200) {
        var vars = this.responseText.split('`');
        getState(vars);
        getUsers(vars);
        getPairs(vars);
        getMessages(vars);

        uGameTimer();
        uUsers();
        uPairs();
        uMessages();

        await sleep(n);
        update(n);
      } else if (this.readyState == 4) {
        await sleep(n);
        update(n);
      }
    };
    xhttp.open("POST", "update.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(post);
}

////////////////////////////////////////// UTILS ////////////////////////////////////////////////////
function buildpost(post, variable, value) {
    if (post != "") post += "&";
    return post + variable + "=" + value;
}

function hidePair(pair) {
    var items = document.getElementById("Pair" + pair).getElementsByClassName("PairItem");
    if (pair in STATE_HIDDEN) {
        var hidden = [];
        var j = 0;
        for (var i = 0; i < STATE_HIDDEN.length; i++) {
            if (STATE_HIDDEN[i] == pair) continue;
            hidden[j++] = STATE_HIDDEN[i];
        }
        STATE_HIDDEN = hidden;
    } else {
        STATE_HIDDEN[STATE_HIDDEN.length] = pair;
    }
    for (let item of items) item.hidden = !item.hidden;
}

function inPairs(user) {
    for (var pair of STATE_PAIRS) {
        if (user.UserName == pair.UserA ||
            user.UserName == pair.UserB ||
            user.UserName == pair.UserC)
            return pair;
    }
    return null;
}

function allowTrios() {
    STATE_LOCAL ^= 1;
    document.getElementById("AllowTrios").style.backgroundColor = "black";
}

function clearDialog() {
    var mask = document.getElementById("Mask");
    mask.innerHTML = "";
    mask.hidden = true;
}

function checkEnter(event) {
    var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
    if (chCode == 13)  { // enter 
        sendMessage();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}