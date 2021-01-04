import * as BABYLON from 'babylonjs'
import { Room } from 'colyseus.js'
import VirtualJoystick from './VirtualJoystick'
import { GamepadManager } from 'babylonjs'

// System dependend Controls: Keyboard or (Virtual) Joystick controls

export default class InputControls {
  private room: Room
  
  private engine: BABYLON.Engine
  private scene: BABYLON.Scene
  private canvas: HTMLCanvasElement
  
  // Mobile controls
  private sticks: boolean = false
  private leftStick: VirtualJoystick|undefined = undefined
  
  // Keyboard controls
  private keyboard: boolean = false
  private inputMap: Map<string, boolean> = new Map<string, boolean>()

  // GamePad controls
  private gamepadManager: GamepadManager
  private gamepadInput = {x: 0.0, y: 0.0}
  private gamepadActive = false;

  private orientation: number = 0.0
  private speed: number = 0.0

  constructor (
      room:Room, engine:BABYLON.Engine, 
      scene:BABYLON.Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.canvas = canvas;
    this.engine = engine;
    this.room = room;
    
    this.gamepadManager = new GamepadManager();

    this.initGamepad();
    if (this.isMobile()) {
      this.initVirtualJoystick();
    } else {
      this.initKeyboard();
      this.initMouse();
    }
    this.scene.onBeforeRenderObservable.add(this.updateInputs.bind(this));
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

  // PC mouse & keyboard
  private initMouse() {
    this.scene.onPointerObservable.add(
      this.onPointerMove.bind(this),
      BABYLON.PointerEventTypes.POINTERMOVE);
  }

  private onPointerMove() {
    const x = this.scene.pointerX;
    const y = this.scene.pointerY;
    const width = this.engine.getRenderWidth();
    const height = this.engine.getRenderHeight()
    const mouseVec = new BABYLON.Vector3(x, y, 0);
    mouseVec.x = (mouseVec.x * 2) / width - 1;
    mouseVec.y = (mouseVec.y * 2) / height - 1;
    this.orientation = Math.atan2(mouseVec.y, mouseVec.x);
  }

  private initGamepad() {
    this.gamepadManager.onGamepadConnectedObservable.add((gamepad, state)=>{
      this.gamepadActive = true;
      gamepad.onleftstickchanged((values)=>{
        let x = values.x;
        let y = values.y;
        if (Math.abs(x) < .2 && Math.abs(y) < .2 ) {
          x = 0;
          y = 0;
        }
        this.gamepadInput.x = x;
        this.gamepadInput.y = y;
      });
    });
    this.gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state)=>{
      this.gamepadActive = false;
    });
  }

  // Mobile Phone/Pad
  private initVirtualJoystick () {
    this.leftStick = new VirtualJoystick(this.canvas);
    this.sticks = true;
  }

  private updateInputs() {
    this.speed = 0.0
    const speedMultiplier = 0.2
    let input:boolean = false
    // keyboard control
    if (this.keyboard) {
      if (this.inputMap.get('ArrowUp') || this.inputMap.get('w')) {
        input = true
        this.speed = speedMultiplier
      } else if (this.inputMap.get('ArrowDown') || this.inputMap.get('s')) {
        input = true
        this.speed = -speedMultiplier
      }
    }
    // virtual joystick control
    if (this.leftStick && !input) {
      this.calcSpeedAndOrientation(
        this.leftStick.posX/40,
        this.leftStick.posY/40);
    }
    // game pad
    if (this.gamepadActive && !input) {
      this.calcSpeedAndOrientation(
        this.gamepadInput.x,
        -this.gamepadInput.y);
    }
    const movement = {
      speed: this.speed, 
      orientation: this.orientation
    }
    if (this.room) {
      this.room.send('move', movement);
    }
  }

  private calcSpeedAndOrientation(x: number, y: number, speedMultiplier = 0.2) {
    let speed = 0.0
    if (Math.abs(x) > 0 && Math.abs(y) > 0) {
      speed = Math.sqrt(
        Math.pow(x, 2) +
        Math.pow(y, 2)
      )
      speed *= speedMultiplier;
      if (speed > 0) {
        this.speed = speed;
        this.orientation = -Math.atan2(y, x)
      }
    }
  }

  private isMobile () {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}