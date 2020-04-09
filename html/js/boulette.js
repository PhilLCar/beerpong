PARAMETER_GUESSTIME = 45;
PARAMETER_GAMETIME  = 60 * 60;
PARAMETER_NUNFOLDS  = 5;
PARAMETER_ANIMRESMS = 100;

STATUS_NOT_PAIRED = 0;
STATUS_PAIRED     = 1;
STATUS_TRYING     = 2;
STATUS_WAITING    = 4;
STATUS_PLAYING    = 8;
STATUS_GUESSING   = 16;
STATUS_ASKING     = 32;
STATUS_DONE       = 64;
STATUS_WRITING    = 128;
STATUS_ALL        = 1023;

GAME_STARTING  = 0;
GAME_TRIOS     = 1;
GAME_ROUND1    = 2;
GAME_ROUND2    = 4;
GAME_ROUND3    = 8;
GAME_CATCHOSE  = 16
GAME_WORDCHOSE = 32
GAME_PAUSED    = 64;
GAME_TIMEOUT   = 128;
GAME_FINISHED  = 256;

BUBBLE_PREVUNF  = -1;
BUBBLE_UNFOLD   = 0;
BUBBLE_POSX     = 0;
BUBBLE_POSY     = 0;
BUBBLE_SIZEX    = 0;
BUBBLE_SIZEY    = 0;
BUBBLE_GROWRATE = 25;
BUBBLE_MAXSIZE  = 100;

STATE_HOST     = false;
STATE_TURN     = 0;
STATE_SWITCH   = 0;
STATE_MYUSER   = null;
STATE_MYPAIR   = null;
STATE_STATUS   = 0;
STATE_LASTMID  = -1;
STATE_GAME     = 0;
STATE_LOCAL    = null;
STATE_TIME     = 0;
STATE_HIDDEN   = [];
STATE_USERS    = [];
STATE_PAIRS    = [];
STATE_CATS     = [];
STATE_ITEM     = null;
STATE_ITEMS    = [];
STATE_MEMPTY   = true;
STATE_MESSAGES = [];
STATE_QUIT     = false;

PUSH_PAIR     = null;
PUSH_MESSAGES = null;
PUSH_CAT      = null;
PUSH_ITEM     = null;
PUSH_ORDER    = false;
PUSH_TIME     = null;
PUSH_USERTURN = null;
PUSH_GAMETURN = null;
PUSH_REQITEM  = null;
PUSH_USEITEM  = null;
PUSH_SCORE    = null;
PUSH_CLEAR    = null;

BLOCKERS_PAIRING   = false;
BLOCKERS_CLEARFOR  = 0;
BLOCKERS_CATCHOSE  = 0;
BLOCKERS_PAUSED    = false;
BLOCKERS_ROUND1    = false;
BLOCKERS_ROUND2    = false;
BLOCKERS_ROUND3    = false;

/////////////////////////////////// UPDATE //////////////////////////////////////////////

