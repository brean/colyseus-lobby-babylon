import React, { Component } from 'react';
import { Client } from 'colyseus.js';
import AppData from '../model/AppData';
import Player from '../model/Player';

import * as BABYLON from 'babylonjs';

import RoomMeta from '../model/RoomMeta';


import '@rmwc/select/styles';
import '@rmwc/chip/styles';
import '@rmwc/card/styles';
import '@rmwc/grid/styles';
import '@rmwc/textfield/styles';

class JoinedRoom extends Component<{ appData: AppData, match: any }, RoomMeta> {
  players: {[id: string]: Player; } = {};

  constructor(props: { appData: AppData, match: any }) {
    super(props);
    this.state = new RoomMeta();
  }

  processCurrentRoom() {
    const appData: AppData = this.props.appData;
    const room = appData.currentRoom;
    if (!room) {
      return;
    }
    room.state.players.onAdd = (playerData: any) => {
      const player = Player.fromData(playerData);
      this.players[player.id] = player
      this.forceUpdate();
    }
  
    room.state.players.onRemove = (player: any) => {
      delete this.players[player.id];
      this.forceUpdate();
    }
  
    room.state.players.onChange = (player: any) => {
      this.players[player.id].update(player)
      this.forceUpdate();
    }
    room.onMessage('update_map', (msg: string) => {
      this.setState({map: msg})
    })
    room.onMessage('update_mode', (msg: string) => {
      this.setState({mode: msg})
    })
  }

  componentDidMount() {
    const canvas: HTMLCanvasElement = (document.getElementById('renderCanvas') as HTMLCanvasElement);
    (document.getElementById('main_body') as HTMLElement).style.overflow = 'hidden'
    // Load the 3D engine
    const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    // CreateScene function that creates and return the scene
    function createScene(){
        // Create a basic BJS Scene object
        const scene = new BABYLON.Scene(engine);
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
        // Target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        // Attach the camera to the canvas
        camera.attachControl(canvas, false);
        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        const sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);
        // Move the sphere upward 1/2 of its height
        sphere.position.y = 1;
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        const ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene, false);
        // Return the created scene
        return scene;
    }
    // call the createScene function
    const scene = createScene();
    // run the render loop
    engine.runRenderLoop(function(){
        scene.render();
    });
    engine.setSize(window.innerWidth, window.innerHeight)
    // the canvas/window resize event handler
    window.addEventListener('resize', function(){
        engine.resize();
    });

    let client: Client = this.props.appData.client;
    let appData: AppData = this.props.appData;
    client.getAvailableRooms().then(rooms => {
      rooms.forEach((room) => {
        if (room.roomId === this.props.match.params.roomId) {
          this.setState(room.metadata);
        }
      });
    });
    if (appData.currentRoom) {
      this.processCurrentRoom()
      return;
    }
    client.joinById(this.props.match.params.roomId).then(room => {
      // TODO: only when the room did not just get created
      // get session id from client?
      this.forceUpdate();
      const state = room.state
      appData.currentRoom = room;
      this.processCurrentRoom()
      console.log(state)
      return true;
    }).catch((msg: string) => {
      console.log(msg);
      this.props.appData.history.push('/');
    })

  }

  render() {
    return (
      <>
        <canvas id="renderCanvas"></canvas>
      </>
    );
  }
}

export { JoinedRoom };