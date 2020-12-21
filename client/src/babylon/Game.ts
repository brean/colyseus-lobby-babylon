// Game Environment
import * as BABYLON from 'babylonjs'
import { AbstractMesh } from 'babylonjs'
import { Room } from 'colyseus.js'
import { Player } from '../model/Player'
import LobbyLevel from './LobbyLevel'
import PlayerControls from './PlayerControls'

export default class Game {
  canvas: HTMLCanvasElement
  scene: BABYLON.Scene
  engine: BABYLON.Engine
  light?: BABYLON.HemisphericLight
  camera?: BABYLON.FollowCamera
  playerMesh = new Map<string, BABYLON.AbstractMesh[]>()
  playerId: string = 'NotYou'
  player: Player|undefined = undefined
  room: Room
  controls: PlayerControls

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
    this.createScene();
    this.controls = new PlayerControls(this.scene, room, this.canvas);
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

  /** fill scene with light, camera and load the level */
  createScene() {
    this.createLight();
    this.createCamera();
    new LobbyLevel(this.scene)
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
    this.camera.attachControl(false);
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
      mesh.rotation.set(0, player.rotation, 0)
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

}
