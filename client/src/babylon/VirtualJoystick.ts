import * as GUI from "babylonjs-gui";

// based on https://playground.babylonjs.com/#C6V6UY#5
export default class VirtualJoystick {
  private puckDown: boolean;
  private left: boolean;
  private canvas: HTMLCanvasElement;
  private thumbContainer: GUI.Ellipse;
  private innerThumbContainer: GUI.Ellipse;
  private puck: GUI.Ellipse;
  private sideJoystickOffset = -50;
  private bottomJoystickOffset = -30;
  private horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT

  public posX: number = 0;
  public posY: number = 0;

  constructor(canvas: HTMLCanvasElement, color: string = "blue", left: boolean = true) {
    this.canvas = canvas;
    this.puckDown = false;
    this.left = left;

    this.thumbContainer = this.makeThumbArea(
      "thumb", 2, color, "", 140
    );
    this.thumbContainer.alpha = 0.4;
    if (left) {
      this.sideJoystickOffset *= -1
      this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    }
    this.thumbContainer.left = this.sideJoystickOffset;
    this.thumbContainer.top = this.bottomJoystickOffset;
    this.thumbContainer.horizontalAlignment = this.horizontalAlignment;
    this.thumbContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

    this.innerThumbContainer = this.makeThumbArea(
      "innerThumb", 2, color, "", 60
    );

    this.puck = this.makeThumbArea(
      "puck", 0, color, color, 50
    )
    this.createAdvancedDynamicTexture();
    this.puck.isVisible = false;
    this.createPuckControl();
  }

  private createPuckControl() {
    this.thumbContainer.onPointerDownObservable.add(this.onPuckDown.bind(this));
    this.thumbContainer.onPointerUpObservable.add(this.onPuckUp.bind(this));
    this.thumbContainer.onPointerMoveObservable.add(this.onPuckMove.bind(this));
  }

  private onPuckDown(coordinates: any) {
    this.puck.isVisible = true;
    const thumbWidth = (this.thumbContainer._currentMeasure.width*.5)
    const thumbOffset = thumbWidth+Math.abs(this.sideJoystickOffset)
    const thumbHeight = (this.thumbContainer._currentMeasure.height*.5)
    let floatLeft;
    if (this.left) {
      floatLeft = coordinates.x - thumbOffset;
    } else {
      floatLeft = -this.canvas.width - coordinates.x - thumbOffset
    }
    this.puck.left = floatLeft;
    this.puck.top = -(this.canvas.height - coordinates.y - thumbHeight + this.bottomJoystickOffset);
    this.puckDown = true;
    this.thumbContainer.alpha = 0.9;
  }

  private onPuckUp(coordinates: any) {
    this.posX = 0;
    this.posY = 0;
    this.puckDown = false;
    this.puck.isVisible = false;
    this.thumbContainer.alpha = 0.4;
  }

  private onPuckMove(coordinates: any) {
    if (this.puckDown) {
      const thumbWidth = this.thumbContainer._currentMeasure.width*.5
      const thumbOffset = thumbWidth+Math.abs(this.sideJoystickOffset)
      if (this.left) {
        this.posX = coordinates.x - thumbOffset;
      } else {
        this.posX = -(this.canvas.width - coordinates.x-thumbOffset)
      }
      this.posY = this.canvas.height - coordinates.y-thumbWidth+this.bottomJoystickOffset;
      this.puck.left = this.posX;
      this.puck.top = -this.posY;
    }
  }

  private createAdvancedDynamicTexture() {
    const adt = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    adt.addControl(this.thumbContainer);
    this.thumbContainer.addControl(this.innerThumbContainer);
    this.thumbContainer.addControl(this.puck);
  }

  private makeThumbArea(
      name: string, thickness: number, color: string, 
      background: string, radius: number){
    let rect = new GUI.Ellipse();
    rect.name = this.left ? `left${name}` : `right${name}`;
    rect.thickness = thickness;
    rect.color = color;
    rect.background = background;
    rect.paddingLeft = "0px";
    rect.paddingRight = "0px";
    rect.paddingTop = "0px";
    rect.paddingBottom = "0px";
    rect.height = `${radius}px`;
    rect.width = `${radius}px`;
    rect.isPointerBlocker = true;
    rect.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    rect.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    return rect;
  }
}