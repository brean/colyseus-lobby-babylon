import * as GUI from "babylonjs-gui";
import GameSettings from "./GameSettings";
import { IconCheckBoxText, IconSlider, UIManager } from './UIManager';
import { ControllerType } from './InputControls';

export default class SettingsMenu {
  private ui: UIManager;
  private circle: GUI.Ellipse;
  private visible: boolean = false;
  private basePathUi = 'ui';
  private settingsIcon?:GUI.Image;
  private panel:GUI.StackPanel;
  private generalSound?: IconSlider;
  private wilhelmSound?: IconSlider;
  private gameSettings: GameSettings
  private controllerPanel: GUI.StackPanel;

  constructor(ui: UIManager, gameSettings: GameSettings) {
    this.ui = ui;
    this.gameSettings = gameSettings;
    // make settings button in the top-right
    this.circle = new GUI.Ellipse('settings');
    this.createButton()

    this.panel = new GUI.StackPanel();
    this.controllerPanel = new GUI.StackPanel();

    this.gameSettings.controllerAdded.add(this.createControllerPanel.bind(this))
    this.gameSettings.controllerRemoved.add(this.createControllerPanel.bind(this))
    
    this.createSettingsPanel()
    this.createControllerPanel();
  }

  createControllerPanel() {
    this.controllerPanel.clearControls()
    let height = 4;
    const entryHeight = 24;
    this.gameSettings.controller.forEach((controller) => {
      let control:IconCheckBoxText;
      switch (controller.type) {
        case (ControllerType.Mobile):
          control = new IconCheckBoxText('Phone', 'phone_mini');
          break;
        case (ControllerType.KeyboardMouse):
          control = new IconCheckBoxText('Mouse/Keyboard', 'mouse_mini');
          break;
        case (ControllerType.Gamepad):
          control = new IconCheckBoxText(controller.name, 'gamepad_mini');
          break;
      }
      if (control) {
        height += entryHeight;
        control.checked = controller.active;
        control.onValueChangedObservable.add((checked) => {
          controller.active = checked;
          this.gameSettings.changeController(controller);
        })
        this.controllerPanel.addControl(control)
      }
    });
    this.controllerPanel.width = '220px';
    this.controllerPanel.height = `${height}px`;
  }

  private setGlobalVolume() {
    BABYLON.Engine.audioEngine.setGlobalVolume(this.gameSettings.globalVolume)
  }

  private createSettingsPanel() {
    const width = 220;

    this.panel.width = `${width}px`;
    this.panel.isVertical = true;
    this.panel.isVisible = false;
    this.panel.background = 'grey';
    this.panel.top = 90;
    this.panel.left = -20;
    this.panel.alpha = 0.8;
    this.panel.height = '400px';
    this.panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    
    this.panel.addControl(this.createTitleText('Input Devices', width));

    this.panel.addControl(this.controllerPanel)

    this.ui.addControl(this.panel);

    this.panel.addControl(this.createTitleText('Sound', width));

    this.panel.addControl(this.createNormalText('General', width));
    this.generalSound = new IconSlider('audio_mini');
    this.generalSound.disabledColor = 'lightblue'
    this.generalSound.disabledColorItem = 'lightblue'
    this.generalSound.value = this.gameSettings.globalVolume
    this.generalSound.slider.onValueChangedObservable.add(() => {
      if (this.generalSound) {
        this.gameSettings.globalVolume = this.generalSound.value
        this.setGlobalVolume()
      }
    })
    this.generalSound.checkbox.onValueChangedObservable.add((checked:boolean) => {
      if (this.generalSound) {
        this.gameSettings.globalVolume = checked ? this.generalSound.value : 0
        this.setGlobalVolume()
      }
    })
    this.setGlobalVolume();
    this.panel.addControl(this.generalSound);

    this.panel.addControl(this.createNormalText('Wilhelm Scream (falling)', width));
    this.wilhelmSound = new IconSlider('audio_mini');
    this.wilhelmSound.value = this.gameSettings.wilhelmVolume;
    this.wilhelmSound.slider.onValueChangedObservable.add(() => {
      if (this.wilhelmSound) {
        this.gameSettings.wilhelmVolume = this.wilhelmSound.value
      }
    })
    this.wilhelmSound.checkbox.onValueChangedObservable.add((checked:boolean) => {
      if (!this.wilhelmSound) {
        return
      }
      this.gameSettings.wilhelmVolume = checked ? this.wilhelmSound.value : 0
    })
    this.panel.addControl(this.wilhelmSound);

    // this.panel.addControl(this.createTitleText('General', width));
  }

  private createNormalText(txt:string, width: number) {
    let text = new GUI.TextBlock(txt)
    text.text = txt;
    text.color = 'white';
    text.height = '20px';
    text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.width = `${width}px`;
    return text;
  }

  private createTitleText(txt:string, width: number) {
    let text = new GUI.TextBlock(txt)
    text.text = txt;
    text.color = 'blue';
    text.height = '24px';
    text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.width = `${width}px`;
    return text;
  }

  private createButton() {
    this.circle.background = this.circle.color = 'grey';
    this.circle.width = this.circle.height = '50px';
    this.circle.isPointerBlocker = true;
    this.circle.onPointerDownObservable.add(this.onPressDown.bind(this))
    this.circle.onPointerUpObservable.add(this.onPressUp.bind(this))
    this.ui.addControl(this.circle);
    this.circle.alpha = 0.6
    this.circle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.circle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.circle.left = -20;
    this.circle.top = 20;
    this.settingsIcon = new GUI.Image('wrench', 
      `/${this.basePathUi}/wrench.png`);
    this.circle.addControl(this.settingsIcon);
  }

  onPressDown() {
    this.circle.alpha = 1.0
  }

  onPressUp() {
    this.circle.alpha = 0.6
    this.toggle()
  }

  toggle() {
    this.visible = !this.visible;
    this.panel.isVisible = this.visible;
  }
}