function uState() {
    if (STATE_GAME & GAME_PAUSED) {
        if (!BLOCKERS_PAUSED) {
            if (STATE_HOST) STATE_LOCAL |= GAME_PAUSED;
            document.getElementById("Mask").hidden = true;
            document.getElementById("CatMask").hidden = true;
            document.getElementById("WordMask").hidden = true;
            document.getElementById("GameMask").hidden = true;
            document.getElementById("GuessMask").hidden = true;

            // Cancel all blockers
            BLOCKERS_PAIRING   = false;
            BLOCKERS_CLEARFOR  = 0;
            BLOCKERS_CATCHOSE  = 0;
            BLOCKERS_PAUSED    = true;
            BLOCKERS_ROUND1    = false;
            BLOCKERS_ROUND2    = false;
            BLOCKERS_ROUND3    = false;

            // Cancel all pushes
            PUSH_PAIR     = null;
            PUSH_MESSAGES = null;
            PUSH_CAT      = null;
            PUSH_ITEM     = null;
            PUSH_ORDER    = false;
            PUSH_TIME     = null;
            PUSH_USERTURN = null;
            PUSH_GAMETURN = null;
            PUSH_REQITEM  = null;
            PUSH_USEITEM  = null;
            PUSH_SCORE    = null;
            PUSH_CLEAR    = null;

            alert("Un utilisateur est parti, la partie est temporairement interrompue jusqu'à ce que les paires soient reformées!")
        }
    } else {
        BLOCKERS_PAUSED = false;
    }

    switch (STATE_GAME & ~GAME_TRIOS) {
        case GAME_TIMEOUT:
            alert("La partie n'a pas débutée avant le temps limite.");
            window.location = "index.php";
            return;
        case GAME_CATCHOSE:
            catChose();
            break;
        case GAME_WORDCHOSE:
            wordChose();
            break;
        case GAME_ROUND1:
            doRound(1);
            break;
        case GAME_ROUND2:
            doRound(2);
            break;
        case GAME_ROUND3:
            doRound(3);
            break;
    }
}

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
    var userHTML = (!(STATE_GAME & ~GAME_TRIOS) || (STATE_GAME & GAME_PAUSED)) ? "<div id=\"UnpairedTitle\">NON-PAIRÉ.E.S</div>" : "";

    for (var i = 0; i < STATE_PAIRS.length; i++) {
        var pair  = STATE_PAIRS[i];
        var userA = getUser(pair.UserA);
        var userB = getUser(pair.UserB);
        var userC = getUser(pair.UserC);

        pairHTML += "<div id=\"Pair" + i + "\" class=\"Pair\">" +
                    "<div class=\"PairTitle\" onclick=\"hidePair(" + i + ")\">" +
                        getPairStatusClass(pair) +
                        pair.PairName +
                    "<div class=\"PairTime\">" + getPairInfo(pair) + "</div>" +
                    "</div>" +
                    "<div class=\"PairItem" + (userA.UserName == USERNAME ? " Me" : "") + "\"" + (i in STATE_HIDDEN ? " hidden=\"true\"" : "" ) + ">" +
                        getUserStatusClass(userA) +
                        displayUser(userA) +
                        "<div class=\"PairScore\">" + userA.Score + " pts</div>" +
                    "</div>" +
                    "<div class=\"PairItem" + (userB.UserName == USERNAME ? " Me" : "") + "\"" + (i in STATE_HIDDEN ? " hidden=\"true\"" : "" ) + ">" +
                        getUserStatusClass(userB) +
                        displayUser(userB) +
                        "<div class=\"PairScore\">" + userB.Score + " pts</div>" +
                    "</div>" +
                    (userC == null ? "" :
                    "<div class=\"PairItem" + (userC.UserName == USERNAME ? " Me" : "") + "\"" + (i in STATE_HIDDEN ? " hidden=\"true\"" : "" ) + ">" +
                        getUserStatusClass(userC) +
                        displayUser(userC) +
                        "<div class=\"PairScore\">" + userC.Score + " pts</div>" +
                    "</div>") +
                    "</div>";
    }
    for (var i = 0; i < STATE_USERS.length; i++) {
        var user = STATE_USERS[i];
        if (!inPairs(user)) {
            userHTML += "<div class=\"User" + (user.UserName == USERNAME ? " Me\"" : "\" onclick=\"pair(" + i + ")\"") + ">" +
                            getUserStatusClass(user) +
                            displayUser(user) +
                        "</div>";
        }
    }
    var paired = document.getElementById("Paired");
    var unpaired = document.getElementById("Unpaired");
    if (STATE_HOST) {
        if ((~GAME_TRIOS & STATE_GAME) == GAME_STARTING) {
            if (STATE_GAME & 1) userHTML += "<div id=\"AllowTrios\" class=\"CButton Block\" onclick=\"allowTrios()\">Restreindre les trios</div>";
            else userHTML += "<div id=\"AllowTrios\" class=\"CButton Allow\" onclick=\"allowTrios()\">Permettre les trios</div>";
            userHTML += "<div id=\"StartGame\" class=\"CButton\" onclick=\"startGame()\">Commencer la partie</div>";
        } else if (STATE_GAME & GAME_PAUSED) {
            if (STATE_GAME & 1) userHTML += "<div id=\"AllowTrios\" class=\"CButton Block\" onclick=\"allowTrios()\">Restreindre les trios</div>";
            else userHTML += "<div id=\"AllowTrios\" class=\"CButton Allow\" onclick=\"allowTrios()\">Permettre les trios</div>";
            userHTML += "<div id=\"StartGame\" class=\"CButton\" onclick=\"unpauseGame()\">Rependre la partie</div>";
        }
    }
    if (STATE_HOST && (STATE_GAME & GAME_CATCHOSE) && !(STATE_GAME & GAME_PAUSED) && allDone()) {
        userHTML += "<div id=\"StartGame\" class=\"CButton\" onclick=\"choseWords()\">Choisir les mots</div>";
    }
    if (STATE_HOST && (STATE_GAME & GAME_WORDCHOSE) && !(STATE_GAME & GAME_PAUSED) && allDone()) {
        userHTML += "<div id=\"StartGame\" class=\"CButton\" onclick=\"round(1)\">Passer à la première ronde</div>";
    }
    if (STATE_HOST && (STATE_GAME & GAME_ROUND1) && !(STATE_GAME & GAME_PAUSED) && allDone()) {
        userHTML += "<div id=\"StartGame\" class=\"CButton\" onclick=\"round(2)\">Passer à la deuxième ronde</div>";
    }
    if (STATE_HOST && (STATE_GAME & GAME_ROUND2) && !(STATE_GAME & GAME_PAUSED) && allDone()) {
        userHTML += "<div id=\"StartGame\" class=\"CButton\" onclick=\"round(3)\">Passer à la ronde finale</div>";
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

function uCats() {
    var cats = document.getElementById("Categories");
    if (((STATE_GAME & GAME_CATCHOSE) || (STATE_GAME & GAME_WORDCHOSE)) && !(STATE_GAME & GAME_PAUSED)) {
        cats.hidden = false;
        var catsHTML = "<div id=\"CatTitle\">CATÉGORIES</div>";
        for (cat of STATE_CATS) {
            catsHTML += "<div class=\"CatItem" + (cat.UserName == USERNAME ? " Me" : "") + "\">" +
                            cat.CatName + "<div class=\"CatUser\">" + cat.UserName + "</div>" +
                        "</div>";
        }
        cats.innerHTML = catsHTML;
    } else {
        cats.hidden = true;
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
    STATE_TURN = game[1] | 0;
    STATE_TIME = game[2];

    if (STATE_LOCAL == null) STATE_LOCAL = STATE_GAME;
}

function getUsers(vars) {
    STATE_USERS = [];
    STATE_MYUSER = null;
    var n = 0;
    for (var i = 0; i < vars.length; i++) {
        var item = vars[i];
        if (item[0] == 'U') {
            var user = item.split(';');
            STATE_USERS[n++] = {
                "UserName": user[1],
                "Host": user[2],
                "UserStatus": user[3],
                "Score": user[4],
                "Turn": user[5]
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
                "UserC": pair[4],
                "Playing": pair[5]
            }
            if (pair[2] == USERNAME ||
                pair[3] == USERNAME ||
                pair[4] == USERNAME) {
                STATE_MYPAIR = n - 1;
            }
        }
    }
}

function getCats(vars) {
    STATE_CATS = [];
    if (!(STATE_GAME & GAME_CATCHOSE) && !(STATE_GAME & GAME_WORDCHOSE)) return;
    var n = 0;
    for (var item of vars) {
        if (item[0] == 'C') {
            var cat = item.split(';');
            var catname = cat[2];
            for (var i = 3; i < cat.length; i++) catname += ";" + cat[i];
            STATE_CATS[n++] = {
                "UserName": cat[1],
                "CatName": catname
            }
        }
    }
}

function getItems(vars) {
    STATE_ITEMS = [];
    if (!(STATE_GAME & GAME_WORDCHOSE) && 
        !(STATE_GAME & GAME_ROUND1)    && 
        !(STATE_GAME & GAME_ROUND2)    && 
        !(STATE_GAME & GAME_ROUND3))
        return;
    var n = 0;
    for (var item of vars) {
        if (item[0] == 'I') {
            var name = item.split(';');
            var itemname = name[2];
            for (var i = 3; i < name.length; i++) itemname += ";" + name[i];
            STATE_ITEMS[n++] = {
                "UserName": name[1],
                "Item": itemname
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
    var usera = getUser(pair.UserA);
    var userb = getUser(pair.UserB);

    if ((usera.UserStatus & STATUS_GUESSING) || 
        (usera.UserStatus & STATUS_ASKING)   ||
        (usera.UserStatus & STATUS_PLAYING)  || 
        (userb.UserStatus & STATUS_PLAYING)) 
        return "<div class=\"Status StatusPlaying\">J</div>";
    else if ((usera.UserStatus & STATUS_TRYING))
        return "<div class=\"Status StatusTrying\">?</div>";
    else if ((usera.UserStatus & STATUS_DONE) && (userb.UserStatus & STATUS_DONE))
        return "<div class=\"Status StatusDone\">F</div>";
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
    if (pair.Playing == 1) {
        return getRemainingTime();
    } else {
        var usera = getUser(pair.UserA);
        var userb = getUser(pair.UserB);
        var userc = getUser(pair.UserC);
        return (parseInt(usera.Score) + parseInt(userb.Score) + (userc ? parseInt(userc.Score) : 0)) + " pts";
    }
}

function getRemainingTime() {
    var time = PARAMETER_GUESSTIME - (new Date().getTime() - Date.parse(STATE_TIME)) / 1000;
    return secondsToTime(time);
}

function getTime(timestamp) {
    var date = new Date(timestamp);
    return date.getHours() + ":" + ("" + date.getMinutes()).padStart(2, '0');
}

function setStatus(status, enabled) {
    STATE_SWITCH &= ~status;
    STATE_SWITCH |= (STATE_STATUS & status) ^ (enabled ? status : 0);
}

function allDone() {
    var done = true;
    for (user of STATE_USERS) {
        if (user.UserStatus & STATUS_PAIRED) {
            done = done && (user.UserStatus & STATUS_DONE);
        }
    }
    return done;
}

/////////////////////////////////// SENDING //////////////////////////////////////////////

function sendWriting() {
    try {
        setStatus(STATUS_WRITING, document.getElementById("WriteBox").value != "");
    } catch {}
}

function sendCat() {
    var input = document.getElementById("CatsInput");
    PUSH_CAT = input.value;
    input.value = "";
}

function sendWord() {
    var input = document.getElementById("WordInput");
    PUSH_ITEM = input.value;
    input.value = "";
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

function unpauseGame() {
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
    STATE_LOCAL ^= GAME_PAUSED;
}

function quitGame() {
    STATE_QUIT = true;
}

function catChose() {
    if (BLOCKERS_CATCHOSE > 1) {
        return;
    } else if (BLOCKERS_CATCHOSE == 0) {
        var mask = document.getElementById("CatMask");
        mask.hidden = false;
        BLOCKERS_CATCHOSE = 1;
        setStatus(STATUS_PLAYING, true);
        setStatus(STATUS_WAITING, false);
    }
    var catsHTML = "<div id=\"CurentCatsTitle\">Catégories choisies jusqu'à présent:</div>";
    for (cat of STATE_CATS) {
        catsHTML += cat.CatName + "<br>";
        if (cat.UserName == USERNAME) {
            document.getElementById("CatMask").hidden = true;
            BLOCKERS_CATCHOSE = 2;
            setStatus(STATUS_DONE, true);
            setStatus(STATUS_PLAYING, false);
            return;
        }
    }
    document.getElementById("CurrentCats").innerHTML = catsHTML;
}

function choseWords() {
    STATE_LOCAL = GAME_WORDCHOSE;
}

function wordChose() {
    if (STATE_CATS.length > STATE_ITEMS.length) {
        document.getElementById("WordMask").hidden = false;
        document.getElementById("WordCat").innerHTML = STATE_CATS[STATE_ITEMS.length].CatName;
        setStatus(STATUS_PLAYING, true);
        setStatus(STATUS_DONE, false);
    } else {
        document.getElementById("WordMask").hidden = true;
        setStatus(STATUS_PLAYING, false);
        setStatus(STATUS_DONE, true);
    }
}

function round(r) {
    switch(r) {
        case 1:
            STATE_LOCAL = GAME_ROUND1;
            PUSH_ORDER  = true;
            break;
        case 2:
            STATE_LOCAL = GAME_ROUND2;
            PUSH_CLEAR  = true;
            break;
        case 3:
            STATE_LOCAL = GAME_ROUND3;
            PUSH_CLEAR  = true;
            break;
    }
}

function doRound(r) {
    var user  = null;
    var n     = null;
    var pair  = null;
    var total = 0;
    for (var i = 0; i < STATE_USERS.length; i++) {
        if (!user && STATE_USERS[i].Turn == STATE_TURN) {
            user = STATE_USERS[i];
            n = i;
        }
        total += parseInt(STATE_USERS[i].Score);
    }
    if (user) pair = inPairs(user);
    if (total == 2 * r * STATE_USERS.length && !(pair.Playing == 1)) {
        setStatus(STATUS_DONE, true);
        setStatus(STATUS_WAITING, false);
        setStatus(STATUS_GUESSING, false);
        setStatus(STATUS_ASKING, false);
        var mask1 = document.getElementById("GameMask");
        var mask2 = document.getElementById("GuessMask");
        if (!mask1.hidden) mask1.hidden = true;
        if (!mask2.hidden) mask2.hidden = true;
        switch (r) {
            case 1:
                if (!BLOCKERS_ROUND1) {
                    alert("La première ronde est terminée!");
                    BLOCKERS_ROUND1 = true;
                }
                break;
            case 2:
                if (!BLOCKERS_ROUND2) {
                    alert("La deuxième ronde est terminée!");
                    BLOCKERS_ROUND2 = true;
                }
                break;
            case 3:
                if (!BLOCKERS_ROUND3) {
                    alert("La partie est terminée!");
                    BLOCKERS_ROUND3 = true;
                }
                break;
        }
        return;
    }
    if (STATE_HOST && (n == null)) {
        PUSH_GAMETURN = STATE_TURN + 1;
    }
    if (n == STATE_MYUSER) {
        play(r);
    } else if (pair && (pair.UserA == USERNAME ||
                        pair.UserB == USERNAME ||
                        pair.UserC == USERNAME)) {
        guess();
    } else {
        var mask1 = document.getElementById("GameMask");
        var mask2 = document.getElementById("GuessMask");
        if (!mask1.hidden) mask1.hidden = true;
        if (!mask2.hidden) mask2.hidden = true;
        if (STATE_USERS[STATE_MYUSER].Turn <= STATE_TURN) {
            setStatus(STATUS_WAITING, true);
            setStatus(STATUS_GUESSING, false);
            setStatus(STATUS_ASKING, false);
            setStatus(STATUS_DONE, false);
        } else {
            setStatus(STATUS_DONE, true);
            setStatus(STATUS_WAITING, false);
            setStatus(STATUS_GUESSING, false);
            setStatus(STATUS_ASKING, false);
        }
    }
}

function play(round) {
    setStatus(STATUS_ASKING, true);
    setStatus(STATUS_DONE, false);
    setStatus(STATUS_WAITING, false);
    setStatus(STATUS_GUESSING, false);
    var mask1 = document.getElementById("GameMask");
    var mask2 = document.getElementById("GuessMask");
    var dialog1 = "Cliquez quand vous êtes prêt à commencer!";
    var dialog2;
    switch (round) {
        case 1:
            dialog2 = "Faites deviner le mot affiché comme vous voulez!";
            break;
        case 2:
            dialog2 = "Vous ne devez prononcer qu'un seul mot!";
            break;
        case 3:
            dialog2 = "Vous devez mimer!";
            break;
    }
    if (mask1.hidden) mask1.hidden = false;
    if (!mask2.hidden) mask2.hidden = true;
    if (STATE_PAIRS[STATE_MYPAIR].Playing == 1) {
        var time = getRemainingTime();
        var dialog = document.getElementById("GameDialogText");
        if (dialog.innerHTML != dialog2) dialog.innerHTML = dialog2;
        document.getElementById("GameTimer").innerHTML = time;
        document.getElementById("GameStartButton").hidden = true;
        document.getElementById("GameBoard").hidden = false;

        if (time == secondsToTime(0)) {
            PUSH_USERTURN = STATE_TURN + 1;
            PUSH_PAIR = {
                "PairName": STATE_PAIRS[STATE_MYPAIR].PairName,
                "PairStatus": "Playing",
                "Playing": 0
            }
            mask1.hidden = true;
        }

        if (!STATE_ITEM) {
            if (STATE_ITEMS.length == 0) {
                PUSH_REQITEM = true;
                bubbleReset();
                setTimeout(unfold, PARAMETER_ANIMRESMS);
            } else {
                if (STATE_ITEMS.length > 0) STATE_ITEM = STATE_ITEMS[0];
            }
        }
    } else {
        STATE_ITEM = null;
        var dialog = document.getElementById("GameDialogText");
        if (dialog.innerHTML != dialog1) dialog.innerHTML = dialog1;
        document.getElementById("GameTimer").innerHTML = secondsToTime(PARAMETER_GUESSTIME);
        document.getElementById("GameStartButton").hidden = false;
        document.getElementById("GameBoard").hidden = true;
        document.getElementById("GameOK").hidden = true;
    }
}

function guess() {
    setStatus(STATUS_GUESSING, true);
    setStatus(STATUS_DONE, false);
    setStatus(STATUS_WAITING, false);
    setStatus(STATUS_ASKING, true);
    var mask1 = document.getElementById("GuessMask");
    var mask2 = document.getElementById("GameMask");
    if (mask1.hidden) mask1.hidden = false;
    if (!mask2.hidden) mask2.hidden = true;
    if (STATE_PAIRS[STATE_MYPAIR].Playing == 1) {
        document.getElementById("GuessTimer").innerHTML = getRemainingTime();
        document.getElementById("GuessDialog").innerHTML = "C'est parti!";
    } else {
        document.getElementById("GuessTimer").innerHTML = secondsToTime(PARAMETER_GUESSTIME);
        document.getElementById("GuessDialog").innerHTML = "Préparez-vous à deviner!";
    }
}

function startTurn() {
    PUSH_TIME = getFormattedDate();
    PUSH_PAIR = {
        "PairName": STATE_PAIRS[STATE_MYPAIR].PairName,
        "PairStatus": "Playing",
        "Playing": 1
    }
}

function newWord(r) {
    document.getElementById("GameOK").hidden = true;
    document.getElementById("GameText").hidden = true;
    PUSH_SCORE = parseInt(STATE_USERS[STATE_MYUSER].Score) + 1;
    var total = 0;
    for (user of STATE_USERS) {
        total += parseInt(user.Score);
    }
    var round = 0;
    if (STATE_GAME & GAME_ROUND1) round = 1;
    if (STATE_GAME & GAME_ROUND2) round = 2;
    if (STATE_GAME & GAME_ROUND3) round = 3;
    if (total == 2 * round * STATE_USERS.length - 1) {
        PUSH_USERTURN = STATE_TURN + 1;
        PUSH_PAIR = {
            "PairName": STATE_PAIRS[STATE_MYPAIR].PairName,
            "PairStatus": "Playing",
            "Playing": 0
        }
    }
    PUSH_USEITEM = STATE_ITEM;
    STATE_ITEM = null;
}

function bubbleReset() {
    BUBBLE_PREVUNF = -1;
    BUBBLE_UNFOLD  = 0;
}

function unfold() {
    var bubble = document.getElementById("Bubble");
    if (BUBBLE_UNFOLD == BUBBLE_PREVUNF) {
        if (BUBBLE_SIZEX < BUBBLE_MAXSIZE) {
            BUBBLE_SIZEX += BUBBLE_GROWRATE / (1000 / PARAMETER_ANIMRESMS);
            BUBBLE_SIZEY += BUBBLE_GROWRATE / (1000 / PARAMETER_ANIMRESMS);
            bubble.style.left   = BUBBLE_POSX - (BUBBLE_SIZEX / 2) + "px";
            bubble.style.top    = BUBBLE_POSY - (BUBBLE_SIZEY / 2) + "px";
            bubble.style.width  = BUBBLE_SIZEX + "px";
            bubble.style.height = BUBBLE_SIZEY + "px";
        }
    } else {
        if (BUBBLE_UNFOLD == 0) {
            bubble.hidden = false;
        } else if (BUBBLE_UNFOLD >= PARAMETER_NUNFOLDS) {
            BUBBLE_UNFOLD  = 0;
            BUBBLE_PREVUNF = -1;
            bubble.hidden  = true;
            var text = document.getElementById("GameText");
            text.hidden = false;
            text.innerHTML = STATE_ITEM.Item;
            document.getElementById("GameOK").hidden = false;
            return;
        }
        BUBBLE_POSX = (Math.random() * 500) | 0;
        BUBBLE_POSY = (Math.random() * 500) | 0;
        BUBBLE_SIZEX = 1;
        BUBBLE_SIZEY = 1;
        bubble.style.left   = BUBBLE_POSX  + "px";
        bubble.style.top    = BUBBLE_POSY  + "px";
        bubble.style.width  = BUBBLE_SIZEX + "px";
        bubble.style.height = BUBBLE_SIZEY + "px";
        BUBBLE_PREVUNF = BUBBLE_UNFOLD;
    }
    setTimeout(unfold, PARAMETER_ANIMRESMS);
}

/////////////////////////////////// REFRESH //////////////////////////////////////////////
function update(n) {
    var xhttp = new XMLHttpRequest();
    var post = "";

    sendWriting();
    setStatus(1024, false);
    //////////// POST ////////////
    post = buildpost(post, "LobbyID", LOBBY_ID);
    post = buildpost(post, "LastMID", STATE_LASTMID)
    if (PUSH_PAIR) {
        post = buildpost(post, "PairStatus", PUSH_PAIR.PairStatus);
        post = buildpost(post, "PairName", PUSH_PAIR.PairName);
        post = buildpost(post, "UserB", PUSH_PAIR.UserB);
        post = buildpost(post, "Playing", PUSH_PAIR.Playing);
        PUSH_PAIR = null;
    }
    if (PUSH_MESSAGES) {
        post = buildpost(post, "Messages", PUSH_MESSAGES);
        PUSH_MESSAGES = null;
    }
    if (PUSH_CAT) {
        post = buildpost(post, "CatName", PUSH_CAT)
        post = buildpost(post, "CatNew", true);
        PUSH_CAT = null;
    }
    if (PUSH_ITEM) {
        post = buildpost(post, "CatName", STATE_CATS[STATE_ITEMS.length].CatName);
        post = buildpost(post, "Item", PUSH_ITEM)
        PUSH_ITEM = null;
    }
    if (PUSH_ORDER) {
        post = buildpost(post, "Order", true);
        PUSH_ORDER = false;
    }
    if (PUSH_TIME) {
        post = buildpost(post, "Timer", PUSH_TIME);
        PUSH_TIME = null
    }
    if (PUSH_GAMETURN != null) {
        post = buildpost(post, "GameTurn", PUSH_GAMETURN);
        PUSH_GAMETURN = null;
    }
    if (PUSH_USERTURN != null) {
        post = buildpost(post, "UserTurn", PUSH_USERTURN);
        PUSH_USERTURN = null;
    }
    if (PUSH_REQITEM) {
        post = buildpost(post, "RequestItem", PUSH_REQITEM);
        PUSH_REQITEM = null;
    }
    if (PUSH_USEITEM) {
        post = buildpost(post, "UsedItem", PUSH_USEITEM.Item);
        post = buildpost(post, "ItemUser", PUSH_USEITEM.UserName);
        PUSH_USERTURN = null;
    }
    if (PUSH_SCORE) {
        post = buildpost(post, "Score", PUSH_SCORE);
        PUSH_SCORE = null;
    }
    if (PUSH_CLEAR) {
        post = buildpost(post, "Clear", true);
        PUSH_CLEAR = null;
    }
    post = buildpost(post, "UserName", USERNAME);
    post = buildpost(post, "UserStatus", STATE_SWITCH);
    if (STATE_HOST && STATE_LOCAL != null && STATE_LOCAL != STATE_GAME && !(STATE_LOCAL & GAME_PAUSED)) {
        post = buildpost(post, "GameState", STATE_LOCAL);
    }
    if (STATE_HOST) {
        post = buildpost(post, "RemoveInactive", true);
    }
    if (STATE_QUIT) {
        post = buildpost(post, "Quit", true);
    }
    if (STATE_GAME & GAME_CATCHOSE || STATE_GAME & GAME_WORDCHOSE) {
        post = buildpost(post, "RequestCat", true);
    }
    if (STATE_GAME & GAME_WORDCHOSE) {
        post = buildpost(post, "RequestItems", true);
    }
    xhttp.onreadystatechange = async function() {
      if (this.readyState == 4 && this.status == 200) {
        var vars = this.responseText.split('`');
        getState(vars);
        getUsers(vars);
        getPairs(vars);
        getCats(vars)
        getItems(vars);
        getMessages(vars);

        uState();
        uGameTimer();
        uUsers();
        uPairs();
        uCats();
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
    return post + variable + "=" + encodeURIComponent(value);
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

// https://stackoverflow.com/questions/10730362/get-cookie-by-name
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }

  function getFormattedDate() {
    var date = new Date();
    var str = date.getFullYear() + "-" + 
             ((date.getMonth() + 1) + "").padStart(2, '0') + "-" + 
             (date.getDate() + "").padStart(2, '0') + " " + 
             (date.getHours() + "").padStart(2, '0') + ":" + 
             (date.getMinutes() + "").padStart(2, '0') + ":" + 
             (date.getSeconds() + "").padStart(2, '0');

    return str;
}

function secondsToTime(time) {
    var minutes = ((time / 60) | 0);
    var seconds = ((time % 60) | 0);
    if (minutes < 0) minutes = 0;
    if (seconds < 0) seconds = 0;
    minutes = minutes + "";
    seconds = seconds + "";
    return minutes + ":" + seconds.padStart(2, '0');
}