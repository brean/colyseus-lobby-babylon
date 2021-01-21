import * as BABYLON from 'babylonjs'
import { Room } from 'colyseus.js';
import PlayerController from './PlayerController';
import UIManager from "./UIManager";

/**
 * the player interacts with an area
 */
export default class AreaInteraction {
  private ui:UIManager;
  private scene: BABYLON.Scene;
  private player?: PlayerController;
  private room: Room;

  constructor(ui:UIManager, room: Room, scene: BABYLON.Scene) {
    this.room = room;
    this.ui = ui;
    this.scene = scene;
  }

  setPlayer(player: PlayerController) {
    this.player = player;
  }

  changeColorArea(areaMesh: BABYLON.Mesh) {
    if (!this.player) {
      return;
    }
    const mesh = areaMesh;
    const picker = this.ui.createPicker(BABYLON.Color3.White())
    this.ui.addControl(picker);
    picker.linkWithMesh(mesh);
    picker.isVisible = false;
    picker.onValueChangedObservable.add((value: BABYLON.Color3) => {
      this.room.send('change_color', {color: value.toHexString()});
    });
    if (!mesh.actionManager) {
      mesh.actionManager = new BABYLON.ActionManager(this.scene);
    }
    
    mesh.actionManager.registerAction(
      new BABYLON.SetValueAction(
        { 
          trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
          parameter: this.player.bodyMesh
        },
        picker,
        'isVisible',
        true
      )
    );
    mesh.actionManager.registerAction(
      new BABYLON.SetValueAction(
        { 
          trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
          parameter: this.player.bodyMesh
        },
        picker,
        'isVisible',
        false
      )
    );
  }
}
