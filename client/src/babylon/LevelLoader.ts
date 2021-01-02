import * as BABYLON_LOADER from 'babylonjs-loaders'
import * as BABYLON from 'babylonjs'
import MirrorStorage from './MirrorStorage'

// Level parent
export default class LevelLoader {
  name: string;
  mirror: MirrorStorage;
  basePathMapfile: string = 'maps';
  basePathObj: string = 'obj';
  tileNamesBySize: Map<number, string> = new Map<number, string>([
    [6, 'Large'],
    [1, 'Small'],
    [2, 'Medium']
  ]);
  shadowGenerator?: BABYLON.ShadowGenerator;

  data: any;
  scene: BABYLON.Scene;

  constructor(mirror: MirrorStorage, scene: BABYLON.Scene, name: string, shadowGenerator?: BABYLON.ShadowGenerator) {
    this.mirror = mirror;
    this.name = name;
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;

    //see https://doc.babylonjs.com/how_to/obj
    BABYLON_LOADER.OBJFileLoader.OPTIMIZE_WITH_UV = false;
    BABYLON_LOADER.OBJFileLoader.COMPUTE_NORMALS = true;

    this.load();
  }

  load() {
    // load base map from AJAX
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
      if (xhttp.readyState === 4 && xhttp.status === 200) {
        this.data = JSON.parse(xhttp.responseText);
        // TODO: preloading!
        this.loadBackground();
        this.loadObjects();
        this.loadAreas();
      }
    };
    xhttp.open("GET", `/${this.basePathMapfile}/${this.name}.json`, true);
    xhttp.send();
    // TODO: update data using WebSocket?
  }

  applyPositionRotation(mesh: BABYLON.AbstractMesh, position: number[], rotation?: number[]) {
    if (position) {
      mesh.position.x = position[0];
      mesh.position.y = position[1];
      mesh.position.z = position[2];
    }
    if (rotation) {
      mesh.rotation.x = rotation[0];
      mesh.rotation.y = rotation[1];
      mesh.rotation.z = rotation[2];
    }
  }

  loadAreas() {
    for (const area of this.data.areas) {
      if (area.type === 'hole') {
        continue
      }
      const areaSize = this.tileNamesBySize.get(area.size);
      BABYLON.SceneLoader.ImportMesh(
        '', `/${this.basePathObj}/`, 
        `tile${areaSize}_${area.name}.obj`, this.scene, (meshes) => {
          for (const mesh of meshes) {
            this.applyPositionRotation(mesh, area.pos)
            mesh.position.y -= this.data.height;
            mesh.receiveShadows = true;
          }
        }
      );
    }
  }

  loadObjects() {
    for (const obj of this.data.objects) {
      if (obj.type === 'mirror') {
        const glass = BABYLON.MeshBuilder.CreatePlane(
          'glass', {width: obj.width, height: obj.height}, this.scene);
        this.applyPositionRotation(glass, obj.pos, obj.rot);
        this.mirror.createMirrorMaterial(glass)
      } else {
        BABYLON.SceneLoader.ImportMesh(
          '', `/${this.basePathObj}/`, 
          `${obj.name}.obj`, this.scene, (meshes) => {
            for (const mesh of meshes) {
              this.applyPositionRotation(mesh, obj.pos, obj.rot);
              mesh.receiveShadows = obj.receiveShadows;
            }
          }
        );
      }
    }
  }

  loadBackground() {
    const size = this.data.default_size;
    const maxX = this.data.length / 2;
    const minX = -maxX;
    const maxZ = this.data.width / 2;
    const minZ = -maxZ;
    const timeName = this.tileNamesBySize.get(size);
    BABYLON.SceneLoader.ImportMesh(
      '', `/${this.basePathObj}/`, 
      `tile${timeName}_${this.data.default_type}.obj`, this.scene, (meshes) => {
        for (const mesh of meshes) {
          mesh.position.y = -this.data.height;
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
    );
  }
}
