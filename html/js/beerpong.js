function updatepartner() {
    if (document.getElementsByName("IsB")[0].checked) {
	document.getElementsByName("MemberB")[0].disabled = false;
    } else {
	document.getElementsByName("MemberB")[0].value = "";
	document.getElementsByName("MemberB")[0].disabled = true;
    }
}

function join(GameID) {
    document.getElementsByName("GameID")[0].value = GameID;
    document.getElementById("GameList").submit();
}

function select() {
    if (document.getElementById("ITB").value == document.getElementsByName("TeamName")[0].value) {
        document.getElementsByName("MemberB")[0].disabled =
            document.getElementById("PartnerField").hidden = 
            document.getElementById("ITB").getAttribute("partner") == "false";
        try {
            document.getElementsByName("NewTeamName")[0].disabled = false;
            document.getElementById("NewTeam").hidden = false;
        } catch (e) {}
    } else {
        document.getElementsByName("MemberB")[0].disabled = true;
        document.getElementById("PartnerField").hidden = true;
        try {
            document.getElementsByName("NewTeamName")[0].disabled = true;
            document.getElementById("NewTeam").hidden = true;
        } catch (e) {}
    }
}

function change() {
    document.getElementById("ITB").value =
	    document.getElementsByName("NewTeamName")[0].value;
}

function openreracks() {
    var menu = document.getElementById("RerackMenu");
    var rerack = document.getElementById("Rerack");
    if (menu.hidden) {
        menu.hidden = false;
        rerack.style.color = "black";
        rerack.style.backgroundColor = "white";
    } else {
        menu.hidden = true;
        rerack.style.color = "";
        rerack.style.backgroundColor = "";
    }
}

function darken(color) {
    switch(color) {
        case "white":
            return "#777";
        case "red":
            return "#700";
        case "magenta":
            return "#707";
        case "blue":
            return "#007";
        case "cyan":
            return "#077";
        case "lime":
            return "#070";
        case "yellow":
            return "#770";
    }
}

function setcss(name, color, append) {
    if (color == "") return;
    var css = "." + name + " { background-color: " + color + "; }\n" +
              "." + name + ":hover { background-color: " + darken(color) + "; }";

    if (append) document.getElementById("TableStyle").innerHTML += css;
    else        document.getElementById("TableStyle").innerHTML = css;

    if (append) document.getElementById("Away").style.color = color;
    else        document.getElementById("Home").style.color = color;
}

function refresh() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var nums = this.responseText.split(';');
        if (nums[0] != "") {
            setcss("C", nums[4], false);
            setcss("O", nums[5], true);
            document.getElementById("Home").innerHTML = nums[2];
            document.getElementById("Away").innerHTML = nums[3] == "" ? "..." : nums[3];
            resizetitle(document.getElementById("Title"), document.getElementById("Home"), document.getElementById("Away"));
            for (var i = 0; i < nglasses("C"); i++) {
                if (nums[0] & (1 << i)) {
                    document.getElementById("C" + i).setAttribute("class", "G C");
                } else {
                    document.getElementById("C" + i).setAttribute("class", "G E");
                }
            }
            for (var i = 0; i < nglasses("O"); i++) {
                if (nums[1] & (1 << i)) {
                    document.getElementById("O" + i).setAttribute("class", "G O");
                } else {
                    document.getElementById("O" + i).setAttribute("class", "G E");
                }
            }
            rackC(nums[6]);
            rackO(nums[7]);

            if (nums[8] > 0) {
                document.getElementById("Redemption").hidden = false;
                if (check("C") == 0) {
                    document.getElementById("RedYes").hidden = false;
                    document.getElementById("RedNo").hidden  = false;
                }
                document.getElementById("Turn").hidden = true;
            } else {
                document.getElementById("Redemption").hidden = true;
                document.getElementById("RedYes").hidden = true;
                document.getElementById("RedNo").hidden = true;

                document.getElementById("Turn").hidden = nums[9] == 0;
            }
        } else {
            if (check("C") == 0) {
                alert("You lost! :(");
            } else {
                alert("YOU WON!!!");
            }
            window.location = "index.php";
        }
      }
    };
    xhttp.open("GET", "update.php", true);
    xhttp.send();
}

