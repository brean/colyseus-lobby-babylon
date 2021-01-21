import * as BABYLON from 'babylonjs'
import { Room } from 'colyseus.js'
import VirtualJoystick from './VirtualJoystick'
import { GamepadManager } from 'babylonjs'
import UIManager from './UIManager'
import VirtualButton from './VirtualButton'

// System dependend Controls: Keyboard or (Virtual) Joystick controls

export default class InputControls {
  private room: Room
  
  private engine: BABYLON.Engine
  private scene: BABYLON.Scene
  private ui: UIManager
  
  // Mobile controls
  private sticks: boolean = false
  private leftStick?: VirtualJoystick
  private jumpButton?: VirtualButton
  
  // Keyboard controls
  private keyboard: boolean = false
  private inputMap: Map<string, boolean> = new Map<string, boolean>()

  // GamePad controls
  private gamepadManager: GamepadManager
  private gamepadInput = {x: 0.0, y: 0.0, jump: false}
  private gamepadActive = false;

  private orientation: number = 0.0
  private speed: number = 0.0
  private jump: boolean = false;
  

  constructor (
      room:Room, engine:BABYLON.Engine, 
      scene:BABYLON.Scene, ui:UIManager) {
    this.scene = scene;
    this.ui = ui;
    this.engine = engine;
    this.room = room;
    
    this.gamepadManager = new GamepadManager();

    this.initGamepad();
    if (this.isMobile()) {
      this.initMobileControls();
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
      // TODO: button down this.gamepadInput.jump = false;
      if (gamepad instanceof BABYLON.Xbox360Pad) {
        console.log('Xbox 360 Pad')
        gamepad.onButtonDownObservable.add((button, state)=>{
          if (button === BABYLON.Xbox360Button.A) {
            this.gamepadInput.jump = true
          }
        })
        gamepad.onButtonUpObservable.add((button, state)=>{
          if (button === BABYLON.Xbox360Button.A) {
            this.gamepadInput.jump = false
          }
        })
      } else if (gamepad instanceof BABYLON.DualShockPad) {
        console.log('DualShock Pad')
        gamepad.onButtonDownObservable.add((button, state)=>{
          if (button === BABYLON.DualShockButton.Cross) {
            this.gamepadInput.jump = true
          }
        })
        gamepad.onButtonUpObservable.add((button, state)=>{
          if (button === BABYLON.DualShockButton.Cross) {
            this.gamepadInput.jump = false
          }
        })
      } else if (gamepad instanceof BABYLON.GenericPad) {
        console.log('Generic Pad')
        gamepad.onButtonDownObservable.add((button, state)=>{
          if (button === 0) {
            this.gamepadInput.jump = true
          }
        })
        gamepad.onButtonUpObservable.add((button, state)=>{
          if (button === 0) {
            this.gamepadInput.jump = false
          }
        })
      } else if (gamepad instanceof BABYLON.GenericController) {
        console.log('Generic Controller')
        gamepad.onButtonStateChange((controller, button, state) => {
          if (button === 0) {
            this.gamepadInput.jump = state.pressed;
          }
        })
      } else {
        console.log('unknown controller! can not jump!')
      }

    });
    this.gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state)=>{
      this.gamepadActive = false;
    });
  }

  // Mobile Phone/Pad
  private initMobileControls () {
    this.leftStick = new VirtualJoystick(this.ui);
    this.jumpButton = new VirtualButton(this.ui, 'blue', false);
    this.sticks = true;
  }

  private updateInputs() {
    this.speed = 0.0
    const speedMultiplier = 0.2
    this.jump = false;
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
      if (this.inputMap.get(' ')) {
        input = true
        this.jump = true
      }
    }
    // virtual joystick control
    if (this.leftStick && !input) {
      this.jump = this.jumpButton?.pressed || false
      this.calcSpeedAndOrientation(
        this.leftStick.posX/40,
        this.leftStick.posY/40);
    }
    // game pad
    if (this.gamepadActive && !input) {
      this.jump = this.gamepadInput.jump;
      this.calcSpeedAndOrientation(
        this.gamepadInput.x,
        -this.gamepadInput.y);
    }
    const movement = {
      speed: this.speed, 
      orientation: this.orientation,
      jump: this.jump
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
