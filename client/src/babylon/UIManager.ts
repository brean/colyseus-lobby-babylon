import { Observable } from "babylonjs";
import * as GUI from "babylonjs-gui";

class IconCheckBox {
  private _icon: GUI.Image;
  private _offIcon: GUI.Image;
  private basePathUi = 'ui';
  private _checked: boolean = true;
  public onValueChangedObservable: Observable<boolean>

  constructor(icon: string, checked: boolean = true, width: number = 20, height: number = 20) {
    this._checked = checked;

    // this.panel.width = width;
    this.onValueChangedObservable = new Observable();
    
    this._icon = new GUI.Image(`_${icon}`, 
      `/${this.basePathUi}/${icon}.png`)
    this._icon.height = `${height}px`;

    this._offIcon = new GUI.Image(`_${icon}_off`, 
    `/${this.basePathUi}/${icon}_off.png`)
    this._offIcon.height = `${height}px`;
    
    this._offIcon.height = `${height}px`;
    this._offIcon.isVisible = false;

    this.update();
  }

  set checked(value) {
    this._checked = value;
    this.update();
  }

  get checked() {
    return this._checked
  }



  toggle() {
    this._checked = !this._checked;
    this.update();
  }

  get icon() {
    return this._icon
  }

  get offIcon() {
    return this._offIcon
  }

  private update() {
    this.onValueChangedObservable.notifyObservers(this._checked);
    // update based on checkbox value
    this._icon.width = this._checked ? '24px' : '0px';
    this._icon.isVisible = this._checked;
    this._offIcon.width = !this._checked ? '24px' : '0px';
    this._offIcon.isVisible = !this._checked;
  }
}


class IconSlider extends GUI.StackPanel {
  public checkbox: IconCheckBox
  public slider: GUI.Slider
  private activeColor: string = 'blue'
  private inActiveColor: string = 'lightblue';

  constructor(
      icon: string, checked: boolean = true, 
      value: number = 1.0, minimum: number = 0, maximum: number = 1.0,
      width: number = 220, height: number = 20) {
    super();
    this.height = `${height+4}px`
    this.isVertical = false;
    this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    this.checkbox = new IconCheckBox(icon, checked);
    this.slider = new GUI.Slider();
    this.slider.width = `${width-24}px`;
    this.slider.height = `${height}px`
    this.slider.minimum = minimum;
    this.slider.maximum = maximum;
    this.slider.value = value;
    this.slider.color = this.activeColor;

    this.checkbox.icon.isPointerBlocker = true
    this.checkbox.icon.onPointerUpObservable.add(this.toggle.bind(this));
    this.checkbox.offIcon.isPointerBlocker = true
    this.checkbox.offIcon.onPointerUpObservable.add(this.toggle.bind(this));
    this.addControl(this.checkbox.icon)
    this.addControl(this.checkbox.offIcon)
    this.addControl(this.slider);
  }

  set checked(value) {
    this.checkbox.checked = value
    this.slider.isEnabled = this.checkbox.checked
  }

  get checked() {
    return this.checkbox.checked
  }

  toggle() {
    this.checkbox.toggle()
    this.slider.isEnabled = this.checkbox.checked
    this.slider.color = this.checkbox.checked ? this.activeColor : this.inActiveColor;
  }

  set value(value) {
    this.slider.value = value;
    if (value === 0) {
      this.checked = false;
    } else {
      this.checked = true;
    }
  }

  get value() {
    return this.slider.value
  }
}

class IconCheckBoxText extends GUI.StackPanel {
  private checkbox: IconCheckBox
  private basePathUi = 'ui';
  private _text: GUI.TextBlock;

  constructor(
      text: string, icon: string, checked: boolean = true, 
      width: number = 220, height: number = 20) {
    super();

    this.height = `${height+4}px`
    this.isVertical = false;
    this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    this.onPointerUpObservable.add(this.toggle.bind(this));
    this.isPointerBlocker = true;
    // this.panel.width = width;
    this.checkbox = new IconCheckBox(icon, checked);

    this._text = new GUI.TextBlock(text);
    this._text.text = text;
    this._text.color = 'white';
    this._text.height = `${height}px`;
    this._text.width = `${width - 20}px`;
    this._text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

    this.addControl(this.checkbox.icon);
    this.addControl(this.checkbox.offIcon);
    this.addControl(this._text);
  }

  set checked(value) {
    this.checkbox.checked = value
  }

  get onValueChangedObservable(): Observable<boolean> {
    return this.checkbox.onValueChangedObservable;
  }

  get checked() {
    return this.checkbox.checked
  }

  toggle() {
    this.checkbox.toggle()
  }
}

/**
 * provides access to one ADT (Advanced Dynamic Texture), so you can 
 * have only one for all of your UI as well as some helper functions
 * to create UI components with some default options that are used 
 * a bit more often
 */
class UIManager {
  public canvas: HTMLCanvasElement;
  private adt: GUI.AdvancedDynamicTexture;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.adt = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI")
  }

  public addControl(control: GUI.Control) {
    this.adt.addControl(control);
  }

  public createSlider(text: string, icon: string) {

  }
  /**
   * create a basic circle
   * 
   * @param name defines the circle name
   * @param thickness defines the border thickness
   * @param color defines the color of the circle (name or hex)
   * @param background defines the background color (empty string for transparent)
   * @param radius defines the radius (defaults to button size)
   */
  public createCircle(
    name: string, color: string, thickness: number = 2, 
    background: string = '', radius: number = 50): GUI.Ellipse{
    let ellipse = new GUI.Ellipse(name);
    ellipse.thickness = thickness;
    ellipse.color = color;
    ellipse.background = background;
    ellipse.height = `${radius}px`;
    ellipse.width = `${radius}px`;
    ellipse.isPointerBlocker = true;
    ellipse.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    ellipse.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    return ellipse;
  }
}

export { UIManager, IconCheckBoxText, IconSlider }