function rerack(id) {
    if (document.getElementById("Opponent").getAttribute("rack") != "0") {
        alert("You can't rerack twice!");
        return;
    }
    if (document.getElementById("Turn").hidden) {
        alert("It's not your turn!");
        return;
    }
    var ng = check("O");
    var dg = 0;
    switch (id) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 7:
            dg = 3;
            break;
        case 6:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
            dg = 4;
            break;
    }
    if (dg != ng) {
        alert("You need " + dg + " glasses full for this rerack");
        return;
    }
    update(id);
}

function enter(opponent, id) {
    if (!opponent) {
        alert("Don't remove your own glasses!");
        return;
    }
    if (document.getElementById("Turn").hidden) {
        alert("It's not your turn!");
        return;
    }
    if (!document.getElementById("Redemption").hidden) {
        return;
    }
    if (document.getElementById("O" + id).getAttribute("class") == "G O")
        document.getElementById("O" + id).setAttribute("class", "G E");
    else document.getElementById("O" + id).setAttribute("class", "G O");

    update(null);
}

function update(rack) {
    var xhttp = new XMLHttpRequest();
    var glasses = 0;
    for (var i = 0; i < nglasses("O"); i++) {
        if (document.getElementById("O" + i).getAttribute("class") == "G O") glasses |= (1 << i);
    }
    xhttp.open("POST", "update.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("Push=TRUE&Glasses=" + glasses + (rack == null ? "" : "&Rack=" + rack));
}

function nglasses(name) {
    var n = 0;
    while (document.getElementById(name + n)) n++;
    return n;
}

function check(name) {
    var full = 0;
    return document.getElementsByClassName(name).length;
}

function resizetitle(title, home, away) {
    while (parseFloat(title.offsetHeight) != parseFloat(home.offsetHeight)) {
        title.style.fontSize = 0.9 * parseFloat(title.style.fontSize) + "px";
        home.style.fontSize = 0.9 * parseFloat(home.style.fontSize) + "px";
        away.style.fontSize = 0.9 * parseFloat(away.style.fontSize) + "px";
    }
}

function resizetable() {
    var height = window.innerHeight;
    var table  = document.getElementById("Table");
    var title  = document.getElementById("Title");
    var home   = document.getElementById("Home");
    var away   = document.getElementById("Away");
    var rerack = document.getElementById("Rerack");
    var quit   = document.getElementById("Quit");
    var menu   = document.getElementById("RerackMenu");
    var red    = document.getElementById("Redemption");
    var turn   = document.getElementById("Turn");

    red.style.top = 0.4 * height + "px";
    red.style.fontSize  = 0.08 * height + "px";
    turn.style.top = 0.4 * height + "px";
    turn.style.fontSize  = 0.08 * height + "px";

    table.style.height = 0.8 * height + "px";
    table.style.width  = 0.5 * 0.8 * height + "px";
    table.style.borderRadius = 0.04 * height + "px";
    table.style.marginTop = 0.15 * height + "px";
    table.style.borderWidth = 0.006 * height + "px";

    title.style.fontSize = 0.05 * height + "px";
    home.style.fontSize = 0.1 * height + "px";
    away.style.fontSize = 0.1 * height + "px";

    resizetitle(title, home, away);

    menu.style.top = title.offsetHeight + "px";
    menu.style.left = 0.06 * height + "px";
    menu.style.fontSize = 0.03 * height + "px";
    menu.style.width = 0.375 * height + "px";
    rerack.style.width = 0.06 * height + "px";
    rerack.style.fontSize = 0.075 * height + "px";
    quit.style.width   = 0.06 * height + "px";
    quit.style.fontSize   = 0.075 * height + "px";

    setG(height);

    standardC();
    standardO();
}

function setG(height) {
    var size = 0.2 * 0.5 * 0.8 * height;
    var vmargin = -0.005 * height + "px";
    var hmargin = -0.002 * height + "px";

    var css = ".G {\n" +
        "position: absolute;\n" +
        "height: " + size + "px;\n" +
        "width: " + size + "px;\n" +
        "border-radius: " + Math.sqrt(size*size) + "px;\n" +
        "border-width: " + (0.006 * height) + "px;\n}";

    document.getElementById("GlassesStyle").innerHTML = css;
}


function genCG(n) {
    var html = "";
    for (var i = 0; i < n; i++) {
        html += "<div class=\"G C\" id=\"C" + i + "\" onclick=\"enter(false, " + i + ")\"></div>\n";
    }
    return html;
}

function genOG(n) {
    var html = "";
    for (var i = 0; i < n; i++) {
        html += "<div class=\"G O\" id=\"O" + i + "\" onclick=\"enter(true, " + i + ")\"></div>\n";
    }
    return html;
}

function genPG(n) {
    var html = "";
    for (var i = 0; i < n; i++) {
        html += "<div class=\"G P\" id=\"P" + i + "\"></div>\n";
    }
    return html;
}

function rackC(rack) {
    var prack = document.getElementById("Contestant").getAttribute("rack");
    if (prack == rack) return;
    switch(rack) {
        case "0":
            standardC();
            return;
        case "1":
            triangleC();
            return;
        case "2":
            rtriangleC();
            return;
        case "3":
            flagC();
            return;
        case "4":
            rflagC();
            return;
        case "5":
            lineC();
            return;
        case "6":
            line4C();
            return;
        case "7":
            hlineC();
            return;
        case "8":
            hline4C();
            return;
        case "9":
            diamondC();
            return;
        case "10":
            hdiamondC();
            return;
        case "11":
            penisC();
            return;
        case "12":
            rpenisC();
            return;
    }
}

function rackO(rack) {
    var prack = document.getElementById("Opponent").getAttribute("rack");
    if (prack == rack) return;
    switch(rack) {
        case "0":
            standardO();
            return;
        case "1":
            triangleO();
            return;
        case "2":
            rtriangleO();
            return;
        case "3":
            flagO();
            return;
        case "4":
            rflagO();
            return;
        case "5":
            lineO();
            return;
        case "6":
            line4O();
            return;
        case "7":
            hlineO();
            return;
        case "8":
            hline4O();
            return;
        case "9":
            diamondO();
            return;
        case "10":
            hdiamondO();
            return;
        case "11":
            penisO();
            return;
        case "12":
            rpenisO();
            return;
    }
}

function getG(name, number) {
    return document.getElementById(name + number);
}

function standardC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "0");
    c.innerHTML = genCG(6);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    var s1 = (twidth - 3*gwidth) / 2;
    for (var i = 3; i < 6; i++) {
        var g = getG("C", i);
        g.style.bottom = 0 + "px";
        g.style.left = s1 + (i - 3) * gwidth + "px";
    }
    var s2 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("C", i);
        g.style.bottom = gwidth * 0.86 + "px";
        g.style.left = s2 + (i - 1) * gwidth + "px";
    }
    var s3 = (twidth - gwidth) / 2;
    var g = getG("C", 0);
    g.style.bottom = gwidth * 1.72 + "px";
    g.style.left = s3 + "px";
}

