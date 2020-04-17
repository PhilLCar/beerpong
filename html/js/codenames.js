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

PUSH_MESSAGES  = null;
PUSH_STATUS    = 0;
PUSH_PAUSE     = false;
PUSH_UNPAUSE   = false;
PUSH_START     = false;
PUSH_QUIT      = false;
PUSH_TIMEOUT   = false;
PUSH_FINISH    = false;
PUSH_TEAMTURN  = null;
PUSH_GAMETURN  = null;

BLOCKERS_PAUSE = false;
BLOCKERS_END   = false;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function uState() {
    var time = document.getElementById("Timer");
    switch (STATE_GAME) {
        case GAME_WAITING:
            time.innerHTML = secondsToTime(PARAMETER_WAITTIME - STATE_TIME);
            //wait();
            break;
        case GAME_STARTED:
            time.innerHTML = secondsToTime(PARAMETER_GAMETIME - STATE_TIME);
            //play();
            break;
        case GAME_PAUSED:
            //pause();
            break;
        case GAME_FINISHED:
            time.innerHTML = secondsToTime(PARAMETER_ENDTIME - STATE_TIME);
            //finish();
            break;
        case GAME_TIMEOUT:
            //timeout();
            break;
    }
}

function uUsers() {
    for (var user of STATE_USERS) {
        
    }
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
                "ColorID" : parseInt(user[6])
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
    for (var item of vars) {
        if (item[0] == 'T') {
            var team = item.split(';');
            STATE_TEAMS[parseInt(team[1])] = {
                "Captain": team[2],
                "Playing": team[3] == "1",
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function update(n) {
    var xhttp = new XMLHttpRequest();
    var post = "";

    sendWriting();
    //////////// POST ////////////
    post = buildpost(post, "ID", STATE_ID);
    post = buildpost(post, "UserName", STATE_USERNAME);
    post = buildpost(post, "LastMID", STATE_LASTMID);
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
        post = buildpost(post, "TeamTurn", PUSH_USERTURN);
        PUSH_USERTURN = null;
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
        getUsers(vars);
        getTeams(vars);
        getMessages(vars);
        
        // u
        //uState();
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
    if (!user) return "Offline";
    if (user.UserStatus & STATUS_WRITING) return "Writing";
    if (user.UserStatus & STATUS_ONLINE)  return "Online";
    return "Offline";
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
    xhttp.onreadystatechange = async function() {
      if (this.readyState == 4 && this.status == 200) {
        STATE_NAMES = this.responseText.split('\n');
      }
    };
    xhttp.open("GET", "wordlists/" + list, true);
    xhttp.send();
}