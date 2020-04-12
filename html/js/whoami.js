STATE_LASTMID  = 0;
STATE_MESSAGES = []

PUSH_MESSAGES = null;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function uMessages() {
    var messages = document.getElementById("MessageBox");
    var messageHTML = "";
    for (var message of STATE_MESSAGES) {
        if (STATE_MEMPTY) {
            messages.innerHTML = "";
            STATE_MEMPTY = false;
        }
        messageHTML += "<div class=\"Message" + (message.UserName == USERNAME ? " Mine" : "") + "\">" +
                        "<div class=\"MessagePlayer\">" + message.UserName + "</div>" +
                        "<div class=\"MessageTime\">" + getTime(message.TimeSent) + "</div>" +
                            message.Content +
                        "</div>";
    }
    if (messageHTML != "") {
        messages.scrollTop = 100000;
        messages.innerHTML += messageHTML;
    }
    STATE_MESSAGES = [];
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function update(n) {
    var xhttp = new XMLHttpRequest();
    var post = "";

    //////////// POST ////////////
    post = buildpost(post, "GameID", STATE_GAMEID);
    post = buildpost(post, "UserName", STATE_USERID);
    if (PUSH_MESSAGES) {
        post = buildpost(post, "Messages", PUSH_MESSAGES)
        PUSH_MESSAGES = null;
    }
    xhttp.onreadystatechange = async function() {
      if (this.readyState == 4 && this.status == 200) {
        var vars = this.responseText.split('`');
        // get
        getMessages();

        // u
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