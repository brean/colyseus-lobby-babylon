import * as BABYLON_LOADER from 'babylonjs-loaders'
import * as BABYLON from 'babylonjs'
import { Asset, AssetLoader } from './AssetLoader';
import MirrorStorage from './MirrorStorage'
import { EventEmitter } from 'events';
import UIManager from './UIManager';
import AreaInteraction from './AreaInteraction';

// Level parent
export default class LevelLoader extends EventEmitter {
  public debugCollider: boolean = false;
  public debugAreas: boolean = false;
  
  public name: string;

  private mirror: MirrorStorage;
  private basePathMapfile: string = 'maps';
  private basePathObj: string = 'obj';
  private assets:AssetLoader;
  private shadowGenerator?: BABYLON.ShadowGenerator;
  private tileNamesBySize: Map<number, string> = new Map<number, string>([
    [6, 'Large'],
    [1, 'Small'],
    [2, 'Medium']
  ]);

  private data: any;
  private scene: BABYLON.Scene;
  private ui: UIManager;
  areaInteraction: AreaInteraction;

  constructor(assets:AssetLoader, 
      ui:UIManager, mirror: MirrorStorage,
      scene: BABYLON.Scene, name: string,
      areaInteraction:AreaInteraction,
      shadowGenerator?:BABYLON.ShadowGenerator) {
    super();
    this.areaInteraction = areaInteraction;
    this.shadowGenerator = shadowGenerator;
    this.assets = assets;
    this.ui = ui;
    this.mirror = mirror;
    this.name = name;
    this.scene = scene;

    //see https://doc.babylonjs.com/how_to/obj
    BABYLON_LOADER.OBJFileLoader.OPTIMIZE_WITH_UV = false;
    BABYLON_LOADER.OBJFileLoader.COMPUTE_NORMALS = true;

    this.load();
  }

  private setMaterialColor(material: BABYLON.StandardMaterial, color: string) {
    material.diffuseColor = BABYLON.Color3.FromHexString(color)
  }