function standardO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "0");
    c.innerHTML = genOG(6);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 3*gwidth) / 2;
    for (var i = 3; i < 6; i++) {
        var g = getG("O", i);
        g.style.top = 0 + "px";
        g.style.left = s1 + (5 - i) * gwidth + "px";
    }
    var s2 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("O", i);
        g.style.top = gwidth * 0.86 + "px";
        g.style.left = s2 + (2 - i) * gwidth + "px";
    }
    var s3 = (twidth - gwidth) / 2;
    var g = getG("O", 0);
    g.style.top = gwidth * 1.72 + "px";
    g.style.left = s3 + "px";
}


function standardP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "0");
    c.innerHTML = genPG(6);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 3*gwidth) / 2;
    for (var i = 3; i < 6; i++) {
        var g = getG("P", i);
        g.style.top = 0 + "px";
        g.style.left = s1 + (5 - i) * gwidth + "px";
    }
    var s2 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("P", i);
        g.style.top = gwidth * 0.86 + "px";
        g.style.left = s2 + (2 - i) * gwidth + "px";
    }
    var s3 = (twidth - gwidth) / 2;
    var g = getG("P", 0);
    g.style.top = gwidth * 1.72 + "px";
    g.style.left = s3 + "px";
}

function triangleC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "1");
    c.innerHTML = genCG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("C", i);
        g.style.bottom = 0 + "px";
        g.style.left = s1 + (i - 1) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("C", 0);
    g.style.bottom = gwidth * 0.86 + "px";
    g.style.left = s2 + "px";
}

