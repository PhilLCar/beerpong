const RENDER_BUFFERS  = 8;
const RENDER_ATMO     = 4;
const RENDER_SHADOWS  = 2;
const RENDER_SCENE    = 1;

class DisplayManager {
  constructor() {
    this.frameRateDisplay = null;
    this.targetFrameRate  = 30;
    this.scene            = null;
    this.stateVariables   = {};
    this.interface        = null;
    this.delta            = null;
    this.animate          = false;
    this.renderLevel      = 3;
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
      if (this.animate) {
        this.renderLevel = RENDER_BUFFERS;
        if (this.delta === null) this.delta = 0;
        else                     this.delta += 1 / this.targetFrameRate;
      } else {
        this.delta = null;
      }
      if (this.renderLevel >= RENDER_BUFFERS) {
        this.scene.updateBuffers(this.delta);
      }
      if (this.renderLevel >= RENDER_ATMO) {
        this.scene.atmosphere.drawAtmosphere();
      }
      if (this.renderLevel >= RENDER_SHADOWS) {
        this.scene.drawShadows();
      }
      if (this.renderLevel >= RENDER_SCENE) {
        this.scene.drawScene();
        this.scene.drawHDR();
      }
      this.renderLevel = 0;
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
