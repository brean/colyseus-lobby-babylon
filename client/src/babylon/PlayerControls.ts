import * as BABYLON from 'babylonjs'
import { Room } from 'colyseus.js'
import VirtualJoystick from './VirtualJoystick'

// System dependend Controls: Keyboard or (Virtual) Joystick controls

export default class PlayerControls {
  room: Room

  scene: BABYLON.Scene
  canvas: HTMLCanvasElement
  
  sticks: boolean = false
  leftStick: VirtualJoystick|undefined = undefined
  rightStick: VirtualJoystick|undefined = undefined
  
  keyboard: boolean = false
  inputMap = new Map<string, boolean>()

  constructor (scene: BABYLON.Scene, room: Room, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.room = room;
    this.canvas = canvas;
    if (this.isMobile()) {
      this.initVirtualJoystick();
    } else {
      this.initKeyboard();
      // TODO: initMouse
    }

    scene.onBeforeRenderObservable.add(this.updateInputs.bind(this));
  }

  initVirtualJoystick () {
    this.leftStick = new VirtualJoystick(this.canvas);
    this.rightStick = new VirtualJoystick(this.canvas, "red", false);
    this.sticks = true;
  }

  updateInputs() {
    const linear: {x: number, y: number, z: number} = { x: 0, y: 0, z: 0 };
    let rotation: number = 0.0
    let input:boolean = false
    if (this.keyboard) {
      if (this.inputMap.get('w')) {
        input = true
        linear.x += -1;
        linear.z += 1;
      } else if (this.inputMap.get('s')) {
        input = true
        linear.x += 1;
        linear.z += -1;
      }
      if (this.inputMap.get('a')) {
        input = true
        linear.x += -1;
        linear.z += -1;
      } else if (this.inputMap.get('d')) {
        input = true
        linear.x += 1;
        linear.z += 1;
      }

      if (this.inputMap.get('ArrowLeft')) {
        input = true
        rotation = -1;
      } else if (this.inputMap.get('ArrowRight')) {
        input = true
        rotation = 1; 
      }
    }
    if (this.sticks && !input) {
      if (this.leftStick) {
        linear.x += this.leftStick.posX/40;
        linear.z += this.leftStick.posY/40;
      }
      if (this.rightStick) {
        rotation = this.rightStick.posX/40;
      }
    }
      const velocity = {linear, rotation}
      if (this.room) {
        this.room.send('velocity', velocity);
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
