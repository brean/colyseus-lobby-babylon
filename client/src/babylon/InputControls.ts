import * as BABYLON from 'babylonjs'
import { Room } from 'colyseus.js'
import VirtualJoystick from './VirtualJoystick'
import { UIManager } from './UIManager'
import VirtualButton from './VirtualButton'
import GameSettings from './GameSettings'
import { Observable } from 'babylonjs'

// System dependend Controls: Keyboard or (Virtual) Joystick controls

enum ControllerType {
  Mobile,
  Gamepad,
  KeyboardMouse
}

class Controller {
  name: string = 'unknown controller';
  type: ControllerType;
  _active: boolean = true;
  onActiveChange: BABYLON.Observable<boolean> = new BABYLON.Observable<boolean>()

  get active() {
    return this._active;
  }

  set active(active: boolean) {
    this._active = active;
    this.onActiveChange.notifyObservers(active);
  }

  constructor(type: ControllerType) {
    this.type = type;
  }
}

class InputControls {
  private room: Room
  
  private engine: BABYLON.Engine
  private scene: BABYLON.Scene
  private ui: UIManager
  
  // Mobile controls
  private sticks: boolean = false
  private leftStick?: VirtualJoystick
  private aButton?: VirtualButton
  private bButton?: VirtualButton
  
  // Keyboard controls
  private keyboard: boolean = false
  private inputMap: Map<string, boolean> = new Map<string, boolean>()

  // GamePad controls
  private gamepadManager: BABYLON.GamepadManager
  // on the dualshock controller: cross = a, circle = b
  private gamepadInput = {x: 0.0, y: 0.0, a: false, b: false}
  private gamepadActive = false;

  private orientation: number = 0.0
  private speed: number = 0.0
  private aPressed: boolean = false;
  private bPressed: boolean = false;
  
  private gameSettings: GameSettings
  private gamepadController: Map<BABYLON.Gamepad, Controller> = new Map<BABYLON.Gamepad, Controller>();
  private mobile: boolean = false;
  public onButtonPressObservable = new Observable<string>()

  public canJumpInArea: boolean = true;

