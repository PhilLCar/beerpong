PARAMETER_WAITTIME = 15 * 60;
PARAMETER_TURNTIME =  5 * 60;
PARAMETER_ENDTIME  =  5 * 60;

GAME_WAITING  = 0;
GAME_STARTED  = 1;
GAME_PAUSED   = 2;
GAME_FINISHED = 3;
GAME_TIMEOUT  = 4;

STATUS_OFFLINE = 0;
STATUS_ONLINE  = 1;
STATUS_WRITING = 2;

PLAY_NONE    = 0;
PLAY_CAPTAIN = 1;
PLAY_USER    = 2;

STATE_TEAMS3    = false;
STATE_TIME      = null;
STATE_TIMEDIFF  = null;
STATE_PAUSETIME = null;
STATE_GAME      = 0;
STATE_TURN      = 0;
STATE_USERS     = [];
STATE_TEAMS     = [];
STATE_ME        = null;
STATE_MEMPTY    = true;
STATE_LASTMID   = 0;
STATE_MESSAGES  = [];
STATE_NOTIF     = 0;
STATE_NAMES     = null;
STATE_COLORS    = [];
STATE_CELLS     = [];
STATE_LOADED    = false;
STATE_CURRENT   = null;

PUSH_TEAMS3      = null;
PUSH_ASK         = null;
PUSH_MESSAGES    = null;
PUSH_STATUS      = 0;
PUSH_PAUSE       = false;
PUSH_UNPAUSE     = false;
PUSH_START       = false;
PUSH_QUIT        = false;
PUSH_TIMEOUT     = false;
PUSH_FINISH      = false;
PUSH_TEAMTURN    = null;
PUSH_GAMETURN    = null;
PUSH_COLOR       = null;
PUSH_NAMES       = null;
PUSH_ORDER       = null;
PUSH_REQCELLS    = false;
PUSH_TEAMPLAYING = null;
PUSH_PASS        = false;
PUSH_DISCOVER    = null;
PUSH_TENTATIVE   = null;
PUSH_SELECT      = null;

BLOCKERS_CAP   = false;
BLOCKERS_USER  = false;
BLOCKERS_PAUSE = false;
BLOCKERS_END   = false;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function wait() {
    if (STATE_ME && STATE_ME.Host) {
        var start = document.getElementById("StartButton");
        var three = document.getElementById("ThreeButton");
        if (start.hidden) start.hidden = false;
        if (three.hidden) three.hidden = false;
        if (PARAMETER_WAITTIME - STATE_TIME <= 0) PUSH_TIMEOUT = true;
    }
    if (STATE_TEAMS3) {
        var yellow = document.getElementById("TeamYellow");
        var button = document.getElementById("ThreeButton");
        var buttonHTML = (PARAMETER_LANG == "FR" ? "2 ÉQUIPES" : "2 TEAMS");
        if (yellow.hidden) yellow.hidden = false;
        if (button.innerHTML != buttonHTML) button.innerHTML = buttonHTML;
    } else {
        var yellow = document.getElementById("TeamYellow");
        var button = document.getElementById("ThreeButton");
        var buttonHTML = (PARAMETER_LANG == "FR" ? "3 ÉQUIPES" : "3 TEAMS");
        if (!yellow.hidden) yellow.hidden = true;
        if (button.innerHTML != buttonHTML) button.innerHTML = buttonHTML;
    }
    if (STATE_ME && !isNaN(STATE_ME.ColorID)) {
        var ask  = document.getElementById("AskButton");
        var nask = document.getElementById("NaskButton");
        if (getTeam(STATE_ME.ColorID).Captain == STATE_ME.UserName) {
            if (nask.hidden) nask.hidden = false;
            if (!ask.hidden) ask.hidden  = true;
        } else if (getTeam(STATE_ME.ColorID).Captain == "") {
            if (!nask.hidden) nask.hidden = true;
            if (ask.hidden) ask.hidden    = false;
        } else {
            if (!nask.hidden) nask.hidden = true;
            if (!ask.hidden) ask.hidden   = true;
        }
    }
}

