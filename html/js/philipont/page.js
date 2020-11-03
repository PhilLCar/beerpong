var philipont = null;

function connect() {
  var socket    = null;

  try {
    if (socket === null) {
      socket = new WebSocket("ws://" + window.location.hostname + ":8000");
    }
  } catch (exception) {
      alert("Failed to connect to server...");
  }

  socket.onerror = function(error) {
  };

  socket.onopen = function(event) {
      console.log("Connection established");
      philipont = new Philipont(socket);

      // Lorsque la connexion se termine.
      this.onclose = function(event) {
          console.log("Connection closed");
          philipont = null;
          socket    = null;
      };

      // Lorsque le serveur envoi un message.
      this.onmessage = function(event) {
        var response = new WebSocketResponse(new Uint8Array(event.data));
        philipont.update(response);
      };
      
      var init = new Uint8Array(1);
      init[0]  = PHILIPONT_MAGIC_ID;
      this.binaryType = "arraybuffer";
      this.send(init);
  };
}

function startDisplay() {
  const display = new Display(document.getElementById("Drawing"));
  DM.display = display;
  DM.setFrameRateDisplay(document.getElementById("Pos"));
  DM.start();
}

function load() {

}

function toggleAnimation() {
  DM.animateEnv = !DM.animateEnv;
}

function toggleGrid() {
  DM.stateVariables.gridOn.actual = !DM.stateVariables.gridOn.actual;
}

function toggleGridHD() {
  DM.stateVariables.gridHD.actual = !DM.stateVariables.gridHD.actual;
}

function translateXY(event) {
  var e = event || window.event;
  var step = 0.1;
  // Clone the translation vector to trigger the hasChanged method
  var nTranslation = null;
  var nRotation    = null;
  switch (e.keyCode) {
    case 37: // LEFT
      nTranslation = vec3.clone(DM.stateVariables.translation.actual);
      if (nTranslation[0] + step < DM.maxTranslation) nTranslation[0] += step;
      break;
    case 38: // UP
      nTranslation = vec3.clone(DM.stateVariables.translation.actual);
      if (nTranslation[1] + step > -DM.maxTranslation) nTranslation[1] -= step;
      break;
    case 39: // RIGHT
      nTranslation = vec3.clone(DM.stateVariables.translation.actual);
      if (nTranslation[0] + step > -DM.maxTranslation) nTranslation[0] -= step;
      break;
    case 40: // DOWN
      nTranslation = vec3.clone(DM.stateVariables.translation.actual);
      if (nTranslation[1] + step < DM.maxTranslation) nTranslation[1] += step;
      break;
    case 82: // R
      nTranslation = vec3.fromValues(0, 0, -6);
      nRotation    = vec3.fromValues(10, 0, 0);
  }
  if (nTranslation !== null) {
    DM.stateVariables.translation.actual = nTranslation;
  }
  if (nRotation !== null) {
    DM.stateVariables.rotation.actual = nRotation;
  }
}

function translateZ(event) {
  var e = event || window.event;
  var t = DM.stateVariables.translation.actual;
  var n = null;
  if (e.deltaY < 0) {
    if (t[2] - (e.deltaY / 10.0) <= DM.maxZoom) {
      n = vec3.clone(t);
      n[2] -= e.deltaY / 10.0;
    }
  } else {
    if (t[2] - (e.deltaY / 10.0) > DM.maxZoom) {
      n = vec3.clone(t);
      n[2] -= e.deltaY / 10.0;
    }
  }
  if (n !== null) {
    DM.stateVariables.translation = n;
  }
}

function startMovingSun(event) {
  var e = event || window.event;
  if (e.which == 1) {
    document.getElementById("SunDial").onmousemove = moveSun;
    moveSun(event);
  }
}

function moveSun(event) {
  var e = event || window.event;
  var sunDial = document.getElementById("SunDial").getBoundingClientRect();
  var sunIndicator = document.getElementById("SunIndicator");
  var x = e.clientX - sunDial.left - 1;
  var y = e.clientY - sunDial.top  - 1;
  var sdr = (sunDial.width  - 2) / 2;
  var xc = x - sdr;
  var yc = y - sdr;
  var r  = Math.sqrt(xc * xc + yc * yc);
  var maxr = sdr - 5;
  if (r > maxr) {
    var s = r / maxr;
    x = (xc = xc / s) + sdr;
    y = (yc = yc / s) + sdr;
  }
  sunIndicator.style.left = x - 5 + "px";
  sunIndicator.style.top  = y - 5 + "px";
  ///////////////////////////////////////
  var sunVector;
  if (r <= 80) {
    sunVector = vec3.fromValues(xc, -yc, Math.sqrt(80 * 80 - r * r));
  } else {
    var nr = 160 - r;
    sunVector = vec3.fromValues(xc, -yc, -Math.sqrt(80 * 80 - nr * nr));
  }
  vec3.normalize(sunVector, sunVector);
  DM.stateVariables.sunPosition.actual = sunVector;
}

function stopMovingSun() {
  document.getElementById("SunDial").onmousemove = null;
}

function canvasMouseDown(event) {
  var e = event || window.event;
  if (e.which == 1 && DM.modEnabled && !DM.rotEnabled) {
    DM.modApply = true;
  }
}

function canvasMouseUp(event) {
  var e = event || window.event;
  if (e.which == 2 || DM.rotEnabled) {
    DM.rotEnabled = !DM.rotEnabled;
    DM.previousCoords = null;
  }
  DM.modApply = false;
}

function canvasMouseMove(event) {
  var e = event || window.event;
  if (DM.rotEnabled) {
    DM.display.rotate(e);
  } else if (DM.modEnabled) {
    DM.display.mod(e);
  }
}