  constructor (
      room:Room, engine:BABYLON.Engine, 
      scene:BABYLON.Scene, ui:UIManager,
      gameSettings: GameSettings) {
    this.gameSettings = gameSettings
    this.scene = scene;
    this.ui = ui;
    this.engine = engine;
    this.room = room;
    
    this.gamepadManager = new BABYLON.GamepadManager();

    let controller;
    this.initGamepad();
    if (this.isMobile()) {
      this.mobile = true;
      controller = new Controller(ControllerType.Mobile);
      gameSettings.addController(controller);
      controller.onActiveChange.add((active) => {
        this.mobile = active
      })
      this.initMobileControls();
    } else {
      this.initKeyboard();
      this.initMouse();
      controller = new Controller(ControllerType.KeyboardMouse)
      gameSettings.addController(controller)
      controller.onActiveChange.add((active) => {
        this.keyboard = active;
      })
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
        const key = evt.sourceEvent.key
        this.inputMap.set(key, evt.sourceEvent.type === "keydown");
        if (key === 'q' || key === 'ArrowLeft') {
          this.onButtonPressObservable.notifyObservers('a')
        }
        if (key === 'e' || key === 'ArrowRight') {
          this.onButtonPressObservable.notifyObservers('b')
        }
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
    if (!this.keyboard) {
      return;
    }
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
    let nr = 0;
    this.gamepadManager.onGamepadConnectedObservable.add((gamepad, state)=>{
      const controller = new Controller(ControllerType.Gamepad);
      this.gamepadController.set(gamepad, controller);
      this.gamepadActive = true;
      gamepad.onleftstickchanged((values)=>{
        if (!controller.active) {
          return
        }
        let x = values.x;
        let y = values.y;
        if (Math.abs(x) < .2 && Math.abs(y) < .2 ) {
          x = 0;
          y = 0;
        }
        this.gamepadInput.x = x;
        this.gamepadInput.y = y;
      });
      if (gamepad instanceof BABYLON.Xbox360Pad) {
        controller.name = `Xbox 360 Pad (${++nr})`
        gamepad.onButtonDownObservable.add((button, state)=>{
          if (!controller.active) {
            return
          }
          if (button === BABYLON.Xbox360Button.A) {
            this.gamepadInput.a = true
          }
          if (button === BABYLON.Xbox360Button.B) {
            this.gamepadInput.b = true
          }
        })
        gamepad.onButtonUpObservable.add((button, state)=>{
          if (!controller.active) {
            return
          }
          if (button === BABYLON.Xbox360Button.A) {
            this.gamepadInput.a = false
            this.onButtonPressObservable.notifyObservers('a')
          }
          if (button === BABYLON.Xbox360Button.B) {
            this.gamepadInput.b = false
            this.onButtonPressObservable.notifyObservers('b')
          }
        })
      } else if (gamepad instanceof BABYLON.DualShockPad) {
        controller.name = `DualShock Pad (${++nr})`
        gamepad.onButtonDownObservable.add((button, state)=>{
          if (!controller.active) {
            return
          }
          if (button === BABYLON.DualShockButton.Cross) {
            this.gamepadInput.a = true
          }
          if (button === BABYLON.DualShockButton.Circle) {
            this.gamepadInput.b = true
          }
        })
        gamepad.onButtonUpObservable.add((button, state)=>{
          if (!controller.active) {
            return
          }
          if (button === BABYLON.DualShockButton.Cross) {
            this.gamepadInput.a = false
            this.onButtonPressObservable.notifyObservers('a')
          }
          if (button === BABYLON.DualShockButton.Circle) {
            this.gamepadInput.b = false
            this.onButtonPressObservable.notifyObservers('b')
          }
        })
      } else if (gamepad instanceof BABYLON.GenericPad) {
        controller.name = `Generic Pad (${++nr})`
        gamepad.onButtonDownObservable.add((button, state)=>{
          if (!controller.active) {
            return
          }
          if (button === 0) {
            this.gamepadInput.a = true
          }
          if (button === 1) {
            this.gamepadInput.b = true
          }
        })
        gamepad.onButtonUpObservable.add((button, state)=>{
          if (!controller.active) {
            return
          }
          if (button === 0) {
            this.gamepadInput.a = false
            this.onButtonPressObservable.notifyObservers('a')
          }
          if (button === 1) {
            this.gamepadInput.b = false
            this.onButtonPressObservable.notifyObservers('b')
          }
        })
      } else if (gamepad instanceof BABYLON.GenericController) {
        controller.name = `Generic Controller (${++nr})`
        gamepad.onButtonStateChange((_controller, button, state) => {
          if (!controller.active) {
            return
          }
          if (button === 0) {
            this.gamepadInput.a = state.pressed;
            if (!state.pressed) {
              this.onButtonPressObservable.notifyObservers('a')
            }
          }
          if (button === 1) {
            this.gamepadInput.b = state.pressed;
            if (!state.pressed) {
              this.onButtonPressObservable.notifyObservers('b')
            }
          }
        })
      } else {
        console.error('unknown controller! can not jump!')
      }
      this.gameSettings.addController(controller)
    });
    this.gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state)=>{
      const controller = this.gamepadController.get(gamepad)
      if (controller) {
        this.gameSettings.removeController(controller)
      }
      if (this.gamepadController.size === 0) {
        this.gamepadActive = false;
      }
    });
  }

  // Mobile Phone/Pad
  private initMobileControls () {
    this.leftStick = new VirtualJoystick(this.ui);
    this.aButton = new VirtualButton(this.ui, 'a', 'green', false, -80, -30);
    this.aButton.onPointerUpObservable.add(() => {
      this.onButtonPressObservable.notifyObservers('a')
    })
    this.bButton = new VirtualButton(this.ui, 'b', 'red', false, -30, -80);
    this.bButton.onPointerUpObservable.add(() => {
      this.onButtonPressObservable.notifyObservers('b')
    })
    this.sticks = true;
  }

  private updateInputs() {
    this.speed = 0.0
    const speedMultiplier = 0.2
    this.aPressed = false;
    this.bPressed = false;
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
      if (this.inputMap.get(' ') || this.inputMap.get('q') || this.inputMap.get('ArrowLeft')) {
        input = true
        this.aPressed = true
      }
      if (this.inputMap.get('e') || this.inputMap.get('ArrowRight')) {
        input = true
        this.bPressed = true
      }
    }
    // virtual joystick control
    if (this.mobile && this.leftStick && !input) {
      this.aPressed = this.aButton?.pressed || false
      this.bPressed = this.bButton?.pressed || false
      this.calcSpeedAndOrientation(
        this.leftStick.posX/40,
        this.leftStick.posY/40);
    }
    // game pad
    if (this.gamepadActive && !input) {
      this.aPressed = this.gamepadInput.a;
      this.bPressed = this.gamepadInput.b;
      this.calcSpeedAndOrientation(
        this.gamepadInput.x,
        -this.gamepadInput.y);
    }
    const movement = {
      speed: this.speed, 
      orientation: this.orientation,
      jump: this.aPressed && this.canJumpInArea
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

export { InputControls, Controller, ControllerType }