import { Observable } from 'babylonjs'
import { Controller } from './InputControls'

class GameSettings {
  globalVolume: number = 0.5;
  wilhelmVolume: number = 0.5;
  private _controller: Controller[] = [];
  controllerAdded: Observable<Controller> = new Observable<Controller>();
  controllerRemoved: Observable<Controller> = new Observable<Controller>();
  controllerChanged: Observable<Controller> = new Observable<Controller>();

  get controller() {
    return this._controller;
  }

  addController(controller: Controller) {
    this._controller.push(controller);
    this.controllerAdded.notifyObservers(controller);
    this.controllerChanged.notifyObservers(controller);
  }

  changeController(controller:Controller) {
    this.controllerChanged.notifyObservers(controller);
  }

  removeController(controller: Controller) {
    const controllerIdx = this._controller.indexOf(controller);
    this._controller.splice(controllerIdx, 1);
    this.controllerRemoved.notifyObservers(controller);
    this.controllerChanged.notifyObservers(controller);
  }
}

export default GameSettings;