function triangleO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "1");
    c.innerHTML = genOG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("O", i);
        g.style.top = 0 + "px";
        g.style.left = s1 + (2 - i) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("O", 0);
    g.style.top = gwidth * 0.86 + "px";
    g.style.left = s2 + "px";
}

function triangleP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "1");
    c.innerHTML = genPG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("P", i);
        g.style.top = 0 + "px";
        g.style.left = s1 + (2 - i) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("P", 0);
    g.style.top = gwidth * 0.86 + "px";
    g.style.left = s2 + "px";
}

function rtriangleC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "2");
    c.innerHTML = genCG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("C", i);
        g.style.bottom = gwidth * 0.86 + "px";
        g.style.left = s1 + (i - 1) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("C", 0);
    g.style.bottom = 0 + "px";
    g.style.left = s2 + "px";
}

function rtriangleO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "2");
    c.innerHTML = genOG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("O", i);
        g.style.top = gwidth * 0.86 + "px";
        g.style.left = s1 + (2 - i) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("O", 0);
    g.style.top = 0 + "px";
    g.style.left = s2 + "px";
}

function rtriangleP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "2");
    c.innerHTML = genPG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("P", i);
        g.style.top = gwidth * 0.86 + "px";
        g.style.left = s1 + (2 - i) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("P", 0);
    g.style.top = 0 + "px";
    g.style.left = s2 + "px";
}

function flagC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "3");
    c.innerHTML = genCG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 1
    var g = getG("C", 0);
    g.style.bottom = gwidth + "px";
    g.style.right   = twidth / 2 - 0.86 * gwidth + "px";
    // 2
    g = getG("C", 1);
    g.style.bottom = 0.49 * gwidth + "px";
    g.style.right   = twidth / 2 + "px";
    // 3
    g = getG("C", 2);
    g.style.bottom = 0 + "px";
    g.style.right   = twidth / 2 - 0.86 * gwidth + "px";
}

function flagO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "3");
    c.innerHTML = genOG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("O", 0);
    g.style.top = gwidth + "px";
    g.style.left   = twidth / 2 - 0.86 * gwidth + "px";
    // 2
    g = getG("O", 1);
    g.style.top = 0.49 * gwidth + "px";
    g.style.left   = twidth / 2 + "px";
    // 3
    g = getG("O", 2);
    g.style.top = 0 + "px";
    g.style.left   = twidth / 2 - 0.86 * gwidth + "px";
}

function flagP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "3");
    c.innerHTML = genPG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("P", 0);
    g.style.top = gwidth + "px";
    g.style.left   = twidth / 2 - 0.86 * gwidth + "px";
    // 2
    g = getG("P", 1);
    g.style.top = 0.49 * gwidth + "px";
    g.style.left   = twidth / 2 + "px";
    // 3
    g = getG("P", 2);
    g.style.top = 0 + "px";
    g.style.left   = twidth / 2 - 0.86 * gwidth + "px";
}

