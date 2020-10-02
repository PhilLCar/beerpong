_PRESID      = 0;
_PASSHASH    = 0;
_SLIDE_RATIO = 4/3;
_SLIDE_NUM   = -1;
_LABEL_NUM   = -1;
_IMAGE_NUM   = -1;

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
  deselect();
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
  var slide    = document.getElementById("Slide");
  var elements = slideInfo.split(';');

  document.getElementById("SlideCommentText").value = decodeURIComponent(elements[0]);
  slide.innerHTML = "";

  for (var i = 1; i < elements.length; i++) {
    var element = elements[i].split(':');
    if (element[0] == "L") {
      var fontSize = document.getElementById("Slide").clientWidth * element[4] / 1000.0 + "px";
      slide.innerHTML += `<div id="LabelContainer${element[1]}" class="labelContainer" onfocusin="deselect();showLabelOptions(${element[1]})" ` +
                         `style="left:${element[5]}%;top:${element[6]}%">\n<div id="Label${element[1]}" class="label" onfocusout="sendText()"` +
                         `style="color:${element[3]};font-size:${fontSize}" fontsize="${element[4]}" posx="${element[5]}" posy="${element[6]}" contenteditable="true" ` +
                         `onmousedown="event.stopPropagation()">${decodeURIComponent(element[2])}</div>\n</div>`;
      makeDraggableLabel(document.getElementById(`LabelContainer${element[1]}`));
    }
  }
}

function deleteSlide() {
  var lang = getCookie("Language");
  if (confirm(lang == "FR" ? "Êtes-vous certain?" : "Are you sure?")) {
    sendCommand('DEL_SLIDE', { SlidePosition: _SLIDE_NUM }, updateSlides);
    selectSlide(-1);
  }
}

function deselect() {
  if (_LABEL_NUM != -1) {
    document.getElementById("LabelContainer" + _LABEL_NUM).style.borderColor = "black";
    hideLabelOptions();
  }
}

function showLabelOptions(labelid) {
  _LABEL_NUM = labelid;
  document.getElementById("DelLabel").hidden     = false;
  document.getElementById("ColorPalette").hidden = false;
  document.getElementById("FontSize").hidden     = false;
  document.getElementById("FontSizeInput").value = document.getElementById("Label" + labelid).getAttribute("fontsize");
  document.getElementById("LabelContainer" + labelid).style.borderColor = "red";
}

function deleteLabel() {
  var lang = getCookie("Language");
  if (confirm(lang == "FR" ? "Êtes-vous certain?" : "Are you sure?")) {
    sendCommand('DEL_LABEL', { LabelID: _LABEL_NUM }, updateSlide);
    hideLabelOptions();
  }
}

function updateLabels() {
  var labels = document.getElementsByClassName("label");
  for (var label of labels) {
    var size = label.getAttribute("fontsize");
    var fontSize = document.getElementById("Slide").clientWidth * size / 1000.0 + "px";
    label.style.fontSize = fontSize;
  }
}

function hideLabelOptions() {
  _LABEL_NUM = -1;
  document.getElementById("DelLabel").hidden     = true;
  document.getElementById("ColorPalette").hidden = true;
  document.getElementById("FontSize").hidden     = true;
}

function sendColor(color) {
  document.getElementById("Label" + _LABEL_NUM).style.color = color;
  sendCommand('UP_LCOL', { LabelID: _LABEL_NUM, Color: color }, doNothing);
}

function sendFontSize() {
  var size     = document.getElementById("FontSizeInput").value;
  var fontSize = document.getElementById("Slide").clientWidth * size / 1000.0 + "px";
  document.getElementById("Label" + _LABEL_NUM).style.fontSize = fontSize;
  sendCommand('UP_LSIZE', { LabelID: _LABEL_NUM, FontSize: size }, doNothing );
}

function sendText() {
  var text = document.getElementById("Label" + _LABEL_NUM).innerHTML;
  sendCommand('UP_LTEXT', { LabelID: _LABEL_NUM, Content: encodeURIComponent(text) }, doNothing);
}

function newImage() {
  document.getElementById("ImagePrompt").hidden = false;
  document.getElementById("ImagePID").value = _PRESID;
  document.getElementById("ImageSID").value = _SLIDE_NUM;
  document.getElementById("ImageForm").submit();
  document.getElementById("RetryButton").hidden = true;
}

function checkImage() {
  var iframe = document.getElementById("ImagePrompt").getElementsByTagName("iframe")[0];
  var result = iframe.contentWindow.document.getElementById("Result");
  if (iframe.contentWindow.document.getElementsByClassName("error").length) {
    document.getElementById("RetryButton").hidden = false;
  } else if (result) {
    if (result.value != "") {
      document.getElementById("ImagePrompt").hidden = true;
      sendCommand("UP_SLIDE", { SlidePosition: _SLIDE_NUM }, updateSlide);
    }
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// https://www.w3schools.com/howto/howto_js_draggable.asp
function makeDraggableSlide(elmnt) {
  elmnt.onmousedown = dragMouseDown;
  var slide1   = -1;
  var slide2   = -1;
  var disabled = false;

  var x1, y1;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    // reset values
    slide1   = -1;
    slide2   = -1;
    disabled = false;
    x1       = e.clientX;
    y1       = e.clientY;

    var slides = document.getElementsByClassName("slide");
    var i = 0;
    for (slide of slides) {
      if (slide == elmnt) slide1 = i;
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
    if (!disabled && (((x1-x)*(x1-x) + (y1-y)*(y1-y)) > 50)) {
      var slides = document.getElementsByClassName("slide");
      for (slide of slides) {
        slide.setAttribute("class", "slide disabled");
      }
      disabled = true;
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
      sendCommand("MOVE_SLIDE", { Slide1: slide1, Slide2: slide2 }, doNothing);
      selectSlide(slide2);
    }
  }
}

function makeDraggableLabel(elmnt) {
  elmnt.onmousedown = dragMouseDown;
  var x1, y1, x2, y2;
  var slide, label;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    slide = document.getElementById("Slide").getBoundingClientRect();
    label = elmnt.getBoundingClientRect();
    x1    = e.clientX;
    y1    = e.clientY;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    x2 = e.clientX;
    y2 = e.clientY;

    var dx = x2 - x1;
    var dy = y2 - y1;

    var x = label.left + dx;
    var y = label.top  + dy;

    if (x < slide.left)                   x = slide.left;
    if (x + label.width >= slide.right)   x = slide.right  - label.width;
    if (y < slide.top)                    y = slide.top;
    if (y + label.height >= slide.bottom) y = slide.bottom - label.height;

    elmnt.style.left = x - slide.left + "px";
    elmnt.style.top  = y - slide.top  + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;

    label = elmnt.getBoundingClientRect();

    var px = (label.left - slide.left) / slide.width  * 100.0;
    var py = (label.top  - slide.top ) / slide.height * 100.0;

    elmnt.style.left = px + "%";
    elmnt.style.top  = py + "%";

    sendCommand('UP_LPOS', { LabelID: elmnt.id.substring(14), X: px, Y: py }, doNothing);
  }
}