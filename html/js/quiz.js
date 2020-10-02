_PRESID      = 0;
_PASSHASH    = 0;
_SLIDE_RATIO = 4/3;
_SLIDE_NUM   = -1;

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

function sendCommand(command, args, callback) {
  var xhttp = new XMLHttpRequest();
  var post = "PresentationID=" + _PRESID + "&PassHash=" + _PASSHASH + "&Command=" + command;

  if (args) {
    for (arg in args) {
      post += `&${arg}=${args[arg]}`;
    }
  }

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

function updateSlides(numslides) {
  var sc = document.getElementById("SlidesContainer");
  sc.innerHTML = "<div id=\"Separator0\" class=\"separator\" expanded=\"0\"></div>";

  for (var i = 0; i < numslides; i++) {
    sc.innerHTML += `<div class="slide" onclick="selectSlide(${i})">${i}</div><div id="Separator${i+1}" class="separator" expanded="0"></div>`;
  }
  var slides = document.getElementsByClassName("slide");
  for (slide of slides) {
    makeDraggableSlide(slide);
  }
}

function displaySlide() {
  var sc = document.getElementById("SlideContainer");
  var slide = document.getElementById("Slide");
  var height = 0;
  var width  = 0;
  if (sc.clientHeight * _SLIDE_RATIO > sc.clientWidth) {
    height = sc.clientWidth / _SLIDE_RATIO * 0.9;
    width  = sc.clientWidth * 0.9;
  } else {
    height = sc.clientHeight * 0.9;
    width  = sc.clientHeight * _SLIDE_RATIO * 0.9;
  }
  slide.style.height = height + "px";
  slide.style.width  = width  + "px";
}

function selectSlide(position) {
  _SLIDE_NUM = position;
  if (position >=0) {
    document.getElementById("Slide").hidden         = false;
    document.getElementById("SlideComments").hidden = false;
    document.getElementById("LabelTools").hidden    = false;
    document.getElementById("ImageTools").hidden    = false;
    document.getElementById("SampleTools").hidden   = false;
    document.getElementById("DelButton").hidden     = false;
    var slides = document.getElementsByClassName("slide");
    for (var slide of slides) {
      if (slide.innerHTML == position) slide.setAttribute("selected", "1");
      else slide.setAttribute("selected", "0");
    }
    sendCommand("UP_SLIDE", { SlidePosition: position }, updateSlide)
    displaySlide();
  } else {
    document.getElementById("Slide").hidden         = true;
    document.getElementById("SlideComments").hidden = true;
    document.getElementById("LabelTools").hidden    = true;
    document.getElementById("ImageTools").hidden    = true;
    document.getElementById("SampleTools").hidden   = true;
    document.getElementById("DelButton").hidden     = true;
  }
}

function doNothing(slideInfo) { }

function updateSlide(slideInfo) {
  document.getElementById("SlideCommentText").value = decodeURIComponent(slideInfo);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// https://www.w3schools.com/howto/howto_js_draggable.asp
function makeDraggableSlide(elmnt) {
  elmnt.onmousedown = dragMouseDown;
  var slide1 = -1;
  var slide2 = -1;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    var slides = document.getElementsByClassName("slide");
    var i = 0;
    for (slide of slides) {
      if (slide == elmnt) slide1 = i;
      slide.setAttribute("class", "slide disabled");
      i++;
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    var x = e.clientX;
    var y = e.clientY;

    var separators = document.getElementsByClassName("separator");
    for (var separator of separators) {
      var pos = separator.getBoundingClientRect();
      if (x > pos.left && x < pos.right && y > pos.bottom - 50 && y < pos.top + 50) {
        separator.setAttribute("expanded", "1");
      } else {
        separator.setAttribute("expanded", "0");
      }
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;

    var separators = document.getElementsByClassName("separator");
    var i = 0;
    for (var separator of separators) {
      if (separator.getAttribute("expanded") == "1") slide2 = i;
      separator.setAttribute("expanded", "0");
      i++;
    }
    var slides = document.getElementsByClassName("slide");
    for (slide of slides) {
      slide.setAttribute("class", "slide");
    }
    if (slide2 > slide1) slide2--;
    if (slide1 >= 0 && slide2 >= 0 && slide1 != slide2) {
      sendCommand("SWAP", { Slide1: slide1, Slide2: slide2 }, doNothing);
      selectSlide(slide2);
    }
  }
}