class DisplayManager {
  constructor() {
    this.frameRateDisplay = null;
    this.targetFrameRate  = 30;
    this.animateEnv       = false;
    this.rotEnabled       = false;
    this.modEnabled       = false;
    this.modSubstract     = true;
    this.modApply         = false;
    this.maxTranslation   = 10;
    this.maxZoom          = -6;
    this.previousCoords   = null;
    this.display          = null;
    this.stateVariables   = {};
    this.addStateVariable("level",        null);
    this.addStateVariable("gridOn",       null);
    this.addStateVariable("gridHD",       null);
    this.addStateVariable("sunPosition",  null);
    this.addStateVariable("mouseRay",     null);
    this.addStateVariable("rotation",     null);
    this.addStateVariable("translation",  null);
  }

  addStateVariable(name, value) {
    this.stateVariables[name] = { actual: value, previous: null, hasChanged: false };
  }

  setStateVariable(name, value) {
    this.stateVariables[name].actual = value;
  }

  getStateVariable(name) {
    return this.stateVariables[name].actual;
  }

  syncStateVariables() {
    for (var variable of Object.values(this.stateVariables)) {
      variable.hasChanged = variable.actual != variable.previous;
      variable.previous = variable.actual;
    }
  }

  setFrameRateDisplay(div) {
    this.frameRateDisplay = div;
  }

  async start() {
    while (true) {
      var ticks = new Date().getTime();
      var buffers  = false;
      var shadows  = false;
      var scene    = false;
      await new Promise(resolve => setTimeout(resolve, 1000 / this.targetFrameRate));
      this.syncStateVariables();
      if (this.animateEnv) {
        buffers = true;
        shadows = true;
        scene   = true;
      } else if (this.modEnabled                              &&
                 this.stateVariables.mouseRay.actual !== null &&
                (this.stateVariables.mouseRay.hasChanged      ||
                 this.modApply)) {
        buffers = true;
        shadows = true;
        scene   = true;
      } else if (this.stateVariables.level.hasChanged) {
        buffers = true;
        shadows = true;
        scene   = true;
      } else if (this.stateVariables.gridOn.hasChanged) {
        buffers = true;
        shadows = true;
        scene   = true;
      } else if (this.stateVariables.gridHD.hasChanged) {
        buffers = true;
        shadows = true;
        scene   = true;
      } else if (this.stateVariables.sunPosition.hasChanged) {
        shadows = true;
        scene   = true;
      } else if (this.rotEnabled && this.stateVariables.rotation.hasChanged) {
        scene = true;
      } else if (this.stateVariables.translation.hasChanged) {
        scene = true;
      }
      if (buffers) {
        // do update buffers
      }
      if (shadows) {
        // do update shadows
      }
      if (scene) {
        // do update scene
      }
      ticks = new Date().getTime() - ticks;
      if (this.frameRateDisplay !== null) this.frameRateDisplay.innerHTML = (1000 / ticks).toFixed(1) + " FPS";
      if (ticks > 500) {
        console.log("The rendering function was stopped because the frame rate was too low!");
        break;
      }
    }
  }
}

const DM = new DisplayManager();