function rflagC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "4");
    c.innerHTML = genCG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 1
    var g = getG("C", 0);
    g.style.bottom = gwidth + "px";
    g.style.left   = twidth / 2 - 0.86 * gwidth + "px";
    // 2
    g = getG("C", 1);
    g.style.bottom = 0.49 * gwidth + "px";
    g.style.left   = twidth / 2 + "px";
    // 3
    g = getG("C", 2);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 0.86 * gwidth + "px";
}

function rflagO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "4");
    c.innerHTML = genOG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("O", 0);
    g.style.top = gwidth + "px";
    g.style.right   = twidth / 2 - 0.86 * gwidth + "px";
    // 2
    g = getG("O", 1);
    g.style.top = 0.49 * gwidth + "px";
    g.style.right   = twidth / 2 + "px";
    // 3
    g = getG("O", 2);
    g.style.top = 0 + "px";
    g.style.right   = twidth / 2 - 0.86 * gwidth + "px";
}

function rflagP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "4");
    c.innerHTML = genPG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("P", 0);
    g.style.top = gwidth + "px";
    g.style.right   = twidth / 2 - 0.86 * gwidth + "px";
    // 2
    g = getG("P", 1);
    g.style.top = 0.49 * gwidth + "px";
    g.style.right   = twidth / 2 + "px";
    // 3
    g = getG("P", 2);
    g.style.top = 0 + "px";
    g.style.right   = twidth / 2 - 0.86 * gwidth + "px";
}

function lineC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "5");
    c.innerHTML = genCG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 1
    var g = getG("C", 0);
    g.style.bottom = 2 * gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 2
    g = getG("C", 1);
    g.style.bottom = gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("C", 2);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
}

function lineO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "5");
    c.innerHTML = genOG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("O", 0);
    g.style.top  = 2 * gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 2
    g = getG("O", 1);
    g.style.top  = gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("O", 2);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
}

function lineP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "5");
    c.innerHTML = genPG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("P", 0);
    g.style.top  = 2 * gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 2
    g = getG("P", 1);
    g.style.top  = gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("P", 2);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
}

function line4C() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "6");
    c.innerHTML = genCG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 1
    var g = getG("C", 0);
    g.style.bottom = 3 * gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 2
    g = getG("C", 1);
    g.style.bottom = 2 * gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("C", 2);
    g.style.bottom = gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 4
    g = getG("C", 3);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
}

function line4O() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "6");
    c.innerHTML = genOG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("O", 0);
    g.style.top  = 3 * gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 2
    g = getG("O", 1);
    g.style.top  = 2 * gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("O", 2);
    g.style.top  = gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 4
    g = getG("O", 3);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
}

function line4P() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "6");
    c.innerHTML = genPG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("P", 0);
    g.style.top  = 3 * gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 2
    g = getG("P", 1);
    g.style.top  = 2 * gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("P", 2);
    g.style.top  = gwidth + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 4
    g = getG("P", 3);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
}

function hlineC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "7");
    c.innerHTML = genCG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 1
    var g = getG("C", 0);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 1.5 * gwidth + "px";
    // 2
    g = getG("C", 1);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("C", 2);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 + 0.5 * gwidth + "px";
}

function hlineO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "7");
    c.innerHTML = genOG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("O", 0);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 + 0.5 * gwidth + "px";
    // 2
    g = getG("O", 1);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("O", 2);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 1.5 * gwidth + "px";
}

function hlineP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "7");
    c.innerHTML = genPG(3);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("P", 0);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 + 0.5 * gwidth + "px";
    // 2
    g = getG("P", 1);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";
    // 3
    g = getG("P", 2);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 1.5 * gwidth + "px";
}

