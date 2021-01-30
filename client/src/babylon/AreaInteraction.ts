import * as GUI from "babylonjs-gui";
import * as BABYLON from 'babylonjs';
import { Room } from 'colyseus.js';
import PlayerController from './PlayerController';
import { UIManager } from './UIManager';
import { CHARACTER_MODELS } from './Game';
import { AssetLoader } from './AssetLoader';
import { Observable, Vector3 } from 'babylonjs';
import GameSettings from "./GameSettings";
import { ControllerType, InputControls } from "./InputControls";


/**
 * the player interacts with an area
 */
export default class AreaInteraction {
  private ui:UIManager;
  private scene: BABYLON.Scene;
  private player?: PlayerController;
  private room: Room;
  private assets: AssetLoader;
  private gameSettings: GameSettings;
  private basePathUi = 'ui';
  private characterInputPlanes: BABYLON.AbstractMesh[] = []; // for text-button planes
  private characterSelectMeshes: BABYLON.AbstractMesh[] = []; // for character meshes
  private _isActive: boolean = false;
  onAreaEntered: Observable<any> = new Observable<any>()
  onAreaExited: Observable<any> = new Observable<any>()
  private activeAreas: any[] = []
  private inputControls: InputControls;
  private characters: string[] = [];
  private character: string = '';

  constructor(
      ui:UIManager, room: Room, gameSettings: GameSettings, 
      inputControls: InputControls,
      assets:AssetLoader, scene: BABYLON.Scene) {
    this.ui = ui;
    this.room = room;
    this.gameSettings = gameSettings;
    this.inputControls = inputControls;
    this.assets = assets;
    this.scene = scene;
    inputControls.onButtonPressObservable.add((btn) => {
      for (const area of this.activeAreas) {
        if (area.type === 'change_character') {
          this.room.send('change_character', 
            btn === 'a' ? this.characters[0] : this.characters[1])
        }
        if (area.type === 'change_color') {
          this.room.send('change_hue', 
            btn === 'a' ? 20 : -20)
        }
      }
    })
  }

  setPlayer(player: PlayerController) {
    // This player is controllable!
    this.player = player;
  }

  createButtonPlane(left: boolean, btn: string, idx: number, position: BABYLON.Vector3) {
    const mat = new BABYLON.StandardMaterial("greenMat", this.scene);
    mat.diffuseTexture = new BABYLON.Texture(`/${this.basePathUi}/${btn}.png`, this.scene);
    mat.diffuseTexture.hasAlpha = true;
    const plane = BABYLON.MeshBuilder.CreatePlane("leftplane", {}, this.scene);
    plane.position = plane.position.add(position)
    plane.position.y += 4 + (idx * 1.1);
    plane.position.z += left ? -0.5 : 0.5;
    // rotation
    plane.rotation.y = -Math.PI / 2;

    plane.material = mat;
    plane.isVisible = this._isActive;
    mat.backFaceCulling = false;
    return plane
  }

  updateCharacterArea(areaMesh: BABYLON.Mesh, meshes: BABYLON.AbstractMesh[]) {
    let pos = -.5;
    if (!this.player || !this.player.bodyMesh) {
      return;
    }
    for (const mesh of this.characterSelectMeshes) {
      mesh.dispose()
    }
    this.characterSelectMeshes = []

    this.character = this.player.character;
    const curIdx = CHARACTER_MODELS.indexOf(this.character);
    let nextIdx: number = curIdx + 1;
    if (nextIdx >= CHARACTER_MODELS.length ) {
      nextIdx = 0;
    }
    let prevIdx: number = curIdx - 1;
    if (prevIdx < 0) {
      prevIdx = CHARACTER_MODELS.length -1;
    }

    this.characters = [CHARACTER_MODELS[prevIdx], CHARACTER_MODELS[nextIdx]]
    for (const char of this.characters) {
      const charMesh = this.assets.getCopy(char)
      if (charMesh) {
        for (const mesh of charMesh) {
          mesh.position = mesh.position.add(areaMesh.position)
          mesh.position.y += 1.2;
          mesh.rotation.y = Math.PI / 2;
          mesh.visibility = 1;
          mesh.scaling.multiply(new Vector3(.5, .5, .5));
          mesh.position.z += pos;
          mesh.position.x += 1;
          mesh.isVisible = this._isActive;
          meshes.push(mesh);
          this.characterSelectMeshes.push(mesh);
        }
      }
      pos++;
    }
  }

