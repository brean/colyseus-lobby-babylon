/**
 * basic Player controller, handels input, collisions and player models
 */
// see https://github.com/BabylonJS/SummerFestival/blob/master/src/characterController.ts
import Player from '../model/Player'
import * as BABYLON from 'babylonjs'
import { AssetLoader } from './AssetLoader';
import MirrorStorage from './MirrorStorage';
import { Observable, ShadowGenerator } from 'babylonjs';
import GameSettings from './GameSettings';

export default class PlayerController {
  private _character: string;
  private _controllable: boolean = false;
  private _playerModel: Player;
  private meshes?: BABYLON.AbstractMesh[];
  private bodyRadius: number = 0.4;
  public bodyMesh?: BABYLON.Mesh;
  private _color: String = '';

  private camera: BABYLON.FollowCamera
  private light?: BABYLON.DirectionalLight
  private wilhelm: BABYLON.Sound

  private cameraPosition: BABYLON.Vector3 = new BABYLON.Vector3(12, 12, 0)
  private lightPosition: BABYLON.Vector3 = new BABYLON.Vector3(12, 12, 12)

  private assets:AssetLoader;
  private mirror: MirrorStorage;
  private shadowGenerator?: BABYLON.ShadowGenerator;
  public onPlayerChange: Observable<Player> = new Observable<Player>();

  private gameSettings: GameSettings;

  private changeColors = new Map<string, string>([
    ['bear', 'BrownDark'],
    ['duck', 'White'],
    ['dog', 'Beige'],
    ['mage', 'PurpleDark']
  ])
  bodyPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);

  constructor(
      assets: AssetLoader, 
      gameSettings: GameSettings,
      mirror: MirrorStorage, 
      playerModel: Player, 
      scene:BABYLON.Scene,
      camera:BABYLON.FollowCamera,
      shadowGenerator?:ShadowGenerator,
      light?: BABYLON.DirectionalLight, 
      controllable: boolean = false) {
    this._character = playerModel.character;
    this.gameSettings = gameSettings;
    this.assets = assets;
    this.mirror = mirror;
    this._playerModel = playerModel;
    this.camera = camera;
    this.shadowGenerator = shadowGenerator;
    this.light = light;
    this._controllable = controllable;

    this.wilhelm = new BABYLON.Sound("wilhelm", "/sound/wilhelm_scream.mp3", scene);

    this.bodyMesh = BABYLON.Mesh.CreateSphere("sphere", 4, .1, scene);
    this.bodyPosition.y = this.bodyRadius / 2
    this.bodyMesh.position = this.bodyMesh.position.add(this.bodyPosition);
    this.bodyMesh.visibility = 0;
  }

  public get controllable(): boolean {
    return this._controllable
  }

  public get playerModel() {
    return this._playerModel;
  }
  
  public get character():string {
    return this._character;
  }

  public set character(character) {
    if (this._character === character) {
      return
    }
    this.removeMesh();
    this._character = character;
    this._color = ''; // force color reset!
    this.loadPlayerModel();
    this.onPlayerChange.notifyObservers(this._playerModel);
    // don't forget to update the position if 
    // you call this from outside of this function!
    // this.updateMeshPosition();
  }


  public loadPlayerModel() {
    this.meshes = this.assets.getCopy(this._character)
    if (!this.meshes) {
      return
    }
    this.color = this._playerModel.color;
    for (const mesh of this.meshes) {
      this.shadowGenerator?.addShadowCaster(mesh, true)
      this.mirror.renderTarget.push(mesh)
    }
  }

  private set color(color: string) {
    if (!this.meshes || this._color === color) {
      return
    }
    for (const mesh of this.meshes) {
      if (mesh.material) {
        const name:string = mesh.material.name || '';
        if (this.changeColors.get(this._character) === name) {
          this.setMaterialColor(
            mesh.material as BABYLON.StandardMaterial,
            color)
        }
      }
    }
    this._color = color;
    this.onPlayerChange.notifyObservers(this.playerModel);
  }

  public updateMeshPosition() {
    const playerModel: Player = this._playerModel;
    if (!this.meshes) {
      return
    }
    for (const mesh of this.meshes) {
      mesh.position.set(playerModel.x, playerModel.y - this.bodyRadius, playerModel.z)
      if (playerModel.rotation !== undefined) {
        mesh.rotation.set(0, playerModel.rotation, 0)
      }
    }
    const basePos = this.meshes[0].position;
    if (this.bodyMesh) {
      this.bodyMesh.position = basePos.add(this.bodyPosition)
      if (this.bodyMesh.position.y < -1
        && !this.wilhelm.isPlaying) {
        this.wilhelm.setVolume(this.gameSettings.wilhelmVolume)
        this.wilhelm.play();
      }
    }
    if (this._controllable) {
      const camera = this.camera
      camera.position = basePos.add(this.cameraPosition)
      if (this.light) {
        this.light.position = basePos.add(this.lightPosition)
      }
    }
  }

  public update(playerModel?: Player) {
    if (playerModel) {
      this._playerModel = playerModel;
    }
    this.character = this._playerModel.character
    this.updateMeshPosition()
    this.color = this._playerModel.color;
  }

  removeMesh() {
    if (this.meshes) {
      for (const mesh of this.meshes) {
        mesh._scene.removeMesh(mesh);
        mesh.dispose();
        this.shadowGenerator?.removeShadowCaster(mesh, true)
        this.mirror.renderTarget.splice(this.mirror.renderTarget.indexOf(mesh), 1)
      }
    }
  }

  remove() {
    this.removeMesh()
    if (this.bodyMesh) {
      this.bodyMesh.dispose();
    }
  }

  private setMaterialColor(material: BABYLON.StandardMaterial, color: string) {
    material.diffuseColor = BABYLON.Color3.FromHexString(color)
  }
}