function hline4C() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "8");
    c.innerHTML = genCG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 1
    var g = getG("C", 0);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 2 * gwidth + "px";
    // 2
    g = getG("C", 1);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 1 * gwidth + "px";
    // 3
    g = getG("C", 2);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 + 0 * gwidth + "px";
    // 4
    g = getG("C", 3);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 + 1 * gwidth + "px";
}

function hline4O() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "8");
    c.innerHTML = genOG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("O", 0);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 + 1 * gwidth + "px";
    // 2
    var g = getG("O", 1);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 + 0 * gwidth + "px";
    // 3
    g = getG("O", 2);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 1 * gwidth + "px";
    // 4
    g = getG("O", 3);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 2 * gwidth + "px";
}

function hline4P() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "8");
    c.innerHTML = genPG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 1
    var g = getG("P", 0);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 + 1 * gwidth + "px";
    // 2
    var g = getG("P", 1);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 + 0 * gwidth + "px";
    // 3
    g = getG("P", 2);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 1 * gwidth + "px";
    // 4
    g = getG("P", 3);
    g.style.top  = 0 + "px";
    g.style.left = twidth / 2 - 2 * gwidth + "px";
}

function diamondC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "9");
    c.innerHTML = genCG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 4
    var g = getG("C", 3);
    g.style.bottom = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";

    // 2 3
    var s2 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("C", i);
        g.style.bottom = gwidth * 0.86 + "px";
        g.style.left = s2 + (i - 1) * gwidth + "px";
    }

    // 1
    var s3 = (twidth - gwidth) / 2;
    var g = getG("C", 0);
    g.style.bottom = gwidth * 1.72 + "px";
    g.style.left = s3 + "px";
}

function diamondO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "9");
    c.innerHTML = genOG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 4
    var g = getG("O", 3);
    g.style.top = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";

    // 2 3
    var s2 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("O", i);
        g.style.top = gwidth * 0.86 + "px";
        g.style.left = s2 + (2 - i) * gwidth + "px";
    }

    // 1
    var s3 = (twidth - gwidth) / 2;
    var g = getG("O", 0);
    g.style.top = gwidth * 1.72 + "px";
    g.style.left = s3 + "px";
}

function diamondP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "9");
    c.innerHTML = genPG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 4
    var g = getG("P", 3);
    g.style.top = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";

    // 2 3
    var s2 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("P", i);
        g.style.top = gwidth * 0.86 + "px";
        g.style.left = s2 + (2 - i) * gwidth + "px";
    }

    // 1
    var s3 = (twidth - gwidth) / 2;
    var g = getG("P", 0);
    g.style.top = gwidth * 1.72 + "px";
    g.style.left = s3 + "px";
}

function hdiamondC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "10");
    c.innerHTML = genCG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 4
    var g = getG("C", 3);
    g.style.bottom = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";

    // 2 3
    var s2 = (twidth - 2*1.37*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("C", i);
        g.style.bottom = gwidth * 0.5 + "px";
        g.style.left = s2 + (i - 1) * 1.75 * gwidth + "px";
    }

    // 1
    var s3 = (twidth - gwidth) / 2;
    var g = getG("C", 0);
    g.style.bottom = gwidth + "px";
    g.style.left = s3 + "px";
}

function hdiamondO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "10");
    c.innerHTML = genOG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 4
    var g = getG("O", 3);
    g.style.top = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";

    // 2 3
    var s2 = (twidth - 2*1.37*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("O", i);
        g.style.top = gwidth * 0.5 + "px";
        g.style.left = s2 + (2 - i) * 1.75 * gwidth + "px";
    }

    // 1
    var s3 = (twidth - gwidth) / 2;
    var g = getG("O", 0);
    g.style.top = gwidth + "px";
    g.style.left = s3 + "px";
}