  updateCharacterAreaInputs(areaMesh: BABYLON.Mesh, meshes: BABYLON.AbstractMesh[]) {
    for (const plane of this.characterInputPlanes) {
      plane.dispose()
    }
    this.characterInputPlanes = []
    let controllerNr = 0;
    let used: string[] = []
    for (const controller of this.gameSettings.controller) {
      if (controller.active) {
        let left = 'q'
        let right = 'e'
        switch (controller.type) {
          case ControllerType.Mobile:
          case ControllerType.Gamepad:
            left = 'a_btn'
            right = 'b_btn'
            break;
        }
        if (used.indexOf(left)>=0) {
          break
        }
        used.push(left)
        const leftPlane = this.createButtonPlane(true, left, controllerNr, areaMesh.position)
        meshes.push(leftPlane);
        this.characterInputPlanes.push(leftPlane);
        const rightPlane = this.createButtonPlane(false, right, controllerNr, areaMesh.position)
        meshes.push(rightPlane);
        this.characterInputPlanes.push(rightPlane);
        controllerNr++;
      }
    }
  }



  // show all possible characters in a grid
  changeCharacterArea(areaMesh: BABYLON.Mesh, areaData: any) {
    if (!this.player || !this.player.bodyMesh) {
      return;
    }
    let meshes: BABYLON.AbstractMesh[] = []

    this.updateCharacterArea(areaMesh, meshes)
    // character change
    this.player.onPlayerChange.add((player) => {
      if (player.character === this.character) {
        return;
      }
      this.updateCharacterArea(areaMesh, meshes)
    })

    this.updateCharacterAreaInputs(areaMesh, meshes)
    // color change
    this.gameSettings.controllerChanged.add(() => {
      this.updateCharacterAreaInputs(areaMesh, meshes)
    })
    this.toggleOnAreaEnter(
      areaMesh,
      areaData,
      () => {
        meshes.forEach((mesh) => {
          this._isActive = true;
          mesh.isVisible = this._isActive;
        })
      },
      () => {
        meshes.forEach((mesh) => {
          this._isActive = false;
          mesh.isVisible = this._isActive;
        })
      }
    );
  }

  // show color picker
  changeColorArea(areaMesh: BABYLON.Mesh, areaData: any) {
    if (!this.player) {
      return;
    }
    const picker = new GUI.ColorPicker();
    picker.value = BABYLON.Color3.FromHexString(
      this.player.playerModel.color);
    this.ui.addControl(picker);
    picker.linkWithMesh(areaMesh);
    picker.isVisible = this._isActive;
    picker.onValueChangedObservable.add((value: BABYLON.Color3) => {
      this.room.send('change_color', value.toHexString());
    });
    this.player.onPlayerChange.add((player) => {
      picker.value = BABYLON.Color3.FromHexString(
        player.color);
    })
    this.toggleOnAreaEnter(areaMesh,
      areaData,
      () => {
        this._isActive = true;
        picker.isVisible = this._isActive;
      },
      () => {
        this._isActive = false;
        picker.isVisible = this._isActive;
      });
  }

  updateActiveAreas() {
    this.inputControls.canJumpInArea = true;
    for (const area of this.activeAreas) {
      if (area.canJump === false) {
        this.inputControls.canJumpInArea = false;
      }
    }
  }

  toggleOnAreaEnter(mesh: BABYLON.Mesh, 
      areaData: any,
      onEnter: (evt: BABYLON.ActionEvent) => void,
      onExit: (evt: BABYLON.ActionEvent) => void) {
    if (!this.player) {
      return;
    }
    if (!mesh.actionManager) {
      mesh.actionManager = new BABYLON.ActionManager(this.scene);
    }
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        { 
          trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
          parameter: this.player.bodyMesh
        },
        (evt: BABYLON.ActionEvent) => {
          onEnter(evt);
          this.activeAreas.push(areaData);
          this.updateActiveAreas();
          this.onAreaEntered.notifyObservers(areaData)
        }
      )
    );
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        { 
          trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
          parameter: this.player.bodyMesh
        },
        (evt: BABYLON.ActionEvent) => {
          onExit(evt);
          for(let i = 0; i < this.activeAreas.length; i++) {
            const activeArea = this.activeAreas[i]
            if (activeArea.pos[0] === areaData.pos[0] && 
                activeArea.pos[1] === areaData.pos[1] &&
                activeArea.pos[2] === areaData.pos[2]) {
              this.activeAreas.splice(i, 1);
              this.updateActiveAreas();
              return;
            }
          }
          this.onAreaExited.notifyObservers(areaData);
        }
      )
    );
  }
}