function play() {
    PUSH_REQCELLS = true;
    if (!STATE_LOADED) {
        var gameboard = document.getElementById("GameBoard");
        var mask      = document.getElementById("Mask");
        var start     = document.getElementById("StartButton");
        var three     = document.getElementById("ThreeButton");
        var ask       = document.getElementById("AskButton");
        var nask      = document.getElementById("NaskButton");
        if (gameboard.hidden) gameboard.hidden = false;
        if (!mask.hidden)     mask.hidden      = true;
        if (!start.hidden)    start.hidden     = true;
        if (!three.hidden)    three.hidden     = true;
        if (!ask.hidden)      ask.hidden       = true;
        if (!nask.hidden)     nask.hidden      = true;
        if (STATE_ME.Host) {
            var pause = document.getElementById("PauseButton");
            var unpause   = document.getElementById("UnpauseButton");
            if (pause.hidden)    pause.hidden   = false;
            if (!unpause.hidden) unpause.hidden = true;
        }
        STATE_LOADED = true;
    }
    STATE_CURRENT = PLAY_NONE;
    var turn = document.getElementById("TurnButton");
    var finished = true;
    for (var i = 1; i < STATE_TEAMS.length; i++) {
        var team = STATE_TEAMS[i];
        if (team.ColorID == colorID("yellow") && !STATE_TEAMS3) continue;
        if (team) {
            if (team.Turn <= STATE_TURN) {
                finished = false;
                if (!team.Playing && STATE_USERNAME == team.Captain) {
                    STATE_CURRENT = PLAY_CAPTAIN;
                    if (PARAMETER_TURNTIME - STATE_TIME <= 0) sendTurn();
                    if (turn.hidden) turn.hidden = false;
                } else if (team.Playing && team.ColorID == STATE_ME.ColorID) {
                    STATE_CURRENT = PLAY_USER;
                    if (STATE_USERNAME == team.Captain) {
                        var pass = true;
                        for (var user of STATE_USERS) {
                            if (user.ColorID == team.ColorID && !user.Pass) {
                                pass = false;
                                break;
                            }
                        }
                        if (pass || PARAMETER_TURNTIME - STATE_TIME <= 0) sendTurn();
                    }
                    if (turn.hidden && !STATE_ME.Pass)      turn.hidden = false;
                    else if (!turn.hidden && STATE_ME.Pass) turn.hidden = true;
                } else {
                    if (!turn.hidden) turn.hidden = true;
                }
                break;
            }
        }
    }
    if (STATE_ME.Host && finished) {
        PUSH_GAMETURN = STATE_TURN + 1;
    }
}

function pause() {
    var gameboard = document.getElementById("GameBoard");
    var mask      = document.getElementById("Mask");
    var turn      = document.getElementById("TurnButton");
    if (!gameboard.hidden) gameboard.hidden = true;
    if (!mask.hidden)      mask.hidden      = true;
    if (!turn.hidden)      turn.hidden      = true;
    if (STATE_ME.Host) {
        var pause     = document.getElementById("PauseButton");
        var unpause   = document.getElementById("UnpauseButton");
        if (!pause.hidden)     pause.hidden     = true;
        if (unpause.hidden)    unpause.hidden   = false;
    }
    STATE_LOADED = false;
}

