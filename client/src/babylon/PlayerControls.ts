import * as BABYLON from 'babylonjs'
import { Room } from 'colyseus.js'
import VirtualJoystick from './VirtualJoystick'
import Game from './Game'

// System dependend Controls: Keyboard or (Virtual) Joystick controls

export default class PlayerControls {
  room: Room
  
  engine: BABYLON.Engine
  scene: BABYLON.Scene
  canvas: HTMLCanvasElement
  
  sticks: boolean = false
  leftStick: VirtualJoystick|undefined = undefined
  
  keyboard: boolean = false
  inputMap: Map<string, boolean> = new Map<string, boolean>()

  orientation: number = 0.0

  constructor (game: Game) {
    this.scene = game.scene;
    this.canvas = game.canvas;
    this.engine = game.engine;
    this.room = game.room;
    if (this.isMobile()) {
      this.initVirtualJoystick();
    } else {
      this.initKeyboard();
      this.initMouse();
    }

    this.scene.onBeforeRenderObservable.add(this.updateInputs.bind(this));
  }

  initMouse() {
    this.scene.onPointerObservable.add(
      this.onPointerMove.bind(this),
      BABYLON.PointerEventTypes.POINTERMOVE);
  }

  onPointerMove() {
    const x = this.scene.pointerX;
    const y = this.scene.pointerY;
    const width = this.engine.getRenderWidth();
    const height = this.engine.getRenderHeight()
    const mouseVec = new BABYLON.Vector3(x, y, 0);
    mouseVec.x = (mouseVec.x * 2) / width - 1;
    mouseVec.y = (mouseVec.y * 2) / height - 1;
    this.orientation = Math.atan2(mouseVec.y, mouseVec.x);
  }

  initVirtualJoystick () {
    this.leftStick = new VirtualJoystick(this.canvas);
    this.sticks = true;
  }

  updateInputs() {
    let speed: number = 0.0
    const speedMultiplier = 0.2
    let input:boolean = false
    // keyboard control
    if (this.keyboard) {
      if (this.inputMap.get('ArrowUp')) {
        input = true
        speed = speedMultiplier
      } else if (this.inputMap.get('ArrowDown')) {
        input = true
        speed = -speedMultiplier
      }
      else if (this.inputMap.get('w')) {
        input = true
        speed = speedMultiplier
      } else if (this.inputMap.get('s')) {
        input = true
        speed = -speedMultiplier
      }
    }
    // virtual joystick control
    if (this.leftStick && !input) {
      speed = Math.sqrt(
        Math.pow(this.leftStick.posX/40, 2) +
        Math.pow(this.leftStick.posY/40, 2)
      )
      speed *= speedMultiplier;
      
      this.orientation = -Math.atan2(
        this.leftStick.posY/40,
        this.leftStick.posX/40)
    }
    const movement = {
      speed: speed, 
      orientation: this.orientation
    }
    if (this.room) {
      this.room.send('move', movement);
    }
  }

  initKeyboard () {
    const scene = this.scene;
    this.keyboard = true;
    // setup player controls
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        this.inputMap.set(evt.sourceEvent.key, evt.sourceEvent.type === "keydown")
      }
    ));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
        this.inputMap.set(evt.sourceEvent.key, evt.sourceEvent.type === "keydown");
      }
    ));
  }

  isMobile () {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}
