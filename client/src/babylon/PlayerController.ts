/**
 * basic Player controller, handels input, collisions and player models
 */
// see https://github.com/BabylonJS/SummerFestival/blob/master/src/characterController.ts
import { Player as PlayerModel } from '../model/Player'
import * as BABYLON from 'babylonjs'
import { AssetLoader } from './AssetLoader';
import MirrorStorage from './MirrorStorage';
import { ShadowGenerator } from 'babylonjs';

export default class PlayerController {
  private character: string;
  private controllable: boolean = false;
  private playerModel: PlayerModel;
  private meshes?: BABYLON.AbstractMesh[];
  private bodyRadius: number = 0.6;

  private camera: BABYLON.FollowCamera
  private light?: BABYLON.DirectionalLight
  
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

  constructor(
    assets: AssetLoader, mirror: MirrorStorage, 
    playerModel: PlayerModel, camera:BABYLON.FollowCamera,
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
  }

  public loadPlayerModel() {
    
    this.meshes = this.assets.getCopy(this.character)
    if (!this.meshes) {
      return
    }
    for (const mesh of this.meshes) {
      if (mesh.material) {
        const name:string = mesh.material.name || '';
        if (this.changeColors.get(this.character) === name) {
          this.setMaterialColor(
            mesh.material as BABYLON.StandardMaterial,
            this.playerModel.color)
        }
      }
      this.shadowGenerator?.addShadowCaster(mesh, true)
      this.mirror.renderTarget.push(mesh)
    }
    this.update(this.playerModel);
  }

  public update(playerModel: PlayerModel) {
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
    if (this.controllable) {
      const basePos = this.meshes[0].position;
      const camera = this.camera
      camera.position = basePos.add(this.cameraPosition)
      if (this.light) {
        this.light.position = basePos.add(this.lightPosition)
      }
    }
  }

  remove() {
    if (this.meshes) {
      for (const mesh of this.meshes) {
        this.shadowGenerator?.removeShadowCaster(mesh)
        mesh._scene.removeMesh(mesh);
      }
    }
  }

  private setMaterialColor(material: BABYLON.StandardMaterial, color: string) {
    material.diffuseColor = BABYLON.Color3.FromHexString(color)
  }
}