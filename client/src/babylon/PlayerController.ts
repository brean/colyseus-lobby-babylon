/**
 * basic Player controller, handels input, collisions and player models
 */
// see https://github.com/BabylonJS/SummerFestival/blob/master/src/characterController.ts
import Player from '../model/Player'
import * as BABYLON from 'babylonjs'
import { AssetLoader } from './AssetLoader';
import MirrorStorage from './MirrorStorage';
import { ShadowGenerator } from 'babylonjs';

export default class PlayerController {
  private character: string;
  private controllable: boolean = false;
  private playerModel: Player;
  private meshes?: BABYLON.AbstractMesh[];
  private bodyRadius: number = 0.6;
  public bodyMesh?: BABYLON.Mesh;
  private oldMeshColor: String = '';

  private camera: BABYLON.FollowCamera
  private light?: BABYLON.DirectionalLight
  private wilhelm: BABYLON.Sound

  private cameraPosition: BABYLON.Vector3 = new BABYLON.Vector3(12, 12, 0)
  private lightPosition: BABYLON.Vector3 = new BABYLON.Vector3(12, 12, 12)

  private assets:AssetLoader;
  private mirror: MirrorStorage;
  private shadowGenerator?: BABYLON.ShadowGenerator;

  private changeColors = new Map<string, string>([
    ['bear', 'BrownDark'],
    ['duck', 'White'],
    ['dog', 'Beige']
  ])
  bodyPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);

  constructor(
    assets: AssetLoader, mirror: MirrorStorage, 
    playerModel: Player, 
    scene:BABYLON.Scene,
    camera:BABYLON.FollowCamera,
    shadowGenerator?:ShadowGenerator,
    light?: BABYLON.DirectionalLight, 
    controllable: boolean = false) {
    this.character = playerModel.character;
    this.assets = assets;
    this.mirror = mirror;
    this.playerModel = playerModel;
    this.camera = camera;
    this.shadowGenerator = shadowGenerator;
    this.light = light;
    this.controllable = controllable;

    this.wilhelm = new BABYLON.Sound("wilhelm", "/sound/wilhelm_scream.mp3", scene);

    this.bodyMesh = BABYLON.Mesh.CreateSphere("sphere", 4, this.bodyRadius, scene);
    this.bodyPosition.y = this.bodyRadius / 2
    this.bodyMesh.position = this.bodyMesh.position.add(this.bodyPosition);
    this.bodyMesh.visibility = 0;
  }

  public getCharacter():string {
    return this.character;
  }

  public loadPlayerModel() {
    this.meshes = this.assets.getCopy(this.character)
    if (!this.meshes) {
      return
    }
    this.setColor(this.playerModel.color);
    for (const mesh of this.meshes) {
      this.shadowGenerator?.addShadowCaster(mesh, true)
      this.mirror.renderTarget.push(mesh)
    }
    this.update(this.playerModel);
  }

  private setColor(color: string) {
    if (!this.meshes || this.oldMeshColor === color) {
      return
    }
    for (const mesh of this.meshes) {
      if (mesh.material) {
        const name:string = mesh.material.name || '';
        if (this.changeColors.get(this.character) === name) {
          this.setMaterialColor(
            mesh.material as BABYLON.StandardMaterial,
            color)
        }
      }
    }
    this.oldMeshColor = color;
  }

  public update(playerModel: Player) {
    this.playerModel = playerModel;
    if (!this.meshes) {
      return
    }
    const player = this.playerModel;
    for (const mesh of this.meshes) {
      mesh.position.set(player.x, player.y - this.bodyRadius, player.z)
      if (player.rotation !== undefined) {
        mesh.rotation.set(0, player.rotation, 0)
      }
    }
    const basePos = this.meshes[0].position;
    if (this.bodyMesh) {
      this.bodyMesh.position = basePos.add(this.bodyPosition)
      if (this.bodyMesh.position.y < -1
        && !this.wilhelm.isPlaying) {
        this.wilhelm.play();
      }
    }
    if (this.controllable) {
      const camera = this.camera
      camera.position = basePos.add(this.cameraPosition)
      if (this.light) {
        this.light.position = basePos.add(this.lightPosition)
      }
    }
    this.setColor(this.playerModel.color);
  }

  remove() {
    if (this.meshes) {
      for (const mesh of this.meshes) {
        this.shadowGenerator?.removeShadowCaster(mesh)
        mesh._scene.removeMesh(mesh);
      }
    }
    if (this.bodyMesh) {
      this.bodyMesh.dispose();
    }
  }

  private setMaterialColor(material: BABYLON.StandardMaterial, color: string) {
    material.diffuseColor = BABYLON.Color3.FromHexString(color)
  }
}