_PRESID   = 0;
_PASSHASH = 0;

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

function select(id) {
  var tr_list = document.getElementById("PresTable").getElementsByTagName("tr");
  var tr_sel  = null;
  for (var tr of tr_list) {
    if (tr.getAttribute("presid") == id) {
      tr_sel = tr;
      _PRESID = id;
    } else tr.setAttribute("selected", "0");
  }
  if (tr_sel) {
    tr_sel.setAttribute("selected", "1");
  }
  options(tr);
}

function options(tr) {
  var join    = document.getElementById("Join");
  var present = document.getElementById("Present");
  var edit    = document.getElementById("Edit");
  if (tr) {
    var presenting = tr.getElementsByTagName("td")[1].getAttribute("value") == "1";
    join.hidden    = !presenting;
    present.hidden = presenting;
    edit.hidden    = presenting;
  } else {
    join.hidden    = true;
    present.hidden = true;
    edit.hidden    = true;
  }
}

function join() {
  var form = document.getElementById("NextPage");
  form.setAttribute("action", "quiz.php");
  form.getElementsByTagName("input")[0].value = _PRESID;
  form.submit();
}

function present() {
  var form = document.getElementById("NextPage");
  form.setAttribute("action", "present.php");
  form.getElementsByTagName("input")[0].value = _PRESID;
  form.submit();
}

function edit() {
  var lang   = getCookie("Language");
  var pass   = prompt(lang == "FR" ? "Entrez le mot de passe de la présentation:" : "Enter the password for this presentation", "");
  var form   = document.getElementById("NextPage");
  var inputs = form.getElementsByTagName("input");
  if (pass == "") return;
  form.setAttribute("action", "editor.php");
  inputs[0].value = _PRESID;
  inputs[1].value = pass;
  form.submit();
}