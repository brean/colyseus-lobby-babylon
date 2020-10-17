import { Room, Client } from "colyseus";
import { GAME_MODES, GAME_MAPS } from '../Settings'

import { Player } from "../entities/Player.ts";
import { StateHandler } from "../entities/StateHandler.ts";

function getRandomColor () {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Rename to something-game
export class GameRoom extends Room {
    firstUser: boolean = true

    // When the room is initialized
    onCreate (options: any) { 
      const state = new StateHandler()
      this.setState(state);
      this.setSimulationInterval(() => this.onUpdate());
      options.name = `New Game`
      options.mode = GAME_MODES[0]
      options.map = GAME_MAPS[0]
      options.started = false
      this.setMetadata(options);
      console.log('create: opt', options)
      this.onMessage('change_player', (client, player) => {
        // handle player message
        const p = state.players[client.sessionId]
        p.color = player.color;
        p.name = player.name
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
      this.onMessage("key", (client, message) => {
        const player: Player = state.players[client.sessionId];
        player.pressedKeys = message;
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

    onUpdate () {
      for (const sessionId in this.state.players) {
          const player: Player = this.state.players[sessionId];
          player.position.x += player.pressedKeys.x * 0.1;
          player.position.z -= player.pressedKeys.y * 0.1;
      }
    }

    // When client successfully join the room
    onJoin (client: Client, options: any, auth: any) {
      const playerData = new Player()
      // Note that all player in the game will be given the sessionId of each other.
      playerData.id = client.sessionId
      playerData.name = "New Player"
      playerData.color = getRandomColor()
      playerData.admin = this.firstUser;
      this.firstUser = false;
      this.state.players[client.sessionId] = playerData
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