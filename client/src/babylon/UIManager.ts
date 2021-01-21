// button for smartphone
import * as GUI from "babylonjs-gui";

export default class UIManager {
  public canvas: HTMLCanvasElement;
  private adt: GUI.AdvancedDynamicTexture;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.adt = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI")
  }

  public addControl(control: GUI.Control) {
    this.adt.addControl(control);
  }

  public createPicker(value: BABYLON.Color3): GUI.ColorPicker {
    const picker = new GUI.ColorPicker();
    picker.value = value;
    picker.height = "150px";
    picker.width = "150px";
    picker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    return picker;
  }

  public makeCircle(
    name: string, thickness: number, color: string, 
    background: string, radius: number){
    let ellipse = new GUI.Ellipse();
    ellipse.name = name;
    ellipse.thickness = thickness;
    ellipse.color = color;
    ellipse.background = background;
    ellipse.paddingLeft = "0px";
    ellipse.paddingRight = "0px";
    ellipse.paddingTop = "0px";
    ellipse.paddingBottom = "0px";
    ellipse.height = `${radius}px`;
    ellipse.width = `${radius}px`;
    ellipse.isPointerBlocker = true;
    ellipse.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    ellipse.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    return ellipse;
  }
}