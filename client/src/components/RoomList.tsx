import React, { Component } from 'react';
import { Icon } from '@rmwc/icon';
import {
  TopAppBar, TopAppBarRow, TopAppBarSection, TopAppBarTitle, 
  TopAppBarFixedAdjust } from '@rmwc/top-app-bar';
import { Grid, GridCell } from '@rmwc/grid';
import { Card, CardPrimaryAction } from '@rmwc/card';
import { Typography } from '@rmwc/typography';
import { RoomAvailable, Client } from 'colyseus.js';

import '@rmwc/icon/styles';
import '@rmwc/top-app-bar/styles';
import '@rmwc/select/styles';
import '@rmwc/card/styles';
import '@rmwc/grid/styles';
import '@rmwc/typography/styles';

import AppData from '../model/AppData';
import RoomMeta from '../model/RoomMeta';
import { RoomCard } from './RoomCard';
import { RoomFilter } from './RoomFilter';
import { GAME_MODES, GAME_MAPS } from '../model/Settings';

type SelectedFilter = {
  gameModes: Map<string, boolean>;
  gameMaps: Map<string, boolean>;
}

class RoomList extends Component<{ appData: AppData }, SelectedFilter> {
  rooms: RoomAvailable<RoomMeta>[] = [];

  constructor(props: {appData: AppData}) {
    super(props);
    let gameMaps: Map<string, boolean> = new Map<string, boolean>();
    for (let map of GAME_MAPS) {
      gameMaps.set(map, true)
    }
    let gameModes: Map<string, boolean> = new Map<string, boolean>();
    for (let mode of GAME_MODES) {
      gameModes.set(mode, true);
    }
    this.state = {
      gameModes: gameModes,
      gameMaps: gameMaps
    };

  }

  componentDidMount() {
    let client: Client = this.props.appData.client;
    client.getAvailableRooms().then(serverRoom => {
      serverRoom.forEach((room: RoomAvailable<RoomMeta>) => {
        this.rooms.push(room);
        this.forceUpdate();
      })
      
    });
  }

  joinRoom(roomId:string) {
    let roomUrl=`/room/${roomId}`;
    this.props.appData.history.push(roomUrl);
  }

  toggle(map: Map<String, boolean>) {
    return (name: string) => {
      map.set(name, !map.get(name))
      this.setState(this.state)
    }
  }

  render() {
    let rows: any[] = [];
    this.rooms.forEach((room: RoomAvailable<RoomMeta>) => {
      const map: string = room.metadata ? room.metadata.map : ''
      const mode: string = room.metadata ? room.metadata.mode : ''
      if (this.state.gameMaps.get(map) && 
        this.state.gameModes.get(mode)) {
        rows.push((<RoomCard
          key={room.roomId} 
          client={this.props.appData.client}
          room={room}
          history={this.props.appData.history} />));
      }
    });

    return (
      <>
        <TopAppBar>
          <TopAppBarRow>
            <TopAppBarSection>
              <TopAppBarTitle>Rooms</TopAppBarTitle>
            </TopAppBarSection>
            <TopAppBarSection alignEnd>
            </TopAppBarSection>
          </TopAppBarRow>
        </TopAppBar>
        <TopAppBarFixedAdjust />
        
        <Grid>
          <GridCell span={12}>
            <RoomFilter
              gameModes={this.state.gameModes}
              gameMaps={this.state.gameMaps}
              toggleMap={this.toggle(this.state.gameMaps).bind(this)}
              toggleMode={this.toggle(this.state.gameModes).bind(this)} />
          </GridCell>
        </Grid>
        
        <Grid>
          {rows}
          <GridCell span={2}>
            <Card onClick={() => {
              // TODO: optional dialog or just create a game and change everything in there?
              this.props.appData.client.create("game_room", {}).then(room => {
                console.log("joined successfully", room);
                this.props.appData.currentRoom = room;
                this.joinRoom(room.id);
              }).catch(e => {
                console.error("join error", e);
              });
            }}>
              <CardPrimaryAction>
                <div style={{ padding: '0 1rem 1rem 1rem' }}>
                  <Typography use="headline6" tag="h2">
                    <Icon icon={{ 
                      icon: 'add_circle', 
                      strategy: 'ligature' }}></Icon> New Room
                  </Typography>
                  <Typography
                    use="body1"
                    tag="div"
                    theme="textSecondaryOnBackground"
                  >
                  Touch/Click here to create a new room and start a new Game.
                  </Typography>
                </div>
              </CardPrimaryAction>
            </Card>
          </GridCell>
        </Grid>
      </>
    );
  }
}

export { RoomList };
