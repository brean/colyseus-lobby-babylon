import React, { Component } from 'react';
import { Client } from 'colyseus.js';
import AppData from '../model/AppData';
import Player from '../model/Player';
import { GAME_MAPS, GAME_MODES } from '../model/Settings'

import { Select } from '@rmwc/select';
import { Chip } from '@rmwc/chip';
import { Card, CardMedia, CardPrimaryAction } from '@rmwc/card';
import { Typography } from '@rmwc/typography';
import { Grid, GridCell, GridRow } from '@rmwc/grid';
import { PlayerCard } from './PlayerCard';
import {
  TopAppBar, TopAppBarRow, TopAppBarSection, TopAppBarTitle, 
  TopAppBarFixedAdjust } from '@rmwc/top-app-bar';
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
    let rows: any[] = [];
    const appData = this.props.appData
    let currentPlayer: Player | undefined
    Object.entries(this.players).forEach(
      ([key, player]) => {
        if (appData.currentRoom?.sessionId === player.id) {
          currentPlayer = player;
        }
      }
    );
    Object.entries(this.players).forEach(
      ([key, player]) => {
        if (currentPlayer) {
          rows.push((<PlayerCard
            appData={this.props.appData}
            key={player.id}
            player={player} />))
        }
      }
    );

    let overview
    if (currentPlayer?.admin) {
      overview = (<div style={{ padding: '1rem' }}>
        <Typography use="headline6" tag="div">
          <Select label="Map" options={GAME_MAPS} defaultValue={this.state.map} onChange={(evt) => {
            this.props.appData.currentRoom?.send('set_map', evt.currentTarget.value)
          }} />
        </Typography>
        <Typography use="headline6" tag="div">
          <Select label="Mode" options={GAME_MODES} defaultValue={this.state.mode} onChange={(evt) => {
            this.props.appData.currentRoom?.send('set_mode', evt.currentTarget.value)
          }} />
        </Typography>
        <Typography use="headline6" tag="div">
          Players: { Object.keys(this.players).length }
        </Typography>
      </div>)
    } else {
      overview = (<div style={{ padding: '1rem' }}>
      <Typography use="headline6" tag="div">
        Map: <Chip label={ this.state.map } />
      </Typography>
      <Typography use="headline6" tag="div">
        Mode: <Chip label={ this.state.mode } />
      </Typography>
      <Typography use="headline6" tag="div">
        Players: { Object.keys(this.players).length }
      </Typography>
      </div>)
    }

    return (
      <>
        <TopAppBar>
          <TopAppBarRow>
            <TopAppBarSection>
              <TopAppBarTitle>
                {this.state.name}
              </TopAppBarTitle>
            </TopAppBarSection>
            <TopAppBarSection alignEnd>
            </TopAppBarSection>
          </TopAppBarRow>
        </TopAppBar>
        <TopAppBarFixedAdjust />
        <Grid>
          <GridRow>
            <GridCell span={2}>
              <Card>
                <CardPrimaryAction>
                  <CardMedia
                      sixteenByNine
                      style={{
                        backgroundImage: 'url(/maps/' + this.state.map + '.png)'
                      }}
                    />
                  {overview}
                </CardPrimaryAction>
              </Card>
            </GridCell>

            <GridCell span={10}>
              <Typography use="headline6" tag="div">
                Player:
              </Typography>
              <Grid>
                {rows}
              </Grid>
            </GridCell>
          </GridRow>
        </Grid>
      </>
    );
  }
}

export { JoinedRoom };