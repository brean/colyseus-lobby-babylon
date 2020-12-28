import * as BABYLON_LOADER from 'babylonjs-loaders'
import * as BABYLON from 'babylonjs'

// Level parent
export default class LevelLoader {
  name: string;
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

  constructor(scene: BABYLON.Scene, name: string, shadowGenerator?: BABYLON.ShadowGenerator) {
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
        for (const area of this.data.areas) {
          const areaSize = this.tileNamesBySize.get(area.size);
          BABYLON.SceneLoader.ImportMesh(
            '', `/${this.basePathObj}/`, 
            `tile${areaSize}_${area.name}.obj`, this.scene, (meshes) => {
              for (const mesh of meshes) {
                mesh.position.y = -1;
                mesh.position.x = area.x;
                mesh.position.z = area.z;
                mesh.receiveShadows = true;
              }
            }
          );
        }
      }
    };
    xhttp.open("GET", `/${this.basePathMapfile}/${this.name}.json`, true);
    xhttp.send();
    // TODO: update data using WebSocket?
  }

  loadBackground() {
    const size = this.data.default_size;
    const maxX = this.data.length / 2;
    const minX = -maxX;
    const maxY = this.data.width / 2;
    const minY = -maxY;
    const timeName = this.tileNamesBySize.get(size);
    BABYLON.SceneLoader.ImportMesh(
      '', `/${this.basePathObj}/`, 
      `tile${timeName}_${this.data.default_type}.obj`, this.scene, (meshes) => {
        for (const mesh of meshes) {
          mesh.position.y = -1;
        }
        for (let i = minX; i < maxX; i+=size) {
          for (let j = minY; j < maxY; j+=size) {
            let cont = false;
            for (const area of this.data.areas) {
              if ((i === area.x) && (j === area.z)) {
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
