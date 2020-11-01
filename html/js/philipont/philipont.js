var _SOCKET = null;
var _LEVEL  = null;

var PHILIPONT_MAGIC_ID = 0x02;

var CMD_IDENT        = 0x0F
var CMD_NEW_LEVEL    = 0x00;
var CMD_LOAD_LEVEL   = 0x01;
var CMD_SAVE_LEVEL   = 0x02;
var CMD_UPDATE_LEVEL = 0x03;
var CMD_SIMULATE     = 0x10;
var CMD_PLAY         = 0x11;
var CMD_PAUSE        = 0x12;
var CMD_SPEED        = 0x13;

var ACK_IDENT        = 0xFF;
var ACK_NEW_LEVEL    = 0xF0;

var SKIN_EARTH = 0;
var SKIN_MARS  = 1;
var SKIN_MOON  = 2;
var SKIN_VENUS = 3;

var NODE_MAX_LINK = 32;
var LINK_MAX_NODE =  4;

function load() {
  identify(12, "01234567890123456789012345678901")
  //newLevel("WOOHOO!", "Phil za best");
}

function identify(userid, passhash) {
  if (passhash.length != 32) return;
  var request = new WebSocketRequest(_SOCKET);
  request.append(CMD_IDENT);
  request.append(userid, 32);
  request.append(passhash);
  request.send();
}

function newLevel(name, designer, terrainX, terrainZ, terrainRes) {
  if (name.length > 255 || designer.length > 255) return;
  if ((Math.floor(terrainX / terrainRes) + 1) * (Math.floor(terrainZ / terrainRes)) > 256 * 256) return;
  var request = new WebSocketRequest(_SOCKET);
  request.append(CMD_NEW_LEVEL);
  request.append(63, 32);
  request.append(name.length);
  request.append(name);
  request.append(designer.length);
  request.append(designer);
  request.append(terrainX,   64, false);
  request.append(terrainZ,   64, false);
  request.append(terrainRes, 64, false);
  request.send();
}

function parseLevel(response) {
  var level = {};
  var length;
  // Metadata
  level.lid      = response.get(WebSocketResponse.INT);
  level.uid      = response.get(WebSocketResponse.INT);
  length         = response.get(WebSocketResponse.UBYTE);
  level.name     = response.get(WebSocketResponse.STRING, length);
  length         = response.get(WebSocketResponse.UBYTE);
  level.designer = response.get(WebSocketResponse.STRING, length);
  level.auth     = response.get(WebSocketResponse.STRING, 32);
  // Terrain
  level.waterLevel   = response.get(WebSocketResponse.DOUBLE);
  level.terrainSizeX = response.get(WebSocketResponse.DOUBLE);
  level.terrainSizeZ = response.get(WebSocketResponse.DOUBLE);
  level.terrainRes   = response.get(WebSocketResponse.DOUBLE);
  level.terrain      = response.get(WebSocketResponse.CUSTOM,
                                    (Math.floor(level.terrainSizeX / level.terrainRes) + 1) *
                                    (Math.floor(level.terrainSizeZ / level.terrainRes) + 1),
                                    new vec3Converter());
  // Road
  level.roadSegments = response.get(WebSocketResponse.INT);
  level.road         = response.get(WebSocketResponse.CUSTOM,
                                    4 * level.roadSegments, new vec3Converter());
  // Environment
  level.skin        = response.get(WebSocketResponse.INT);
  level.atmoDensity = response.get(WebSocketResponse.DOUBLE);
  level.humidity    = response.get(WebSocketResponse.DOUBLE);
  level.windSpeed   = response.get(WebSocketResponse.CUSTOM, null, new vec3Converter());
  level.gravity     = response.get(WebSocketResponse.CUSTOM, null, new vec3Converter());
  // Bridge nodes
  level.nodes = [];
  length      = response.get(WebSocketResponse.SHORT);
  for (var i = 0; i < length; i++) {
    var node = {};
    node.id           = response.get(WebSocketResponse.INT);
    node.type         = response.get(WebSocketResponse.INT);
    node.nlinks       = response.get(WebSocketResponse.INT);
    node.position     = response.get(WebSocketResponse.CUSTOM, null, new vec3Converter());
    node.speed        = response.get(WebSocketResponse.CUSTOM, null, new vec3Converter());
    node.acceleration = response.get(WebSocketResponse.CUSTOM, null, new vec3Converter());
    node.links = [];
    for (var j = 0; j < node.nlinks && j < NODE_MAX_LINK; j++) {
      node.links.push(response.get(WebSocketResponse.SHORT));
    }
    level.nodes.push(node);
  }
  // Bridge links
  level.links = [];
  length      = response.get(WebSocketResponse.SHORT);
  for (var i = 0; i < length; i++) {
    var link = {};
    link.id           = response.get(WebSocketResponse.INT);
    link.material     = response.get(WebSocketResponse.INT);
    link.length       = response.get(WebSocketResponse.DOUBLE);
    link.longStress   = response.get(WebSocketResponse.DOUBLE);
    link.rotStress    = response.get(WebSocketResponse.DOUBLE);
    link.nodes = [];
    for (var j = 0; j < LINK_MAX_NODE; j++) {
      link.nodes.push(response.get(WebSocketResponse.SHORT));
    }
    level.links.push(link);
  }
  level.colors = null;
  return level;
}

function update(response) {
  switch (response.get(WebSocketResponse.UBYTE)) {
    case ACK_IDENT:
      newLevel("WOOHOO!", "Phil za best", 10.0, 10.0, 0.5);
      break;
    case ACK_NEW_LEVEL:
      _LEVEL = parseLevel(response);
      DM.level = _LEVEL;
      break;
  }
}

function connect() {
  try {
      // Connexion vers un serveur HTTP
      // prennant en charge le protocole WebSocket ("ws://").
      var sockaddr = window.location.hostname;
      _SOCKET = new WebSocket("ws://" + sockaddr + ":8000");
  } catch (exception) {
      alert("Failed to connect to server...");
  }

  // Récupération des erreurs.
  // Si la connexion ne s'établie pas,
  // l'erreur sera émise ici.
  _SOCKET.onerror = function(error) {
  };

  // Lorsque la connexion est établie.
  _SOCKET.onopen = function(event) {
      console.log("Connexion établie.");

      // Lorsque la connexion se termine.
      this.onclose = function(event) {
          console.log("Connexion terminée.");
      };

      // Lorsque le serveur envoi un message.
      this.onmessage = function(event) {
        var response = new WebSocketResponse(new Uint8Array(event.data));
        update(response);
      };
      
      var init = new Uint8Array(1);
      init[0]  = PHILIPONT_MAGIC_ID;
      this.binaryType = "arraybuffer";
      this.send(init);
  };
}

function vec3Converter() {
  this.typeSize = 3 * 8; // 3 doubles
  this.convert = function (array) {
    var f64 = new Float64Array(array.buffer);
    return glMatrix.vec3.fromValues(f64[0], f64[1], f64[2]);
  }
}