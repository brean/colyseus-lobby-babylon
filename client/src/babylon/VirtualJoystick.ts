import * as GUI from "babylonjs-gui";
import UIManager from './UIManager'

// based on https://playground.babylonjs.com/#C6V6UY#5
export default class VirtualJoystick {
  private ui:UIManager
  private puckDown: boolean;
  private left: boolean;
  private thumbContainer: GUI.Ellipse;
  private innerThumbContainer: GUI.Ellipse;
  private puck: GUI.Ellipse;
  private sideOffset = -50;
  private bottomOffset = -30;
  private horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT

  public posX: number = 0;
  public posY: number = 0;

  constructor(ui: UIManager, color: string = "blue", left: boolean = true) {
    this.ui = ui;
    this.puckDown = false;
    this.left = left;

    this.thumbContainer = this.makeThumbArea(
      "thumb", 2, color, "", 140
    );
    this.thumbContainer.alpha = 0.4;
    if (left) {
      this.sideOffset *= -1
      this.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    }
    this.thumbContainer.left = this.sideOffset;
    this.thumbContainer.top = this.bottomOffset;
    this.thumbContainer.horizontalAlignment = this.horizontalAlignment;
    this.thumbContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

    this.innerThumbContainer = this.makeThumbArea(
      "innerThumb", 2, color, "", 60
    );

    this.puck = this.makeThumbArea(
      "puck", 0, color, color, 50
    )
    this.ui.addControl(this.thumbContainer);
    this.thumbContainer.addControl(this.innerThumbContainer);
    this.thumbContainer.addControl(this.puck);

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
    const thumbOffset = thumbWidth+Math.abs(this.sideOffset)
    const thumbHeight = (this.thumbContainer._currentMeasure.height*.5)
    let floatLeft;
    if (this.left) {
      floatLeft = coordinates.x - thumbOffset;
    } else {
      floatLeft = -this.ui.canvas.width - coordinates.x - thumbOffset
    }
    this.puck.left = floatLeft;
    this.puck.top = -(this.ui.canvas.height - coordinates.y - thumbHeight + this.bottomOffset);
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
      const thumbOffset = thumbWidth+Math.abs(this.sideOffset)
      if (this.left) {
        this.posX = coordinates.x - thumbOffset;
      } else {
        this.posX = -(this.ui.canvas.width - coordinates.x-thumbOffset)
      }
      this.posY = this.ui.canvas.height - coordinates.y-thumbWidth+this.bottomOffset;
      this.puck.left = this.posX;
      this.puck.top = -this.posY;
    }
  }

  private makeThumbArea(
      name: string, thickness: number, color: string, 
      background: string, radius: number){
    return this.ui.makeCircle(
      this.left ? `left${name}` : `right${name}`,
      thickness, color, background, radius
    );
  }
}