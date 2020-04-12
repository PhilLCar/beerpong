PARAMETER_WAITTIME = 15 * 60;
PARAMETER_GAMETIME = 15 * 60;
PARAMETER_ENDTIME  =  5 * 60;

GAME_WAITING  = 0;
GAME_STARTED  = 1;
GAME_PAUSED   = 2;
GAME_FINISHED = 3;
GAME_TIMEOUT  = 4;

STATUS_OFFLINE = 0;
STATUS_ONLINE  = 1;
STATUS_PLAYING = 2;
STATUS_WRITING = 4;

STATE_TIME      = null;
STATE_PAUSETIME = null;
STATE_GAME      = 0;
STATE_USERS     = [];
STATE_ME        = null;
STATE_MEMPTY    = true;
STATE_LASTMID   = 0;
STATE_MESSAGES  = []
STATE_CHOOSING  = false;
STATE_GUESSING  = false;

PUSH_MESSAGES  = null;
PUSH_STATUS    = 0;
PUSH_PAUSE     = false;
PUSH_UNPAUSE   = false;
PUSH_START     = false;
PUSH_QUIT      = false;
PUSH_TIMEOUT   = false;
PUSH_FINISH    = false;
PUSH_CHOOSING  = null;
PUSH_GIVEN     = null;
PUSH_SCORE     = null;
PUSH_USERTURN  = null;
PUSH_GAMETURN  = null;
PUSH_OTHERUSER = null;

BLOCKERS_WAIT  = false;
BLOCKERS_PAUSE = false;
BLOCKERS_END   = false;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function uState() {
    var time = document.getElementById("Timer");
    switch (STATE_GAME) {
        case GAME_WAITING:
            time.innerHTML = secondsToTime(PARAMETER_WAITTIME - STATE_TIME);
            wait();
            break;
        case GAME_PAUSED:
            pause();
            break;
        case GAME_STARTED:
            time.innerHTML = secondsToTime(PARAMETER_GAMETIME - STATE_TIME);
            play();
            break;
        case GAME_FINISHED:
            time.innerHTML = secondsToTime(PARAMETER_ENDTIME - STATE_TIME);
            finish();
            break;
        case GAME_TIMEOUT:
            timeout();
            break;
    }
}

function uUsers() {
    var players = document.getElementById("PlayerDisplay");
    var playerHTML = "";
    for (var player of STATE_USERS) {
        if (player.UserName != STATE_USERID) {
            playerHTML += "<div class=\"Player" + (player.UserStatus & STATUS_PLAYING ? " Playing" : "") + "\">" +
                            "<div class=\"PlayerStatus " + getStatus(player) + "\"></div>" +
                            "<div class=\"PlayerName\">" + player.UserName + "</div>" +
                            "<div class=\"PlayerIdent\">" + (player.UserGiven != "" ? "(" + player.UserGiven + ")" : "") + "</div>" +
                            "<div class=\"PlayerScore\">" + player.Score + " pts</div>" +
                            "</div>";
        }
    }
    if (players.innerHTML != playerHTML) players.innerHTML = playerHTML;
}

