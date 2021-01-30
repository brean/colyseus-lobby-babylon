// button for smartphone
import * as GUI from "babylonjs-gui";
import { UIManager } from './UIManager';

export default class VirtualButton {
  private ui: UIManager;
  private _color: string;
  private _left: boolean;
  private _sideOffset: number;
  private _bottomOffset: number;
  private _label: string
  private labelImage?:GUI.Image
  public pressed:boolean = false;
  private ellipse: GUI.Ellipse;
  private basePathUi = 'ui'

  constructor(ui: UIManager, label: string, color: string = "blue", left: boolean = true,
    sideOffset: number = -80, bottomOffset: number = -30) {
    this.ui = ui;
    this._label = label;
    this._color = color;
    this._left = left;
    this._bottomOffset = bottomOffset;
    this._sideOffset = sideOffset;

    this.ellipse = this.ui.createCircle('button', this._color, 0, this._color, 50)
    this.ellipse.alpha = 0.4;
    // update values via setter
    this.bottomOffset = bottomOffset;
    this.sideOffset = sideOffset;
    this.left = left;
    this.color = color;
    this.label = label;
    
    this.ellipse.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.ellipse.onPointerDownObservable.add(this.onPressDown.bind(this))
    this.ellipse.onPointerUpObservable.add(this.onPressUp.bind(this))
    
    this.ui.addControl(this.ellipse)
  }

  get onPointerUpObservable() {
    return this.ellipse.onPointerUpObservable
  }

  set sideOffset(offset: number) {
    this._sideOffset = offset;
    this.ellipse.left = this._left ? -1 * this._sideOffset : this._sideOffset;
  }

  set label(label: string) {
    this._label = label;
    if (this.labelImage) {
      this.labelImage.dispose();
      this.labelImage = undefined;
    }
    if (this._label === '') {
      return;
    }
    this.labelImage = new GUI.Image(this._label, 
      `/${this.basePathUi}/${this._label}.png`);
    this.ellipse.addControl(this.labelImage)
  }

  get label(): string {
    return this._label;
  }
 
  set bottomOffset(offset: number) {
    this._bottomOffset = offset;
    this.ellipse.top = this._bottomOffset;
  }

  set left(left: boolean) {
    this._left = left
    this.ellipse.horizontalAlignment = left ? GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.ellipse.left = left ? -1 * this._sideOffset : this._sideOffset;
  }

  get left() : boolean {
    return this._left;
  }

  set color(color: string) {
    this._color = color;
    this.ellipse.color = color;
  }

  get color(): string {
    return this.color;
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