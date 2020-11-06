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
      DM.interface = new Interface(socket);

      // Lorsque la connexion se termine.
      this.onclose = function(event) {
          console.log("Connection closed");
          DM.interface = null;
          socket       = null;
      };

      // Lorsque le serveur envoi un message.
      this.onmessage = function(event) {
        var response = new WebSocketResponse(new Uint8Array(event.data));
        DM.interface.update(response);
      };
      
      var init = new Uint8Array(1);
      init[0]  = PHILIPONT_MAGIC_ID;
      this.binaryType = "arraybuffer";
      this.send(init);
  };
}

function startDisplay() {
  const scene = new Scene(document.getElementById("Drawing"));
  DM.scene = scene;
  DM.setFrameRateDisplay(document.getElementById("Pos"));
  DM.start();
}

function load() {
  DM.interface.load();
}

function toggleAnimation() {
  if (DM.scene === null) return;
  DM.animate = !DM.animate;
}

function toggleGrid() {
  if (DM.scene === null) return;
  DM.scene.toggleGridOn();
}

function toggleGridHD() {
  if (DM.scene === null) return;
  DM.scene.toggleGridHD();
}

function translateXY(event) {
  if (DM.scene === null) return;
  var e = event || window.event;
  var step = 0.1;
  // Clone the translation vector to trigger the hasChanged method
  var nTranslation = vec3.fromValues(0, 0, 0);
  switch (e.keyCode) {
    case 37: // LEFT
      nTranslation[0] += step;
      break;
    case 38: // UP
      nTranslation[1] -= step;
      break;
    case 39: // RIGHT
      nTranslation[0] -= step;
      break;
    case 40: // DOWN
      nTranslation[1] += step;
      break;
    case 82: // R
      nTranslation = null;
      DM.scene.setRotation(null, null);
  }
  DM.scene.setTranslation(nTranslation);
}

function translateZ(event) {
  if (DM.scene === null) return;
  var e = event || window.event;
  var nTranslation = vec3.fromValues(0, 0, 0);
  nTranslation[2] -= e.deltaY / 10.0;
  DM.scene.setTranslation(nTranslation);
}

function startMovingSun(event) {
  if (DM.scene === null) return;
  var e = event || window.event;
  if (e.which == 1) {
    document.getElementById("SunDial").onmousemove = moveSun;
    document.onmouseup = stopMovingSun;
    moveSun(event);
  }
}

function moveSun(event) {
  if (DM.scene === null) return;
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
    sunVector = vec3.fromValues(xc, Math.sqrt(80 * 80 - r * r), yc);
  } else {
    var nr = 160 - r;
    sunVector = vec3.fromValues(xc, -Math.sqrt(80 * 80 - nr * nr), yc);
  }
  DM.scene.setSun(sunVector);
}

function stopMovingSun() {
  if (DM.scene === null) return;
  document.getElementById("SunDial").onmousemove = null;
  document.onmouseup = null;
}

function canvasMouseDown(event) {
  if (DM.scene === null) return;
  var e = event || window.event;
  if (e.which == 1 && DM.scene.modEnabled && !DM.scene.rotEnabled) {
    DM.scene.setModApply(true);
  }
}

function canvasMouseUp(event) {
  if (DM.scene === null) return;
  var e = event || window.event;
  if (e.which == 2 || DM.scene.rotEnabled) {
    DM.scene.rotEnabled = !DM.scene.rotEnabled;
    DM.scene.previousCoords = null;
  }
  DM.scene.setModApply(false);
}

function canvasMouseMove(event) {
  if (DM.scene === null) return;
  var e = event || window.event;
  if (DM.scene.rotEnabled) {
    DM.scene.setRotation(e.clientX, e.clientY);
  } else if (DM.scene.modEnabled) {
    DM.scene.setMod(e.clientX, e.clientY);
  }
}