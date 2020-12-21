import * as BABYLON from 'babylonjs'
import { AbstractMesh } from 'babylonjs'
import * as BABYLON_LOADER from 'babylonjs-loaders'
import Level from './Level';
// TODO: load level from file instead, only parse the level here!!!

export default class LobbyLevel extends Level {
  scene: BABYLON.Scene

  constructor(scene: BABYLON.Scene) {
    super()
    this.scene = scene;
    //see https://doc.babylonjs.com/how_to/obj
    BABYLON_LOADER.OBJFileLoader.OPTIMIZE_WITH_UV = false;
    BABYLON_LOADER.OBJFileLoader.COMPUTE_NORMALS = true;
    
    // load background
    BABYLON.SceneLoader.ImportMesh('', '/obj/', 'tileLarge_neutral.obj', scene, (meshes) => {
      for (const mesh of meshes) {
        mesh.position.y -= 1
        this.createMeshes(mesh)
      }
    })
  }

  createMeshes(mesh: BABYLON.AbstractMesh) {
    //TODO: load map instead
    const size = 6
    for (let i = -size*4; i < size*4; i+=size) {
      for (let j = -size*4; j < size*4; j+=size) {
        if (i === 0 && j === 0) {
          continue
        }
        const nmesh = mesh.clone(`tile_${i}_${j}`, mesh.parent, false)
        if (nmesh) {
          nmesh.position.z = j
          nmesh.position.x = i
        }
      }
    }
      
  }
}