function uMessages() {
    var messages = document.getElementById("MessageDisplay");
    var messageHTML = "";
    for (var message of STATE_MESSAGES) {
        if (STATE_MEMPTY) {
            messages.innerHTML = "";
            STATE_MEMPTY = false;
        }
        messageHTML += "<div class=\"Message" + (message.UserName == STATE_USERID ? " Mine" : "") + "\">" +
                        "<div class=\"MessagePlayer\">" + message.UserName + "</div>" +
                        "<div class=\"MessageTime\">" + getTime(message.TimeSent) + "</div>" +
                        "<p>" + message.Content + "</p>" +
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
    STATE_TIME = (new Date().getTime() - Date.parse(state[2])) / 1000;
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
                "Score": parseInt(user[4]),
                "Turn": parseInt(user[5]),
                "UserGiven": user[6],
                "UserChoosing": user[7]
            }
            if (user[1] == STATE_USERID) {
                STATE_ME = STATE_USERS[n];
            }
            n++;
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function sendMessage() {
    if (PUSH_MESSAGES) PUSH_MESSAGES += "`";
    else PUSH_MESSAGES = "";
    PUSH_MESSAGES += document.getElementById("WriteInput").value;
    document.getElementById("WriteInput").value = "";
}

function sendWriting() {
    try {
        setStatus(STATUS_WRITING, document.getElementById("WriteInput").value != "");
    } catch {}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function update(n) {
    var xhttp = new XMLHttpRequest();
    var post = "";

    sendWriting();
    //////////// POST ////////////
    post = buildpost(post, "GameID", STATE_GAMEID);
    post = buildpost(post, "UserName", STATE_USERID);
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
    if (PUSH_CHOOSING) {
        post = buildpost(post, "Choose", PUSH_CHOOSING);
        PUSH_CHOOSING = null;
    }
    if (PUSH_SCORE) {
        post = buildpost(post, "Score", PUSH_SCORE);
        PUSH_SCORE = null;
    }
    if (PUSH_GIVEN) {
        post = buildpost(post, "Given", PUSH_GIVEN);
        PUSH_GIVEN = null;
    }
    if (PUSH_USERTURN) {
        post = buildpost(post, "UserTurn", PUSH_USERTURN);
        PUSH_USERTURN = null;
    }
    if (PUSH_GAMETURN) {
        post = buildpost(post, "GameTurn", PUSH_GAMETURN);
        PUSH_GAMETURN = null;
    }
    if (PUSH_OTHERUSER) {
        post = buildpost(post, "OtherUser", PUSH_OTHERUSER);
        PUSH_OTHERUSER = null;
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
        getUsers(vars);
        getMessages(vars);
        
        // u
        uState();
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
    if (user.UserStatus & STATUS_PLAYING) return "Active";
    if (user.UserStatus & STATUS_ONLINE)  return "Online";
    return "Offline";
}

function startGame() {
    PUSH_START = true;
}

function quitGame() {
    PUSH_QUIT = true;
    document.getElementById("QuitGame").style.backgroundColor ="#700";
}

function pauseGame() {
    PUSH_PAUSE = true;
}

function unpauseGame() {
    PUSH_UNPAUSE = true;
}

function timeoutGame() {
    PUSH_TIMEOUT = true;
}

function finishGame() {
    PUSH_FINISH = true;
}

function wait() {
    if (STATE_ME && STATE_ME.Host) {
        if (PARAMETER_WAITTIME - STATE_TIME <= 0) timeoutGame();
        var start = document.getElementById("StartButton");
        if (start.hidden) start.hidden = false;
    }
}

function pause() {
    if (!BLOCKERS_PAUSE) {
        if (PARAMETER_LANG == "FR") alert("La partie est temporairement interrompue");
        else                        alert("The game is momentarily stopped");
        BLOCKERS_PAUSE = true;
        
        if (STATE_ME && STATE_ME.Host) {
            var start   = document.getElementById("StartButton");
            var pause   = document.getElementById("PauseButton");
            var unpause = document.getElementById("UnpauseButton");
            var mask    = document.getElementById("Mask");
            start.hidden = true;
            unpause.hidden = false;
            pause.hidden = true;
            mask.hidden = true;
        }

        setStatus(STATUS_PLAYING, false);
    }
}

function play() {
    BLOCKERS_PAUSE = false;
    STATE_CHOOSING = false;
    STATE_GUESSING = false;

    if (STATE_ME && STATE_ME.Host) {
        if (PARAMETER_GAMETIME - STATE_TIME <= 0) finishGame();
        var start = document.getElementById("StartButton");
        var pause = document.getElementById("PauseButton");
        var unpause = document.getElementById("UnpauseButton");
        if (!start.hidden) start.hidden = true;
        if (!unpause.hidden) unpause.hidden = true;
        if (pause.hidden) pause.hidden = false;
    }

    var turn = false;
    for (var i = 0; i < STATE_USERS.length; i++) {
        if (STATE_USERS[i].UserStatus == STATUS_OFFLINE) continue;
        if (STATE_ME && STATE_USERS[i].UserName == STATE_ME.UserName) {
            if (STATE_ME.UserGiven == "") {
                var user;
                if (STATE_TURN % STATE_USERS.length != 0) user = STATE_USERS[(i + STATE_TURN) % STATE_USERS.length];
                else                                      user = STATE_USERS[(i + STATE_TURN + 1) % STATE_USERS.length];
                if (user.UserChoosing == "") PUSH_CHOOSING = user.UserName;
            }
        }
        if (STATE_ME && STATE_ME.UserChoosing != "") {
            STATE_CHOOSING = true;
        } else if (STATE_ME && STATE_ME.Turn == STATE_TURN && STATE_ME.UserName == STATE_USERS[i].UserName) {
            if (!turn) STATE_GUESSING = true;
        } else if (STATE_USERS[i].Turn == STATE_TURN) {
            turn = true;
        }
    }
    var mask  = document.getElementById("Mask");
    var cmenu = document.getElementById("ChoosingMenu");
    var gmenu = document.getElementById("GuessingMenu");
    var name  = document.getElementById("ChooseUser");
    if (STATE_CHOOSING) {
        if (mask.hidden) mask.hidden = false;
        if (cmenu.hidden) cmenu.hidden = false;
        if (!gmenu.hidden) gmenu.hidden = true;
        if (STATE_ME && name.innerHTML != STATE_ME.UserChoosing) name.innerHTML = STATE_ME.UserChoosing;
        setStatus(STATUS_PLAYING, false);
    } else if (STATE_GUESSING) {
        if (mask.hidden) mask.hidden = false;
        if (gmenu.hidden) gmenu.hidden = false;
        if (!cmenu.hidden) cmenu.hidden = true;
        setStatus(STATUS_PLAYING, true);
    } else {
        mask.hidden = true;
        setStatus(STATUS_PLAYING, false);
        if (!turn && STATE_ME && STATE_ME.Host) {
            PUSH_GAMETURN = STATE_TURN + 1;
        }
    }
    var score = document.getElementById("Score");
    var scoreHTML = STATE_ME.Score + " pts";
    if (score.innerHTML != scoreHTML) score.innerHTML = scoreHTML;
}

function choose() {
    var input = document.getElementById("ChooseInput");
    PUSH_OTHERUSER = STATE_ME.UserChoosing;
    PUSH_GIVEN = input.value;
    input.value = "";
}

function pass() {
    PUSH_USERTURN = STATE_TURN + 1;
}

function success() {
    PUSH_USERTURN = STATE_TURN + 1;
    if (STATE_ME) PUSH_SCORE = STATE_ME.Score + 1;
}

function finish() {
    if (!BLOCKERS_END) {
        if (PARAMETER_LANG == "FR") alert("La partie est terminée");
        else                        alert("The game has ended");
        BLOCKERS_END = true;

        var start   = document.getElementById("StartButton");
        var pause   = document.getElementById("PauseButton");
        var unpause = document.getElementById("UnpauseButton");
        var mask    = document.getElementById("Mask");
        start.hidden = true;
        unpause.hidden = true;
        pause.hidden = true;
        mask.hidden = true;

        setStatus(STATUS_PLAYING, false);

        var max = 0;
        for (var i = 0; i < STATE_USERS.length; i++) {
            if (STATE_USERS[i].Score > max) max = STATE_USERS[i].Score;
        }

        if (STATE_ME && STATE_ME.Score == max) {
            if (PARAMETER_LANG == "FR") alert("Vous avez gangé!!!");
            else                        alert("You won!!!");
        }
    }
    if (PARAMETER_ENDTIME - STATE_TIME <= 0) window.location="index.php";
}

function timeout() {
    if (PARAMETER_LANG == "FR") alert("La partie n'a pas commencée avant le temps aloué!");
    else                        alert("The game didn't start within the minimum amout of time!");
    quitGame();
}