function timeout() {
    if (PARAMETER_LANG == "FR") alert("La partie n'a pas commencé avant le temps aloué");
    else                        alert("The game didn't start within the time limit");
    PUSH_QUIT = true;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function uState() {
    var time = document.getElementById("Timer");
    switch (STATE_GAME) {
        case GAME_WAITING:
            time.innerHTML = secondsToTime(PARAMETER_WAITTIME - STATE_TIME);
            wait();
            break;
        case GAME_STARTED:
            time.innerHTML = secondsToTime(PARAMETER_TURNTIME - STATE_TIME);
            play();
            break;
        case GAME_PAUSED:
            pause();
            break;
        case GAME_FINISHED:
            time.innerHTML = secondsToTime(PARAMETER_ENDTIME - STATE_TIME);
            //finish();
            break;
        case GAME_TIMEOUT:
            timeout();
            break;
    }
}

function uCells() {
    var remaining = document.getElementById("Remaining");
    var rtext = (PARAMETER_LANG == "FR" ? "Mots restants: " : "Remaining words: ");
    var r = 0;
    for (cell of STATE_CELLS) {
        if (cell.ColorID == STATE_ME.ColorID && !cell.Discovered) r++;
        var cellElem = document.getElementById("C" + cell.X + "" + cell.Y);
        cellElem.getElementsByClassName("Selectors").innerHTML = "";
        if (cell.Discovered) {
            var attrclass = "Cell C" + STATE_COLORS[cell.ColorID];
            if (cellElem.getAttribute("class") != attrclass) cellElem.setAttribute("class", attrclass);
        } else if (isCaptain(STATE_ME) && (STATE_COLORS[cell.ColorID] != "yellow" || STATE_TEAMS3)) {
            var attrclass = "Cell C" + STATE_COLORS[cell.ColorID];
            if (cellElem.getAttribute("class") != attrclass) cellElem.setAttribute("class", attrclass);
            if (cell.Tentative) {
                var sel = "<div class=\"Selector\">?</div>";
                var selectors = cellElem.getElementsByClassName("Selectors")[0];
                if (selectors.innerHTML != sel) selectors.innerHTML = sel;
            }
        } else {
            var attrclass = "Cell";
            if (cellElem.getAttribute("class") != attrclass) cellElem.setAttribute("class", attrclass);
        }
        var elem = cellElem.getElementsByClassName("Name")[0];
        if (elem.innerHTML != cell.Content) elem.innerHTML = cell.Content;
    }
    rtext += r;
    if (remaining.innerHTML != rtext) remaining.innerHTML = rtext;
}

function uUsers() {
    var lobby  = document.getElementById("LobbyList");
    var red    = document.getElementById("TeamRedList");
    var blue   = document.getElementById("TeamBlueList");
    var yellow = document.getElementById("TeamYellowList");
    var lobbyHTML  = "";
    var redHTML    = "";
    var blueHTML   = "";
    var yellowHTML = "";
    var host = (PARAMETER_LANG == "FR" ? "Hôte" : "Host");
    for (var selector of document.getElementsByClassName("Selectors")) selector.innerHTML = "";
    for (var user of STATE_USERS) {
        var userHTML = "<div class=\"User" + (user.UserName == STATE_USERNAME ? " Me" : "") + "\"" +
                        (user.UserName == STATE_USERNAME ? "" : " onclick=\"message('" + user.UserName + "')\"" ) + ">" +
                        "<div class=\"Status " + getStatus(user) + "\"></div>" +
                        "<div class=\"UserName\">" + user.UserName + (isCaptain(user) ? " (C)" : "") + (user.Host ? " (" + host + ")": "") + "</div>" +
                        "</div>";
        if (STATE_COLORS.length == 0 || isNaN(user.ColorID)) {
            lobbyHTML += userHTML;
        } else if (STATE_COLORS[user.ColorID] == "red") {
            redHTML += userHTML;
        } else if (STATE_COLORS[user.ColorID] == "blue") {
            blueHTML += userHTML;
        } else if (STATE_COLORS[user.ColorID] == "yellow") {
            yellowHTML += userHTML;
        }
        if (!isNaN(user.SX) && !isNaN(user.SY)) {
            var cell = document.getElementById("C" + user.SX + "" + user.SY);
            cell.getElementsByClassName("Selectors")[0].innerHTML += "<div class=\"Selector\">" + (user.UserName == STATE_USERNAME ? "+" : "X") + "</div>";
        }
    }

    if (lobby.innerHTML != lobbyHTML) lobby.innerHTML = lobbyHTML;
    if (red.innerHTML != redHTML) red.innerHTML = redHTML;
    if (blue.innerHTML != blueHTML) blue.innerHTML = blueHTML;
    if (yellow.innerHTML != yellowHTML) yellow.innerHTML = yellowHTML;
}

function uMessages() {
    var messages = document.getElementById("Messages");
    var notification = document.getElementById("MessageNotification");
    var len = STATE_MESSAGES.length;
    var messageHTML = "";
    if (document.getElementById("Chat").hidden) {
        if (len > 0) {
            STATE_NOTIF += len;
            notification.hidden = false;
            notification.innerHTML = STATE_NOTIF;
        }
    }
    for (var i = 0; i < len; i++) {
        var message = STATE_MESSAGES[i];
        if (STATE_MEMPTY) {
            messages.innerHTML = "";
            STATE_MEMPTY = false;
        }
        messageHTML += "<div class=\"Message" + (message.UserName == STATE_USERNAME ? " Mine" : "") + "\">" +
                        "<div class=\"MessageUser\">" + message.UserName + "</div>" +
                        "<div class=\"MessageTime\">" + getTime(message.TimeSent) + "</div>" +
                        "<div class=\"MessageContent\">" + message.Content + "</div>" +
                        "</div>";
    }
    if (messageHTML != "") {
        messages.scrollTop = 100000;
        messages.innerHTML += messageHTML;
    }
    STATE_MESSAGES = [];
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function getState(vars) {
    var state = vars[0].split(';');
    STATE_GAME = parseInt(state[0]);
    STATE_TURN = parseInt(state[1]);
    if (STATE_TIMEDIFF == null) getTimeSync(vars);
    STATE_TIME = (new Date().getTime() - Date.parse(state[2])) / 1000 - STATE_TIMEDIFF;
    STATE_TEAMS3 = state[3] == "1";
}

function getTimeSync(vars) {
    for (var item of vars) {
        if (item[0] == 'S') {
            var time = item.split(';');
            STATE_TIMEDIFF = (new Date().getTime() - Date.parse(time[1])) / 1000;
            return;
        }
    }
}

function getColors(vars) {
    for (var item of vars) {
        if (item[0] == 'C') {
            var color = item.split(';');
            STATE_COLORS[parseInt(color[1])] = color[2];
        }
    }
}

function getCells(vars) {
    if (STATE_CELLS.length < 25) {
        var n = 0;
        for (item of vars) {
            if (item[0] == 'X') {
                var cell = item.split(';');
                STATE_CELLS[n++] = {
                    "X": cell[1],
                    "Y": cell[2],
                    "Content": cell[3],
                    "ColorID": parseInt(cell[4]),
                    "Discovered": cell[5] == "1",
                    "Tentative": cell[6] == "1"
                };
            }
        }
    }
}

function getUsers(vars) {
    STATE_USERS = [];
    STATE_ME = null;
    var n = 0;
    for (var j = 1; j < vars.length; j++) {
        item = vars[j];
        if (item[0] == 'U') {
            var user = item.split(';');
            STATE_USERS[n] = {
                "UserName": user[1],
                "Host": user[2] == "1",
                "UserStatus": parseInt(user[3]),
                "SX": parseInt(user[4]),
                "SY": parseInt(user[5]),
                "ColorID" : parseInt(user[6]),
                "Pass": user[7] == "1"
            };
            if (user[1] == STATE_USERNAME) {
                STATE_ME = STATE_USERS[n];
            }
            n++;
        }
    }
}

function getTeams(vars) {
    STATE_TEAMS = [];
    var n = 0;
    for (var item of vars) {
        if (item[0] == 'T') {
            var team = item.split(';');
            STATE_TEAMS[n++] = {
                "ColorID": parseInt(team[1]),
                "Captain": team[2],
                "Playing": parseInt(team[3]),
                "Turn": parseInt(team[4])
            };
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
            };
            if ((0 | message[1]) > STATE_LASTMID) STATE_LASTMID = (0 | message[1]);
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function sendTeams3() {
    var yellow = document.getElementById("TeamYellow");
    var button = document.getElementById("ThreeButton");
    PUSH_TEAMS3 = !STATE_TEAMS3;
    if (PUSH_TEAMS3) {
        yellow.hidden = false;
        button.innerHTML = (PARAMETER_LANG == "FR" ? "2 ÉQUIPES" : "2 TEAMS");
    }
    else {
        yellow.hidden = true;
        button.innerHTML = (PARAMETER_LANG == "FR" ? "3 ÉQUIPES" : "3 TEAMS");
    }
}

function sendAsk() {
    PUSH_ASK = true;
}

function sendNask() {
    PUSH_ASK = false;
}

async function sendStart() {
    var red    = 0;
    var blue   = 0;
    var yellow = (STATE_TEAMS3 ? 0 : 3);
    for (var user of STATE_USERS) {
        if (!isNaN(user.ColorID)) {
            switch (STATE_COLORS[user.ColorID]) {
                case "red":
                    if (getTeam(user.ColorID).Captain == user.UserName) {
                        red |= 1;
                    } else {
                        red |= 2;
                    }
                    break;
                case "blue":
                    if (getTeam(user.ColorID).Captain == user.UserName) {
                        blue |= 1;
                    } else {
                        blue |= 2;
                    }
                    break;
                case "yellow":
                    if (getTeam(user.ColorID).Captain == user.UserName) {
                        yellow |= 1;
                    } else {
                        yellow |= 2;
                    }
                    break;
                default:
                    break;
            }
        }
    }
    if (red == 3 && blue == 3 && yellow == 3) {
        showDialog(PARAMETER_LANG == "FR" ? "La partie commence..." : "Game is starting...", false);
        getNames();
        for (var i = 0; i < 200 && !STATE_NAMES; i++) await sleep(10);
        if (!STATE_NAMES) {
            var error = (PARAMETER_LANG == "FR" ? 
                    "Impossible de récupérer la liste de mots!" :
                    "Impossible to fetch word list!");
            showError(error);
            return;
        }
        PUSH_ORDER = "";
        if (!STATE_TEAMS3){
            if (Math.random() < 0.5) PUSH_ORDER = "0;1";
            else                     PUSH_ORDER = "1;0";
        } else {
            var n = Math.random();
            if (n < 1/3) {
                if (Math.random() < 0.5) PUSH_ORDER = "0;1;2";
                else                     PUSH_ORDER = "0;2;1";
            } else if (n < 2/3) {
                if (Math.random() < 0.5) PUSH_ORDER = "1;0;2";
                else                     PUSH_ORDER = "1;2;0";
            } else {
                if (Math.random() < 0.5) PUSH_ORDER = "2;0;1";
                else                     PUSH_ORDER = "2;1;0";
            }
        }
        PUSH_NAMES = "";
        var l = 0;
        var r = 0;
        var b = 0;
        var y = 0;
        var c = [];
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 5; j++) {
                var x = null;
                while (x == null) {
                    var n = Math.floor(Math.random() * 25);
                    if (n < 1 && l < 1) {
                        x = colorID("black");
                        l++;
                    } else if (n < 9 && (r < 8 || (!STATE_TEAMS3 && PUSH_ORDER[0] == '0' && r < 9))) {
                        x = colorID("red");
                        r++;
                    } else if (n < 17 && (b < 8 || (!STATE_TEAMS3 && PUSH_ORDER[0] == '1' && b < 9))) {
                        x = colorID("blue");
                        b++;
                    } else if (y < 7 || (STATE_TEAMS3 && y < 8)) {
                        x = colorID("yellow");
                        y++;
                    }
                }
                var name = STATE_NAMES[Math.round(Math.random() * STATE_NAMES.length)].toUpperCase();
                while (c.includes(name)) name = STATE_NAMES[Math.round(Math.random() * STATE_NAMES.length)].toUpperCase();
                c[c.length] = name;
                if (PUSH_NAMES != "") PUSH_NAMES += "`";
                PUSH_NAMES += i + ";" + j + ";" + x + ";" + name;
            }
        }
        PUSH_START = true;
    } else {
        var error = (PARAMETER_LANG == "FR" ? 
                    "La partie ne peut pas commencer, assurez-vous que les équipes sont bien formées!" :
                    "The game can't start right now, make sure teams are well formed!");
        showError(error);
    }
}

function sendPause() {
    showDialog(PARAMETER_LANG == "FR" ? "La partie entre en pause..." : "Pausing...", false);
    PUSH_PAUSE = true;
}

function sendUnpause() {
    STATE_LOADED = false;
    showDialog(PARAMETER_LANG == "FR" ? "La partie reprend..." : "Unpausing...", false)
    PUSH_UNPAUSE = true;
}

function sendTurn() {
    if (STATE_CURRENT == PLAY_CAPTAIN) {
        PUSH_TEAMPLAYING = true;
        PUSH_PASS        = true;
    } else if (STATE_CURRENT == PLAY_USER) {
        if (isCaptain(STATE_ME)) {
            PUSH_TEAMPLAYING = false;
            PUSH_TEAMTURN = STATE_TURN + 1;
        } else {
            PUSH_PASS = true;
        }
    }
}

function sendQuit() {
    PUSH_QUIT = true;
}

function sendColor(color) {
    if (STATE_GAME == GAME_WAITING) PUSH_COLOR = colorID(color);
}

function sendMessage() {
    var input = document.getElementById("ChatInput");
    if (PUSH_MESSAGES) PUSH_MESSAGES += "`";
    else PUSH_MESSAGES = "";
    PUSH_MESSAGES += input.value;
    input.value = "";
}

function sendWriting() {
    try {
        setStatus(STATUS_WRITING, document.getElementById("ChatInput").value != "");
    } catch (e) {}
}

function select(x, y) {
    if (STATE_CURRENT == PLAY_CAPTAIN) {
        var cell;
        for (c of STATE_CELLS) {
            if (c.X == x && c.Y == y) {
                cell = c;
                break;
            }
        }
        if (STATE_ME.ColorID == cell.ColorID) {
            PUSH_TENTATIVE = x + ";" + y;
        } else {
            showError(PARAMETER_LANG == "FR" ? "Ce mot n'est pas à vous!" : "This word isn't yours!");
        }
    } else if (STATE_CURRENT == PLAY_USER) {
        var cell;
        for (c of STATE_CELLS) {
            if (c.X == x && c.Y == y) {
                cell = c;
                break;
            }
        }
        if (!cell.Discovered) {
            PUSH_SELECT = x + ";" + y;
        } else {
            showError(PARAMETER_LANG == "FR" ? "Ce mot est déjà découvert!" : "This word is already discovered!");
        }
    } else {
        showError(PARAMETER_LANG == "FR" ? "Ce n'est pas votre tour!" : "It's not your turn!");
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function update(n) {
    var xhttp = new XMLHttpRequest();
    var post = "";

    sendWriting();
    //////////// POST ////////////
    post = buildpost(post, "ID", STATE_ID);
    post = buildpost(post, "UserName", STATE_USERNAME);
    post = buildpost(post, "LastMID", STATE_LASTMID);
    if (PUSH_TEAMS3 != null) {
        post = buildpost(post, "Teams3", PUSH_TEAMS3);
        PUSH_TEAMS3 = null;
    }
    if (PUSH_ASK != null) {
        post = buildpost(post, "Ask", PUSH_ASK);
        post = buildpost(post, "AskColor", STATE_ME.ColorID);
        PUSH_ASK = null;
    }
    if (PUSH_COLOR) {
        post = buildpost(post, "Color", PUSH_COLOR);
        PUSH_COLOR = null;
    }
    if (PUSH_NAMES) {
        post = buildpost(post, "Names", PUSH_NAMES);
        PUSH_NAMES = null;
    }
    if (PUSH_ORDER) {
        post = buildpost(post, "Order", PUSH_ORDER);
        PUSH_ORDER = null;
    }
    if (PUSH_REQCELLS) {
        post = buildpost(post, "Cells", PUSH_REQCELLS);
        PUSH_REQCELLS = false;
    }
    if (PUSH_TEAMPLAYING) {
        post = buildpost(post, "Playing", PUSH_TEAMPLAYING);
        post = buildpost(post, "ColorID", STATE_ME.ColorID);
        PUSH_TEAMPLAYING = null;
    }
    if (PUSH_PASS) {
        post = buildpost(post, "Pass", PUSH_PASS);
        PUSH_PASS = false;
    }
    if (PUSH_SELECT) {
        post = buildpost(post, "Select", PUSH_SELECT);
        PUSH_SELECT = null;
    }
    if (PUSH_TENTATIVE) {
        post = buildpost(post, "Tentative", PUSH_TENTATIVE);
        PUSH_TENTATIVE = null;
    }
    if (PUSH_STATUS) {
        post = buildpost(post, "UserStatus", PUSH_STATUS);
        PUSH_STATUS = 0;
    }
    if (PUSH_MESSAGES) {
        post = buildpost(post, "Messages", PUSH_MESSAGES);
        PUSH_MESSAGES = null;
    }
    if (PUSH_PAUSE) {
        post = buildpost(post, "Pause", PUSH_PAUSE);
        PUSH_PAUSE = false;
    }
    if (PUSH_UNPAUSE) {
        post = buildpost(post, "Unpause", PUSH_UNPAUSE);
        PUSH_UNPAUSE = false;
    }
    if (PUSH_START) {
        post = buildpost(post, "Start", PUSH_START);
        PUSH_START = false;
    }
    if (PUSH_QUIT) {
        post = buildpost(post, "Quit", PUSH_QUIT);
        PUSH_QUIT = false;
    }
    if (PUSH_TIMEOUT) {
        post = buildpost(post, "Timeout", PUSH_TIMEOUT);
        PUSH_TIMEOUT = false;
    }
    if (PUSH_FINISH) {
        post = buildpost(post, "Finish", PUSH_FINISH);
        PUSH_FINISH = false;
    }
    if (PUSH_TEAMTURN) {
        post = buildpost(post, "TeamTurn", PUSH_TEAMTURN);
        post = buildpost(post, "ColorID", STATE_ME.ColorID);
        PUSH_TEAMTURN = null;
    }
    if (PUSH_GAMETURN) {
        post = buildpost(post, "GameTurn", PUSH_GAMETURN);
        PUSH_GAMETURN = null;
    }
    if (STATE_TIMEDIFF == null) {
        post = buildpost(post, "TimeSync", true);
    }
    if (STATE_COLORS.length == 0) {
        post = buildpost(post, "Colors", true);
    }
    if (STATE_ME && STATE_ME.Host) {
        post = buildpost(post, "Clear", true);
    }
    xhttp.onreadystatechange = async function() {
      if (this.readyState == 4 && this.status == 200) {
        var vars = this.responseText.split('`');
        if (vars[0] == 'F') {
            if (PARAMETER_LANG == "FR") alert("L'hôte a quitté la partie, elle va maintenant se terminer");
            else                        alert("The host has left the game, it will now end");
            window.location = "index.php";
            return;
        } else if (vars[0] == 'Q') {
            window.location = "index.php";
            return;
        }
        // get
        getState(vars);
        getColors(vars);
        getCells(vars);
        getUsers(vars);
        getTeams(vars);
        getMessages(vars);
        
        // u
        uState();
        uCells();
        uUsers();
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

function buildpost(post, variable, value) {
    if (post != "") post += "&";
    return post + variable + "=" + encodeURIComponent(value);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTime(timestamp) {
    var date = new Date(timestamp);
    return date.getHours() + ":" + ("" + date.getMinutes()).padStart(2, '0');
}

function getFormattedDate(date) {
    if (!date) date = new Date();
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

function checkEnter(event) {
    var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
    if (chCode == 13)  { // enter 
        event.preventDefault();
        sendMessage();
    }
}

function setStatus(status, enabled) {
    if (STATE_ME) {
        PUSH_STATUS &= ~status;
        PUSH_STATUS |= (STATE_ME.UserStatus & status) ^ (enabled ? status : 0);
    }
}

function getStatus(user) {
    if (!user) return "StatusOffline";
    if (user.UserStatus & STATUS_WRITING) return "StatusWriting";
    if (user.UserStatus & STATUS_ONLINE)  return "StatusOnline";
    return "StatusOffline";
}

function isCaptain(user) {
    if (STATE_TEAMS.length == 0 || isNaN(user.ColorID)) return false;
    return user.UserName == getTeam(user.ColorID).Captain;
}

function getTeam(colorID) {
    for (team of STATE_TEAMS) {
        if (team.ColorID == colorID) return team;
    }
}

function message(username) {
    if (document.getElementById("Chat").hidden) toggleChat();
    document.getElementById("ChatInput").value += "@" + username;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function expMin(component) {
    var expmin = document.getElementById(component + "ExpMin");
    var list   = document.getElementById(component + "List");
    if (expmin.innerHTML == "-") {
        list.hidden = true;
        expmin.innerHTML = "+";
        expmin.style.lineHeight = "1.1rem";
        expmin.style.bottom = "0.06rem";
    } else {
        list.hidden = false;
        expmin.innerHTML = "-";
        expmin.style.lineHeight = "0.85rem";
        expmin.style.bottom = "0.18rem";
    }
}

function toggleChat() {
    var chat = document.getElementById("Chat");
    var button = document.getElementById("MessageButtonText");
    if (chat.hidden) {
        chat.hidden = false;
        STATE_NOTIF = 0;
        document.getElementById("MessageNotification").hidden = true;
        if (PARAMETER_LANG == "FR") button.innerHTML = "Fermer";
        else button.innerHTML = "Collapse";
    } else {
        chat.hidden = true;
        button.innerHTML = "Messages";
    }
}

function getNames() {
    var xhttp = new XMLHttpRequest();
    var list  = (PARAMETER_LANG == "FR" ? "Francais.txt" : "English.txt");
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        STATE_NAMES = this.responseText.split('\n');
      }
    };
    xhttp.open("GET", "wordlists/" + list, true);
    xhttp.send();
}

function colorID(color) {
    for (var i = 1; i < STATE_COLORS.length; i++) {
        if (color == STATE_COLORS[i]) return i;
    }
}

function showError(message) {
    document.getElementById("InfoBubbleContent").innerHTML = message;
    document.getElementById("Error").hidden = false;
}

function closeError() {
    document.getElementById("Error").hidden = true;
}

function showDialog(message, button = true) {
    document.getElementById("Dialog").innerHTML = message;
    document.getElementById("DialogOK").hidden = !button;
    document.getElementById("Mask").hidden = false;
}

function closeDialog() {
    document.getElementById("Mask").hidden = true;
}