import React, { Component } from 'react';
import { Client } from 'colyseus.js';
import AppData from '../model/AppData';
import { Player } from '../model/Player';

import RoomMeta from '../model/RoomMeta';
import Game from '../babylon/Game'

class JoinedRoom extends Component<{ appData: AppData, match: any }, RoomMeta> {
  players: {[id: string]: Player; } = {};
  game: Game

  constructor(props: { appData: AppData, match: any }) {
    super(props);
    this.state = new RoomMeta();
  }

  processCurrentRoom() {
    const appData: AppData = this.props.appData;
    const room = appData.currentRoom;
    this.game = new Game(room)
    if (!room) {
      return;
    }
    room.state.players.onAdd = (player: Player) => {
      this.players[player.id] = player
      if (room.sessionId === player.id) {
        this.game?.setPlayerId(player.id);
      }
      this.game?.addPlayer(player);
      this.forceUpdate();
    }
  
    room.state.players.onRemove = (player: Player) => {
      this.game?.removePlayer(player);
      delete this.players[player.id];
      this.forceUpdate();
    }
  
    room.state.players.onChange = (player: Player) => {
      this.game?.updatePlayer(player)
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
      appData.currentRoom = room;
      this.processCurrentRoom()
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