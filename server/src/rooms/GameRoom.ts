import { Room, Client } from "colyseus";
import { World, Body, Box, Sphere, Vec3, Cylinder } from 'cannon-es';
import { GAME_MODES, GAME_MAPS } from '../Settings';
import Player from "../entities/Player";
import StateHandler from "../entities/StateHandler";
import * as fs from 'fs';

const CHARACTER_MODELS = ['mage', 'dog', 'duck', 'bear']

// based on https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript
function hexToHsl(color) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

  var r = parseInt(result[1], 16);
  var g = parseInt(result[2], 16);
  var b = parseInt(result[3], 16);

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  s = s*100;
  s = Math.round(s);
  l = l*100;
  l = Math.round(l);
  h = Math.round(360*h);
  return [h, s, l]
}

// use HSL to always garantee a bright color
// based on https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
function hslToHex(hue: number, saturation: number, lightness:number) {
  lightness /= 100;
  const a = saturation * Math.min(lightness, 1 - lightness) / 100;
  const f = n => {
    const k = (n + hue / 30) % 12;
    const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function getRandomColor():string {
  const color = hslToHex(Math.random()*360, 80, 50);
  return color.toUpperCase();
}

function getRandomCharacter():string {
  return CHARACTER_MODELS[Math.floor(Math.random()*3)]
}

// Rename to something-game
export default class GameRoom extends Room {
  private firstUser: boolean = true
  private maxSpeed: number = 25
  private minSpeed: number = -25
  private canJump: boolean = true
  private canJumpOff: Array<Room> = []

  private world: World = new World();
  private bodies: Map<string, Body> = new Map<string, Body>();
  private bodyRadius: number = 0.4;
  private spawnAreas: Array<any>;

  // When the room is initialized
  onCreate (options: any) {
    const state = new StateHandler()
    this.setState(state);
    this.setSimulationInterval((deltaTime) => this.onUpdate(deltaTime));
    options.name = `New Game`
    options.mode = GAME_MODES[0]
    options.map = GAME_MAPS[0]
    options.started = false
    this.setMetadata(options);
    this.setupPhysics();
    this.onMessage('change_hue', (client, hueDifference) => {
      const p = state.players[client.sessionId]
      let color = p.color;
      const hsl = hexToHsl(color)
      let hue = hsl[0] + hueDifference
      if (hue > 360) {
        hue -= 360
      }
      if (hue < 0) {
        hue += 360
      }
      color = hslToHex(hue, hsl[1], hsl[2])
      console.log('set color to ' + color)
      p.color = color;
    });
    this.onMessage('change_color', (client, color) => {
      // handle player message
      console.log('set color to ' + color)
      const p = state.players[client.sessionId]
      p.color = color;
    });
    this.onMessage('change_character', (client, character) => {
      // handle player message
      console.log(`change to character ${character}`)
      const p = state.players[client.sessionId]
      p.character = character;
    });
    this.onMessage('set_mode', (client, mode) => {
      // handle player message
      const player = state.players[client.sessionId]
      if (player.admin && GAME_MODES.indexOf(mode) >= 0 && !options.started) {
        options.mode = mode
        this.setMetadata(state)
        this.broadcast("update_mode", mode)
      }
    });
    this.onMessage('move', (client, message) => {
      const player: Player = state.players[client.sessionId];
      player.speed = message.speed;
      player.orientation = message.orientation;
      player.jump = message.jump;
    });
    this.onMessage('set_map', (client, map) => {
      // handle player message
      const player = state.players[client.sessionId]
      if (player.admin && GAME_MAPS.indexOf(map) >= 0 && !options.started) {
        options.map = map
        this.setMetadata(state)
        this.broadcast("update_map", map)
      }
    });
  }

  private setupPhysics() {
    this.world.gravity.set(0, -9.82, 0); // m/s²
    this.physicsFromMap('lobby')
  }

  private physicsFromMap(map: string) {
    this.spawnAreas = [];
    const content = fs.readFileSync(`../client/public/maps/${map}.json`).toString()
    const mapData = JSON.parse(content);
    const size = mapData.default_size;
    const maxX = mapData.length / 2;
    const minX = -maxX;
    const maxZ = mapData.width / 2;
    const minZ = -maxZ;
    for (let i = minX; i < maxX; i+=size) {
      for (let j = minZ; j < maxZ; j+=size) {
        let cont = false;
        for (const area of mapData.areas) {
          if ((i === area.pos[0]) && (j === area.pos[2])) {
            cont = true;
            break;
          }
        }
        if (cont) {
          continue;
        }
        this.addGroundPlate([i, 0, j], mapData.height, size)
      }
    }

    for (const area of mapData.areas) {
      if (area.type === 'hole') {
        continue
      } else if (area.type === 'spawn') {
        this.spawnAreas.push(area);
      }

      this.addGroundPlate(area.pos, mapData.height, area.size)
    }

    for (const obj of mapData.objects) {
      if (!obj.collider) {
        continue
      }
      this.addCollider(obj)
    }
  }

  private addGroundPlate(pos: number[], height, size) {
    const groundBody = new Body({
      mass: 0 // mass === 0 makes the body static
    });
    const groundShape = new Box(new Vec3(size/2, 1, size/2));
    groundBody.position.x = pos[0];
    // the default tile height is 1, so if we want the player to be at y-position 0 we need to lower the map by 1
    groundBody.position.y = pos[1] - height;
    groundBody.position.z = pos[2];
    groundBody.addShape(groundShape);
    this.world.addBody(groundBody);
  }

  private applyPositionRotation(body, pos, rot) {
    if (pos) {
      body.position.x += pos[0]
      body.position.y += pos[1]
      body.position.z += pos[2]
    }
    if (rot) {
      let vec: Vec3 = new Vec3()
      body.quaternion.toEuler(vec)
      vec.x += rot[0]
      vec.y += rot[1]
      vec.z += rot[2]
      body.quaternion.setFromEuler(vec.x, vec.y, vec.z)
    }
  }

  private addCollider(obj) {
    let collider = new Body({
      mass: 0 // mass === 0 makes the body static
    });
    const dim = obj.collider.dim
    let colliderShape
    switch (obj.collider.type) {
      default:
      case 'cube':
        colliderShape = new Box(new Vec3(dim[0]/2, dim[1]/2, dim[2]/2));
        break;
      case 'cylinder':
        colliderShape = new Cylinder(
          obj.collider.radius_top || obj.collider.radius,
          obj.collider.radius_bottom || obj.collider.radius,
          obj.collider.height,
          obj.collider.segments || 16)
        break;
    }
    if (colliderShape) {
      this.applyPositionRotation(collider, obj.pos, obj.rot)
      this.applyPositionRotation(collider, obj.collider.pos, obj.collider.rot)
      collider.addShape(colliderShape);
      this.world.addBody(collider);
    }
  }

  private spawnPosition(body: Body) {
    if (this.spawnAreas.length > 0) {
      const spawnArea = this.spawnAreas[Math.floor(Math.random() * this.spawnAreas.length)];
      body.position.x = Math.random() * spawnArea.size + spawnArea.pos[0] - spawnArea.size/2;
      body.position.y = this.bodyRadius  + spawnArea.pos[1];
      body.position.z = Math.random() * spawnArea.size  + spawnArea.pos[2] - spawnArea.size/2;
    } else {
      body.position.x = Math.random() * 6 - 3;
      body.position.y = this.bodyRadius;
      body.position.z = Math.random() * 6 - 3;
    }
  }

  private resetPlayerPhysics(body: Body, player: Player) {
    // orientation
    body.quaternion.set(0,0,0,1);
    body.initQuaternion.set(0,0,0,1);
    body.previousQuaternion.set(0,0,0,1);
    body.interpolatedQuaternion.set(0,0,0,1);

    // Velocity
    body.velocity.setZero();
    body.initVelocity.setZero();
    body.angularVelocity.setZero();
    body.initAngularVelocity.setZero();

    // Force
    body.force.setZero();
    body.torque.setZero();

    this.spawnPosition(body)

    player.x = body.position.x;
    player.y = body.position.y;
    player.z = body.position.z;
    player.speed = 0;
    player.jump = false;
    this.canJump = true;
  }

  onUpdate (deltaTime: number) {
    this.world.step(1.0/60, deltaTime, 3);
    this.state.players.forEach((player, sessionId) => {
      let rotation = player.orientation
      let speed = player.speed * 15;
      let x = 0;
      let z = 0;
      const playerBody = this.bodies.get(player.id);
      if (speed !== 0 && !isNaN(speed)) {
        x = Math.sin(rotation)
        z = Math.cos(rotation)
        // simple anti-cheat: min/max speed for velocities
        speed = Math.min(speed, this.maxSpeed);
        speed = Math.max(speed, this.minSpeed);
        x *= speed;
        z *= speed;
        playerBody.velocity.x = x;  
        playerBody.velocity.z = z;
      } else {
        playerBody.velocity.x = 0;
        playerBody.velocity.z = 0;
      }
      if (player.jump && this.canJump) {
        playerBody.velocity.y = 7;
        this.canJump = false
      }

      if (playerBody.position.y < -10) {
        // reset, TODO: kill_count+=1
        console.log(`player ${player.id} just died from falling, respawn`)
        this.resetPlayerPhysics(playerBody, player);
        return
      }

      player.x = playerBody.position.x
      player.y = playerBody.position.y
      player.z = playerBody.position.z
      player.rotation = rotation;
    });
  }

  // When client successfully join the room
  onJoin (client: Client, options: any, auth: any) {
    const playerData = new Player().assign({
      id: client.sessionId,
      name: 'New Player',
      color: getRandomColor(),
      character: getRandomCharacter(),
      admin: this.firstUser
    });

    const radius = this.bodyRadius;
    const playerBody = new Body({
       mass: 2, // kg
       shape: new Sphere(radius)
    });
    playerBody.addEventListener('collide', (evt) => {
      const body = evt.body;
      if (evt.type === 'collide' && (
        body.mass === 0 || this.canJumpOff.indexOf(body) >= 0)) {
        this.canJump = true;
      }
    })
    this.resetPlayerPhysics(playerBody, playerData)
    this.bodies.set(playerData.id, playerBody)
    this.world.addBody(playerBody);

    // Note that all player in the game will be given the sessionId of each other.
    this.firstUser = false;
    this.state.players[playerData.id] = playerData
  }

  // When a client leaves the room
  onLeave (client: Client, consented: boolean) {
    const admin = this.state.players[client.sessionId].admin
    delete this.state.players[client.sessionId]
    if (admin) {
      // player was admin, give another player admin rights for this room
      const keys = Object.keys(this.state.players)
      if (keys.length <= 0) {
        return
      }
      const adminId = keys[0]
      this.state.players[adminId].admin = true
    }
  }

  // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
  onDispose() {
    // TODO: nullify player?
  }
}