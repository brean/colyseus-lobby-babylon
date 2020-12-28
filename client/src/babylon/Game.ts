// Game Environment
import * as BABYLON from 'babylonjs'
import { Room } from 'colyseus.js'
import { Player } from '../model/Player'
import LevelLoader from './LevelLoader'
import PlayerControls from './PlayerControls'

export default class Game {
  canvas: HTMLCanvasElement
  scene: BABYLON.Scene
  engine: BABYLON.Engine
  camera: BABYLON.FollowCamera
  playerMeshes = new Map<string, BABYLON.AbstractMesh[]>()
  playerId: string = 'NotYou'
  player?: Player
  room: Room
  cameraPosition: BABYLON.Vector3 = new BABYLON.Vector3(12, 12, 0)
  controls: PlayerControls
  loader: LevelLoader;
  shadowGenerator?: BABYLON.ShadowGenerator;

  constructor (room: Room, level = 'lobby') {
    this.room = room;
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
    this.createLight();
    this.loader = new LevelLoader(this.scene, level, this.shadowGenerator);
    this.camera = this.createCamera();
    this.controls = new PlayerControls(this);
    this.run();
    this.resize();

    window.addEventListener('resize', () => {
      this.resize();
    });
  }


  setPlayerId(playerId: string) {
    this.playerId = playerId
  }

  setMaterialColor(material: BABYLON.StandardMaterial, color: string) {
    material.diffuseColor = BABYLON.Color3.FromHexString(color)
  }

  createLight() {
    this.scene.createDefaultLight(true);

    const light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -1, -1), this.scene);
    light.position = new BABYLON.Vector3(12, 12, 12);
    light.intensity = 0.3;

    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    this.shadowGenerator.useExponentialShadowMap = true;
  
  }

  createCamera() {
    // Create a FreeCamera, and set its position to {x: 0, y: 5, z: 10}
    const camera = new BABYLON.FollowCamera(
      'camera1', this.cameraPosition.clone(), this.scene);
    // Target the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());
    // Attach the camera to the canvas
    camera.attachControl(false);
    return camera;
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

  // PLAYER
  /**
   * add the player to the scene
   */
  addPlayer(player: Player) {
    // load player model
    BABYLON.SceneLoader.ImportMesh(
      '', '/obj/', 'character_dogHead.obj', 
      this.scene, (meshes) => {
        if (meshes[0].material) {
          this.setMaterialColor(
            meshes[0].material as BABYLON.StandardMaterial, player.color)
        }
        const playerMeshes = this.playerMeshes.get(player.id)
        if (playerMeshes) {
          this.playerMeshes.set(player.id, meshes.concat(playerMeshes))
        } else {
          this.playerMeshes.set(player.id, meshes)
        }
        if (player.id === this.playerId) {
          this.player = player;
        }
        for (const mesh of meshes) {
          this.shadowGenerator?.addShadowCaster(mesh)
        }
        this.updatePlayer(player);
      }
    )
    BABYLON.SceneLoader.ImportMesh(
      '', '/obj/', 'character_dog.obj', 
      this.scene, (meshes) => {
        if (meshes[0].material) {
          this.setMaterialColor(
            meshes[0].material as BABYLON.StandardMaterial, player.color)
        }
        const playerMeshes = this.playerMeshes.get(player.id)
        if (playerMeshes) {
          this.playerMeshes.set(player.id, meshes.concat(playerMeshes))
        } else {
          this.playerMeshes.set(player.id, meshes)
        }
        for (const mesh of meshes) {
          this.shadowGenerator?.addShadowCaster(mesh)
        }
        this.updatePlayer(player);
      }
    )
  }

  updatePlayer(player: Player) {
    const meshes = this.updatePlayerMesh(player)
    if (meshes && this.camera && player.id === this.playerId) {
      const camera = this.camera
      camera.position.x = meshes[0].position.x + this.cameraPosition.x
      camera.position.y = meshes[0].position.y + this.cameraPosition.y
      camera.position.z = meshes[0].position.z + this.cameraPosition.z
    }
  }

  updatePlayerMesh(player:Player) {
    const meshes = this.playerMeshes.get(player.id)
    if (!meshes) {
      return
    }
    for (const mesh of meshes) {
      mesh.position.set(player.x, player.y, player.z)
      if (player.rotation !== undefined) {
        mesh.rotation.set(0, player.rotation, 0)
      }
    }
    return meshes
  }

  removePlayer(player: Player) {
    const meshes = this.playerMeshes.get(player.id)
    if (!meshes) {
      return
    }
    for (const mesh of meshes) {
      this.scene.removeMesh(mesh);
    }
    this.playerMeshes.delete(player.id)
  }
}