  private load() {
    // load base map from AJAX
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        this.data = JSON.parse(xhttp.responseText);
        this.emit('data_loaded')
      }
    };
    xhttp.open("GET", `/${this.basePathMapfile}/${this.name}.json`, true);
    xhttp.send();
    // TODO: update data using WebSocket?
  }

  getAssets(): Asset[] {
    let assets: Asset[] = [];
    // background
    const size = this.data.default_size;
    const timeName = this.tileNamesBySize.get(size);
    assets.push(
      new Asset(
        ``,
        `area_tile_${timeName}_${this.data.default_type}`,
        `/${this.basePathObj}/`,
        `tile${timeName}_${this.data.default_type}.obj`,
        true
      )
    )
    // objects
    for (const obj of this.data.objects) {
      if (obj.type === 'mirror') {
        continue
      }
      assets.push(
        new Asset(
          '', obj.name, `/${this.basePathObj}/`, 
          `${obj.name}.obj`
        )
      )
    }
    // areas
    for (const area of this.data.areas) {
      if (area.type === 'hole') {
        continue
      }
      const areaSize = this.tileNamesBySize.get(area.size);
      assets.push(
        new Asset(
          ``,
          `area_tile_${areaSize}_${area.name}`,
          `/${this.basePathObj}/`,
          `tile${areaSize}_${area.name}.obj`,
          true)
      )
    }
    return assets;
  }

  onAssetsLoaded() {
    this.createBackground();
    this.createObjects();
    this.createArea();
  }

  private applyPositionRotation(mesh: BABYLON.AbstractMesh, position: number[], rotation?: number[]) {
    if (position) {
      mesh.position.x += position[0];
      mesh.position.y += position[1];
      mesh.position.z += position[2];
    }
    if (rotation) {
      mesh.rotation.x += rotation[0];
      mesh.rotation.y += rotation[1];
      mesh.rotation.z += rotation[2];
    }
  }

  private createArea() {
    for (const area of this.data.areas) {
      if (area.type === 'hole') {
        continue
      }
      const areaSize = this.tileNamesBySize.get(area.size);
      const meshes = this.assets.getCopy(`area_tile_${areaSize}_${area.name}`)
      if (!meshes) {
        continue
      }
      if (area.color) {
        meshes.forEach((mesh) => {
          this.setMaterialColor(
            mesh.material as BABYLON.StandardMaterial, area.color)
        })
        
      }
      for (const mesh of meshes) {
        this.applyPositionRotation(mesh, area.pos)
        mesh.position.y -= this.data.height;
        mesh.receiveShadows = true;
      }
      // collision object to interact with
      const options = {width: area.size, height: this.data.height * 10, depth: area.size}
      const mesh:BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox("box", options, this.scene);
      mesh.visibility = this.debugAreas ? 0.5 : 0.0
      this.applyPositionRotation(mesh, area.pos)
      if (area.type === 'change_color') {
        this.areaInteraction.changeColorArea(mesh);
      }
    }
  }

  private createCollider(obj: any) {
    // show collider for debug
    const dim = obj.collider.dim
    let mesh
    switch (obj.collider.type) {
      case 'cube':
        const options = {width: dim[0], height: dim[1], depth: dim[2]}
        mesh = BABYLON.MeshBuilder.CreateBox("box", options, this.scene);
        break;
    }
    if (mesh) {
      this.applyPositionRotation(mesh, obj.pos, obj.rot)
      this.applyPositionRotation(mesh, obj.collider.pos, obj.collider.rot)
      mesh.material = new BABYLON.StandardMaterial('transparent', this.scene);
      mesh.material.alpha = 0.5
    }
  }

  private createObjects() {
    for (const obj of this.data.objects) {
      if (obj.type === 'mirror') {
        const glass = BABYLON.MeshBuilder.CreatePlane(
          'glass', {width: obj.width, height: obj.height}, this.scene);
        this.applyPositionRotation(glass, obj.pos, obj.rot);
        this.mirror.createMirrorMaterial(glass)
      } else {
        // we just grab the objects, assuming they are unique
        const meshes = this.assets.assets.get(obj.name)
        if (meshes) {
          for (const mesh of meshes) {
            this.applyPositionRotation(mesh, obj.pos, obj.rot);
            mesh.receiveShadows = obj.receiveShadows;
            this.shadowGenerator?.addShadowCaster(mesh, true)
          }
        }
        if (obj.collider && this.debugCollider) {
          this.createCollider(obj);
        }
      }
    }
  }

  private createBackground() {
    const size = this.data.default_size;
    const maxX = this.data.length / 2;
    const minX = -maxX;
    const maxZ = this.data.width / 2;
    const minZ = -maxZ;
    const timeName = this.tileNamesBySize.get(size);
    const meshes = this.assets.getCopy(`area_tile_${timeName}_${this.data.default_type}`)
    if (!meshes) {
      throw new Error(`meshes not found for background area_tile_${timeName}_${this.data.default_type}`)
    }
    for (const mesh of meshes) {
      mesh.position.y = -this.data.height;
      if (this.data.default_color) {
        meshes.forEach((mesh) => {
          this.setMaterialColor(
            mesh.material as BABYLON.StandardMaterial, this.data.default_color)
        })
      }
    }
    for (let i = minX; i < maxX; i+=size) {
      for (let j = minZ; j < maxZ; j+=size) {
        let cont = false;
        for (const area of this.data.areas) {
          if ((i === area.pos[0]) && (j === area.pos[2])) {
            cont = true;
            break;
          }
        }
        if (cont) {
          continue;
        }
        for (const mesh of meshes) {
          const nmesh = mesh.clone(`tile_${i}_${j}`, mesh.parent, false)
          if (nmesh) {
            nmesh.position.z = j;
            nmesh.position.x = i;
            nmesh.receiveShadows = true;
          }
        }
      }
    }
  }
}
