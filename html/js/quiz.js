_PRESID      = 0;
_PASSHASH    = 0;
_SLIDE_RATIO = 4/3;
_TOTAL       = 0;
_SLIDE_NUM   = -1;
_LABEL_NUM   = -1;
_IMAGE_NUM   = -1;
_SAMPLE_NUM  = -1;
_AUDIO_STOP  = null;

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
  options(tr_sel);
}

function options(tr) {
  var join    = document.getElementById("Join");
  var present = document.getElementById("Present");
  var edit    = document.getElementById("Edit");
  if (tr) {
    var presenting = tr.getAttribute("value") == "1";
    join.hidden    = !presenting;
    present.hidden = false;
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
  var lang   = getCookie("Language");
  var pass   = prompt(lang == "FR" ? "Entrez le mot de passe de la présentation:" : "Enter the password for this presentation", "");
  var form   = document.getElementById("NextPage");
  var inputs = form.getElementsByTagName("input");
  if (pass == "") return;
  form.setAttribute("action", "present.php");
  inputs[0].value = _PRESID;
  inputs[1].value = pass;
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
  
  if (_PASSHASH == "NO_EDIT") xhttp.timeout = 60000;
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

function updateSlidesNoEdit(numslides) {
  var sc = document.getElementById("SlidesContainer");

  for (var i = 0; i < numslides; i++) {
    sc.innerHTML += `<div class="slide" onclick="selectSlideNoEdit(${i})">${i}</div>`;
  }
  if (_SLIDE_NUM == -1) selectSlideNoEdit(0);
  _TOTAL = numslides;
}

function selectPrev() {
  if (_SLIDE_NUM > 0) {
    selectSlideNoEdit(_SLIDE_NUM - 1);
  }
}

function selectNext() {
  if (_SLIDE_NUM + 1 < _TOTAL) {
    selectSlideNoEdit(_SLIDE_NUM + 1);
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

function selectSlideNoEdit(position) {
  _SLIDE_NUM = position;
  if (position >=0) {
    var slides = document.getElementsByClassName("slide");
    for (var slide of slides) {
      if (slide.innerHTML == position) slide.setAttribute("selected", "1");
      else slide.setAttribute("selected", "0");
    }
    sendCommand("UP_SLIDE_NE", { SlidePosition: position }, updateSlideNoEdit)
    displaySlide();
  }
}

function continuousUpdate(slideInfo) {
  if (slideInfo) updateSlideNoEdit(slideInfo);
  sendCommand("UP_CUR_SLIDE", null, continuousUpdate);
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
      slide.innerHTML += `<div id="LabelContainer${element[1]}" class="labelContainer" onfocusin="selectLabel(${element[1]})" onclick="event.stopPropagation()" ` +
                         `style="left:${element[5]}%;top:${element[6]}%">\n<div id="Label${element[1]}" class="label" onfocusout="sendText()"` +
                         `style="color:${element[3]};font-size:${fontSize}" fontsize="${element[4]}" posx="${element[5]}" posy="${element[6]}" contenteditable="true" ` +
                         `onmousedown="event.stopPropagation()">${decodeURIComponent(element[2])}</div>\n</div>`;
    } else if (element[0] == "I") {
      slide.innerHTML += `<div id="ImageContainer${element[1]}" class="imageContainer" onfocusin="selectImage(${element[1]})" ` +
                         `style="left:${element[3]}%;top:${element[4]}%;width:${element[5]}%;height:${element[6]}%" onclick="event.stopPropagation()">` +
                         `<img imageid="${element[1]}" style="width:100%;height:100%" src="${decodeURIComponent(element[2])}"></img>` +
                         `<div imageid="${element[1]}" class="resizer"></div></div>`;
    } else if (element[0] == "S") {
      slide.innerHTML += `<div id="SampleContainer${element[1]}" class="sampleContainer" onfocusin="selectSample(${element[1]})" ` +
                         `style="left:${element[5]}%;top:${element[6]}%" onclick="event.stopPropagation()">` +
                         `<audio sampleid="${element[1]}" preload="auto" src="${decodeURIComponent(element[2])}" ` +
                         ` start="${element[3]}" end="${element[4]}"></audio>` +
                         "</div>";
    }
  }
  for (var labelContainer of document.getElementsByClassName("labelContainer")) {
    var label = labelContainer.getElementsByClassName("label")[0];
    if (label.innerHTML == "") labelContainer.style.border = "2px dashed blue";
    makeDraggableLabel(labelContainer);
  }
  for (var imageContainer of document.getElementsByClassName("imageContainer")) {
    makeDraggableImage(imageContainer);
  }
  for (var sampleContainer of document.getElementsByClassName("sampleContainer")) {
    makeDraggableSample(sampleContainer);
  }
}

function updateSlideNoEdit(slideInfo) {
  var slide    = document.getElementById("Slide");
  var elements = slideInfo.split(';');

  if (_PASSHASH != "NO_EDIT") document.getElementById("SlideCommentText").value = decodeURIComponent(elements[0]);
  slide.innerHTML = "";

  for (var i = 1; i < elements.length; i++) {
    var element = elements[i].split(':');
    if (element[0] == "L") {
      var fontSize = document.getElementById("Slide").clientWidth * element[4] / 1000.0 + "px";
      slide.innerHTML += `<div id="LabelContainer${element[1]}" class="labelContainerNoEdit" ` +
                         `style="left:${element[5]}%;top:${element[6]}%">\n<div id="Label${element[1]}" class="labelNoEdit" ` +
                         `style="color:${element[3]};font-size:${fontSize}" fontsize="${element[4]}" posx="${element[5]}" posy="${element[6]}" ` +
                         `>${decodeURIComponent(element[2])}</div>\n</div>`;
    } else if (element[0] == "I") {
      slide.innerHTML += `<div id="ImageContainer${element[1]}" class="imageContainerNoEdit" ` +
                         `style="left:${element[3]}%;top:${element[4]}%;width:${element[5]}%;height:${element[6]}%">` +
                         `<img imageid="${element[1]}" style="width:100%;height:100%" src="${decodeURIComponent(element[2])}"></img>` +
                         `</div>`;
    } else if (element[0] == "S") {
      slide.innerHTML += `<div id="SampleContainer${element[1]}" class="sampleContainer" ` +
                         `style="left:${element[5]}%;top:${element[6]}%" onclick="playSample(this)">` +
                         `<audio sampleid="${element[1]}" preload="auto" src="${decodeURIComponent(element[2])}" ` +
                         ` start="${element[3]}" end="${element[4]}"></audio>` +
                         "</div>";
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
    var labelContainer = document.getElementById("LabelContainer" + _LABEL_NUM);
    var label = labelContainer.getElementsByClassName("label")[0];
    // leftover <br> sometimes
    if (label.innerHTML == "" || label.innerHTML == "<br>") labelContainer.style.border = "2px dashed blue";
    else                                                    labelContainer.style.border = null;
    label.blur();
    hideLabelOptions();
  }
  if (_IMAGE_NUM != -1) {
    document.getElementById("ImageContainer" + _IMAGE_NUM).style.border = "none";
    hideImageOptions();
  }
  if (_SAMPLE_NUM != -1) {
    document.getElementById("SampleContainer" + _SAMPLE_NUM).style.border = "none";
    hideSampleOptions();
  }
}

function selectLabel(labelid) {
  if (_LABEL_NUM != labelid) {
    deselect();
    showLabelOptions(labelid);
  }
}

function showLabelOptions(labelid) {
  _LABEL_NUM = labelid;
  document.getElementById("DelLabel").hidden     = false;
  document.getElementById("ColorPalette").hidden = false;
  document.getElementById("FontSize").hidden     = false;
  document.getElementById("FontSizeInput").value = document.getElementById("Label" + labelid).getAttribute("fontsize");
  var labelContainer = document.getElementById("LabelContainer" + labelid);
  labelContainer.style.border = "1px dashed red";
  labelContainer.setAttribute("onfocusin", "");
  document.getElementById("Label" + labelid).focus();
  labelContainer.setAttribute("onfocusin", "deselect();showLabelOptions(" + labelid + ")");
}

function selectImage(imageid) {
  if (_IMAGE_NUM != imageid) {
    deselect();
    showImageOptions(imageid);
  }
}

function showImageOptions(imageid) {
  _IMAGE_NUM = imageid;
  document.getElementById("DelImage").hidden = false;
  document.getElementById("ImageContainer" + imageid).style.border = "1px solid red";
}

function selectSample(sampleid) {
  if (_SAMPLE_NUM != sampleid) {
    deselect();
    showSampleOptions(sampleid);
  }
}

function showSampleOptions(sampleid) {
  var sample      = document.getElementById("SampleContainer" + sampleid);
  var audio       = sample.getElementsByTagName("audio")[0];
  _SAMPLE_NUM = sampleid;
  document.getElementById("DelSample").hidden = false;
  sample.style.border = "1px solid red";
  document.getElementById("SampleStart").hidden     = false
  document.getElementById("SampleStartInput").value = audio.getAttribute("start");
  document.getElementById("SampleEnd").hidden       = false;
  document.getElementById("SampleEndInput").value   = audio.getAttribute("end");
}

function deleteLabel() {
  var lang = getCookie("Language");
  if (confirm(lang == "FR" ? "Êtes-vous certain?" : "Are you sure?")) {
    sendCommand('DEL_LABEL', { LabelID: _LABEL_NUM, SlidePosition: _SLIDE_NUM }, updateSlide);
    hideLabelOptions();
  }
}

function deleteImage() {
  var lang = getCookie("Language");
  if (confirm(lang == "FR" ? "Êtes-vous certain?" : "Are you sure?")) {
    sendCommand('DEL_IMAGE', { ImageID: _IMAGE_NUM, SlidePosition: _SLIDE_NUM }, updateSlide);
    hideImageOptions();
  }
}

function deleteSample() {
  var lang = getCookie("Language");
  if (confirm(lang == "FR" ? "Êtes-vous certain?" : "Are you sure?")) {
    sendCommand('DEL_SAMPLE', { SampleID: _SAMPLE_NUM, SlidePosition: _SLIDE_NUM }, updateSlide);
    hideSampleOptions();
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

function hideImageOptions() {
  _IMAGE_NUM = -1;
  document.getElementById("DelImage").hidden = true;
}

function hideSampleOptions() {
  _SAMPLE_NUM = -1;
  document.getElementById("DelSample").hidden   = true;
  document.getElementById("SampleStart").hidden = true;
  document.getElementById("SampleEnd").hidden   = true;
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

function sendSampleStart() {
  var container = document.getElementById("SampleContainer" + _SAMPLE_NUM);
  var audio     = container.getElementsByTagName("audio")[0];
  var start     = document.getElementById("SampleStartInput").value;

  audio.pause();
  audio.setAttribute("start", start);
  clearTimeout(_AUDIO_STOP);
  sendCommand('UP_SSTART', { SampleID: _SAMPLE_NUM, Start: start }, doNothing);
}

function sendSampleEnd() {
  var container = document.getElementById("SampleContainer" + _SAMPLE_NUM);
  var audio     = container.getElementsByTagName("audio")[0];
  var end       = document.getElementById("SampleEndInput").value;

  audio.pause();
  audio.setAttribute("end", end);
  clearTimeout(_AUDIO_STOP);
  sendCommand('UP_SEND', { SampleID: _SAMPLE_NUM, End: end }, doNothing);
}

function newImage() {
  document.getElementById("ImagePrompt").hidden = false;
  document.getElementById("ImagePID").value = _PRESID;
  document.getElementById("ImageSID").value = _SLIDE_NUM;
  document.getElementById("ImageForm").submit();
  document.getElementById("IRetryButton").hidden = true;
}

function newSample() {
  document.getElementById("SamplePrompt").hidden = false;
  document.getElementById("SamplePID").value = _PRESID;
  document.getElementById("SampleSID").value = _SLIDE_NUM;
  document.getElementById("SampleForm").submit();
  document.getElementById("SRetryButton").hidden = true;
}

function checkImage() {
  var iframe = document.getElementById("ImagePrompt").getElementsByTagName("iframe")[0];
  var result = iframe.contentWindow.document.getElementById("Result");
  if (iframe.contentWindow.document.getElementsByClassName("error").length) {
    document.getElementById("IRetryButton").hidden = false;
  } else if (result) {
    if (result.value != "") {
      document.getElementById("ImagePrompt").hidden = true;
      sendCommand("UP_SLIDE", { SlidePosition: _SLIDE_NUM }, updateSlide);
    }
  }
}

function checkSample() {
  var iframe = document.getElementById("SamplePrompt").getElementsByTagName("iframe")[0];
  var result = iframe.contentWindow.document.getElementById("Result");
  if (iframe.contentWindow.document.getElementsByClassName("error").length) {
    document.getElementById("SRetryButton").hidden = false;
  } else if (result) {
    if (result.value != "") {
      document.getElementById("SamplePrompt").hidden = true;
      sendCommand("UP_SLIDE", { SlidePosition: _SLIDE_NUM }, updateSlide);
    }
  }
}

function playSample(sample) {
  var audio = sample.getElementsByTagName("audio")[0];
  if (audio.paused) {
    var duration = audio.getAttribute("end") - audio.getAttribute("start");
    audio.currentTime = audio.getAttribute("start");
    audio.play();
    if (duration > 0) {
      setTimeout(function() { audio.pause(); }, duration * 1000);
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
      if (separator.id == "Separator" + slide1) continue;
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
      elmnt.hidden = true;
      disabled = true;
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup   = null;
    document.onmousemove = null;

    elmnt.hidden = false;
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
      sendCommand("MOVE_SLIDE", { Slide1: slide1, Slide2: slide2 }, param => selectSlide(slide2)); 
    }
  }
}

function makeDraggableLabel(elmnt) {
  elmnt.onmousedown = dragMouseDown;
  var x1, y1, x2, y2;
  var slide, label;
  var id = elmnt.id.substring(14);

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    selectLabel(id);
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
    document.onmouseup   = null;
    document.onmousemove = null;

    label = elmnt.getBoundingClientRect();

    var px = (label.left - slide.left) / slide.width  * 100.0;
    var py = (label.top  - slide.top ) / slide.height * 100.0;

    elmnt.style.left = px + "%";
    elmnt.style.top  = py + "%";

    sendCommand('UP_LPOS', { LabelID: id, X: px, Y: py }, doNothing);
  }
}

function makeDraggableImage(elmnt) {
  elmnt.onmousedown = dragMouseDown;
  var x1, y1, x2, y2, ratio;
  var slide, image;
  var id = elmnt.id.substring(14);
  var resize = false;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    selectImage(id);
    slide  = document.getElementById("Slide").getBoundingClientRect();
    image  = elmnt.getBoundingClientRect();
    x1     = e.clientX;
    y1     = e.clientY;
    resize = false;

    if (x1 - 10 < image.right && x1 + 10 > image.right && y1 - 10 < image.bottom && y1 + 10 > image.bottom) {
      resize = true;
      ratio = image.width / image.height;
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    x2 = e.clientX;
    y2 = e.clientY;

    var dx = x2 - x1;
    var dy = y2 - y1;

    if (resize) {
      var x = image.width  + dx;
      var y = image.height + dy;
      var d = x > y * ratio ? x : y * ratio;
      x = d;
      y = d / ratio;

      if (image.left + x >= slide.right)  { x = slide.right  - image.left; d = x;                            }
      if (image.top  + y >= slide.bottom) { y = slide.bottom - image.top;  if (y * ratio < d) d = y * ratio; }
  
      elmnt.style.width  = d         + "px";
      elmnt.style.height = d / ratio + "px";
    } else {
      var x = image.left + dx;
      var y = image.top  + dy;

      if (x < slide.left)                   x = slide.left;
      if (x + image.width >= slide.right)   x = slide.right  - image.width;
      if (y < slide.top)                    y = slide.top;
      if (y + image.height >= slide.bottom) y = slide.bottom - image.height;

      elmnt.style.left = x - slide.left + "px";
      elmnt.style.top  = y - slide.top  + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup   = null;
    document.onmousemove = null;

    image = elmnt.getBoundingClientRect();

    if (resize) {
      var px = image.width  / slide.width  * 100.0;
      var py = image.height / slide.height * 100.0;
  
      elmnt.style.width   = px + "%";
      elmnt.style.height  = py + "%";
  
      sendCommand('UP_ISIZE', { ImageID: id, SizeX: px, SizeY: py }, doNothing);
    } else {
      var px = (image.left - slide.left) / slide.width  * 100.0;
      var py = (image.top  - slide.top ) / slide.height * 100.0;

      elmnt.style.left = px + "%";
      elmnt.style.top  = py + "%";

      sendCommand('UP_IPOS', { ImageID: id, X: px, Y: py }, doNothing);
    }
  }
}

function makeDraggableSample(elmnt) {
  elmnt.onmousedown = dragMouseDown;
  var x1, y1, x2 = -1, y2 = -1;
  var slide, sample;
  var id = elmnt.id.substring(15);

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    selectSample(id);
    slide = document.getElementById("Slide").getBoundingClientRect();
    sample = elmnt.getBoundingClientRect();
    x1    = e.clientX;
    y1    = e.clientY;
    x2    = -1;
    y2    = -1;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    x2 = e.clientX;
    y2 = e.clientY;

    var dx = x2 - x1;
    var dy = y2 - y1;

    var x = sample.left + dx;
    var y = sample.top  + dy;

    if (x < slide.left)                    x = slide.left;
    if (x + sample.width >= slide.right)   x = slide.right  - sample.width;
    if (y < slide.top)                     y = slide.top;
    if (y + sample.height >= slide.bottom) y = slide.bottom - sample.height;

    elmnt.style.left = x - slide.left + "px";
    elmnt.style.top  = y - slide.top  + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup   = null;
    document.onmousemove = null;

    if (x2 == -1 && y2 == -1) {
      var audio = elmnt.getElementsByTagName("audio")[0];
      if (audio.paused) {
        var duration = audio.getAttribute("end") - audio.getAttribute("start");
        audio.currentTime = audio.getAttribute("start");
        audio.play();
        if (duration > 0) {
          _AUDIO_STOP = setTimeout(function() { audio.pause(); }, duration * 1000);
        }
      }
    } else {
      sample = elmnt.getBoundingClientRect();

      var px = (sample.left - slide.left) / slide.width  * 100.0;
      var py = (sample.top  - slide.top ) / slide.height * 100.0;

      elmnt.style.left = px + "%";
      elmnt.style.top  = py + "%";

      sendCommand('UP_SPOS', { SampleID: id, X: px, Y: py }, doNothing);
    }
  }
}