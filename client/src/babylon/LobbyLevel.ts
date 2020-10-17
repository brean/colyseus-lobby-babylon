import * as BABYLON from 'babylonjs'
import { AbstractMesh } from 'babylonjs'
import * as BABYLON_LOADER from 'babylonjs-loaders'
import { Room } from 'colyseus.js'
import { Player } from '../model/Player'

export default class LobbyLevel {
  engine: BABYLON.Engine
  canvas: HTMLCanvasElement
  scene: BABYLON.Scene
  light?: BABYLON.HemisphericLight
  camera?: BABYLON.FollowCamera
  inputMap = new Map<string, boolean>()
  playerMesh = new Map<string, BABYLON.AbstractMesh[]>()
  playerId: string = 'NotYou'
  player: Player|undefined = undefined
  room: Room

  constructor (room: Room) {
    this.room = room
    this.canvas = (document.getElementById('renderCanvas') as HTMLCanvasElement);
    (document.getElementById('main_body') as HTMLElement).style.overflow = 'hidden'
    // Load the 3D engine
    
    this.engine = new BABYLON.Engine(
      this.canvas, true,
      {
        preserveDrawingBuffer: true,
        stencil: true
      });
    this.scene = new BABYLON.Scene(this.engine)
    this.createLevel();
    this.run();
    this.resize();

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  setPlayerId(playerId: string) {
    this.playerId = playerId
  }

  createLevel() {
    this.createLight();
    this.createCamera();
    this.createScene();
  }

  createLight() {
    this.scene.createDefaultLight(true)
  }

  createCamera() {
    // Create a FreeCamera, and set its position to {x: 0, y: 5, z: 10}
    this.camera = new BABYLON.FollowCamera(
      'camera1', new BABYLON.Vector3(12, 12, -12), this.scene);
    // Target the camera to scene origin
    this.camera.setTarget(BABYLON.Vector3.Zero());
    // Attach the camera to the canvas
    this.camera.attachControl(this.canvas, false);
  }

  setMaterialColor(material: BABYLON.StandardMaterial, color: string) {
    material.diffuseColor = BABYLON.Color3.FromHexString(color)
  }

  /**
   * add the player to the scene
   */
  addPlayer(player: Player) {
    // load player model
    console.log('add player', player.id)
    BABYLON.SceneLoader.ImportMesh(
      '', '/obj/', 'character_dogHead.obj', 
      this.scene, (meshes) => {
      if (meshes[0].material) {
        this.setMaterialColor(
          meshes[0].material as BABYLON.StandardMaterial, player.color)
      }
      const playerMesh = this.playerMesh.get(player.id)
      if (playerMesh) {
        this.playerMesh.set(player.id, playerMesh.concat(meshes))
      } else {
        this.playerMesh.set(player.id, meshes)
      }
      if (player.id === this.playerId) {
        this.player = player;
        console.log(player.id, this.playerId)
      }
    })
    BABYLON.SceneLoader.ImportMesh(
      '', '/obj/', 'character_dog.obj', 
      this.scene, (meshes) => {
      if (meshes[0].material) {
        this.setMaterialColor(
          meshes[0].material as BABYLON.StandardMaterial, player.color)
      }
      const playerMesh = this.playerMesh.get(player.id)
      if (playerMesh) {
        this.playerMesh.set(player.id, playerMesh.concat(meshes))
      } else {
        this.playerMesh.set(player.id, meshes)
      }
    })
  }

  updatePlayer(player: Player) {
    const meshes = this.playerMesh.get(player.id)
    if (!meshes) {
      return
    }
    for (const mesh of meshes) {
      mesh.position.set(player.position.x, player.position.y, player.position.z)
    }
    if (meshes && this.camera && player.id === this.playerId) {
      const camera = this.camera
      camera.position.x = meshes[0].position.x + 12
      camera.position.y = meshes[0].position.y + 12
      camera.position.z = meshes[0].position.z - 12
    }
  }

  removePlayer(player: Player) {
    const meshes = this.playerMesh.get(player.id)
    if (!meshes) {
      return
    }
    for (const mesh of meshes) {
      this.scene.removeMesh(mesh);
    }
    this.playerMesh.delete(player.id)
  }

  createScene () {
    const scene = this.scene;
    //see https://doc.babylonjs.com/how_to/obj
    BABYLON_LOADER.OBJFileLoader.OPTIMIZE_WITH_UV = false;
    BABYLON_LOADER.OBJFileLoader.COMPUTE_NORMALS = true;
    
    // load background
    BABYLON.SceneLoader.ImportMesh('', '/obj/', 'tileLarge_neutral.obj', scene, (meshes) => {
      for (const mesh of meshes) {
        mesh.position.y -= 1
        console.log(mesh)
        this.createMeshes(mesh)
      }
    })
    // setup player controls
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        this.inputMap.set(evt.sourceEvent.key, evt.sourceEvent.type === "keydown")
      }
    ));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
        this.inputMap.set(evt.sourceEvent.key, evt.sourceEvent.type === "keydown");
      }
    ));
    scene.onBeforeRenderObservable.add(() => {
      const playerMesh = this.playerMesh.get(this.playerId)
      if (!playerMesh || !this.player) {
        return
      }
      const keyboard: {x: number, y: number} = { x: 0, y: 0 };
      if (this.inputMap.get('w')) {
        keyboard.y = -1;
      }
      else if (this.inputMap.get('s')) {
        keyboard.y = 1;
      }
      if (this.inputMap.get('a')) {
        keyboard.x = -1;
      } else if (this.inputMap.get('d')) {
        keyboard.x = 1;
      }
      if (this.room) {
        this.room.send('key', keyboard);
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

  run () {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  resize() {
    this.engine.setSize(window.innerWidth, window.innerHeight);
    this.engine.resize();
  }
}
