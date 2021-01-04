// button for smartphone
import * as GUI from "babylonjs-gui";
import UIManager from "./UIManager";

export default class VirtualButton {
  private ui: UIManager;
  private color: string;
  private left: boolean;
  private sideOffset = -50;
  private bottomOffset = -30;
  public pressed:boolean = false;
  private ellipse: GUI.Ellipse;
  private horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT

  constructor(ui: UIManager, color: string = "blue", left: boolean = true) {
    this.ui = ui;
    this.color = color;
    this.left = left;

    this.ellipse = this.ui.makeCircle('button', 0, color, color, 50)
    this.ellipse.alpha = 0.4;
    if (left) {
      this.sideOffset *= -1
      this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    }
    this.ellipse.left = this.sideOffset;
    this.ellipse.top = this.bottomOffset;
    this.ellipse.horizontalAlignment = this.horizontalAlignment;
    this.ellipse.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.ellipse.onPointerDownObservable.add(this.onPressDown.bind(this))
    this.ellipse.onPointerUpObservable.add(this.onPressUp.bind(this))
    this.ui.addControl(this.ellipse)
  }

  onPressDown() {
    this.ellipse.alpha = 1.0
    this.pressed = true;
  }

  onPressUp() {
    this.ellipse.alpha = 0.4
    this.pressed = false;
  }
}