function hdiamondP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "10");
    c.innerHTML = genPG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    // 4
    var g = getG("P", 3);
    g.style.top = 0 + "px";
    g.style.left = twidth / 2 - 0.5 * gwidth + "px";

    // 2 3
    var s2 = (twidth - 2*1.37*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("P", i);
        g.style.top = gwidth * 0.5 + "px";
        g.style.left = s2 + (2 - i) * 1.75 * gwidth + "px";
    }

    // 1
    var s3 = (twidth - gwidth) / 2;
    var g = getG("P", 0);
    g.style.top = gwidth + "px";
    g.style.left = s3 + "px";
}

function penisC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "11");
    c.innerHTML = genCG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("C", i+1);
        g.style.bottom = 0 + "px";
        g.style.left = s1 + (i - 1) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("C", 1);
    g.style.bottom = gwidth * 0.86 + "px";
    g.style.left = s2 + "px";
    var g = getG("C", 0);
    g.style.bottom = gwidth * 1.86 + "px";
    g.style.left = s2 + "px";
}

function penisO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "11");
    c.innerHTML = genOG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("O", i+1);
        g.style.top = 0 + "px";
        g.style.left = s1 + (2 - i) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("O", 1);
    g.style.top = gwidth * 0.86 + "px";
    g.style.left = s2 + "px";
    var g = getG("O", 0);
    g.style.top = gwidth * 1.86 + "px";
    g.style.left = s2 + "px";
}

function penisP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "11");
    c.innerHTML = genPG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    var s1 = (twidth - 2*gwidth) / 2;
    for (var i = 1; i < 3; i++) {
        var g = getG("P", i+1);
        g.style.top = 0 + "px";
        g.style.left = s1 + (2 - i) * gwidth + "px";
    }
    var s2 = (twidth - gwidth) / 2;
    var g = getG("P", 1);
    g.style.top = gwidth * 0.86 + "px";
    g.style.left = s2 + "px";
    var g = getG("P", 0);
    g.style.top = gwidth * 1.86 + "px";
    g.style.left = s2 + "px";
}

function rpenisC() {
    var c = document.getElementById("Contestant");
    c.setAttribute("rack", "12");
    c.innerHTML = genCG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("C0").offsetWidth;

    // 1
    var g = getG("C", 0);
    g.style.bottom = 1.86 * gwidth + "px";
    g.style.left   = twidth / 2 - 1 * gwidth + "px";
    // 2
    g = getG("C", 1);
    g.style.bottom = 1.86 * gwidth + "px";
    g.style.left   = twidth / 2 + 0 * gwidth + "px";
    // 3
    g = getG("C", 2);
    g.style.bottom = gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 4
    g = getG("C", 3);
    g.style.bottom = 0 + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
}

function rpenisO() {
    var c = document.getElementById("Opponent");
    c.setAttribute("rack", "12");
    c.innerHTML = genOG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    
    // 1
    var g = getG("O", 0);
    g.style.top = 1.86 * gwidth + "px";
    g.style.left   = twidth / 2 + 0 * gwidth + "px";
    // 2
    g = getG("O", 1);
    g.style.top = 1.86 * gwidth + "px";
    g.style.left   = twidth / 2 - 1 * gwidth + "px";
    // 3
    g = getG("O", 2);
    g.style.top = gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 4
    g = getG("O", 3);
    g.style.top = 0 + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
}

function rpenisP() {
    var c = document.getElementById("Preview");
    c.setAttribute("rack", "12");
    c.innerHTML = genPG(4);

    var twidth = document.getElementById("Table").offsetWidth;
    var gwidth = document.getElementById("O0").offsetWidth;

    
    // 1
    var g = getG("P", 0);
    g.style.top = 1.86 * gwidth + "px";
    g.style.left   = twidth / 2 + 0 * gwidth + "px";
    // 2
    g = getG("P", 1);
    g.style.top = 1.86 * gwidth + "px";
    g.style.left   = twidth / 2 - 1 * gwidth + "px";
    // 3
    g = getG("P", 2);
    g.style.top = gwidth + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
    // 4
    g = getG("P", 3);
    g.style.top = 0 + "px";
    g.style.left   = twidth / 2 - 0.5 * gwidth + "px";
}