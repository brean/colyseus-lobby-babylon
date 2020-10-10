import React, { Component } from 'react';
import { GridCell } from '@rmwc/grid';
import { Card, CardMedia, CardPrimaryAction } from '@rmwc/card';
import { Chip, ChipSet } from '@rmwc/chip';
import { Typography } from '@rmwc/typography';
import { History } from "history";
import { Client, RoomAvailable } from 'colyseus.js';
import RoomMeta from '../model/RoomMeta';

import '@rmwc/grid/styles';
import '@rmwc/typography/styles';
import '@rmwc/card/styles';
import '@rmwc/chip/styles';

class RoomCard extends Component<{room: RoomAvailable<RoomMeta>, client: Client, history: History<any>}>{

  render() {
    let room: RoomAvailable<RoomMeta> = this.props.room;
    let roomMeta: RoomMeta|undefined = room.metadata;
    let roomUrl = `/room/${this.props.room.roomId}`;
    let props = this.props;
    return (
      <GridCell span={2} key={room.roomId}>
        <Card onClick={() => {
          props.history.push(roomUrl);
        }}>
          <CardPrimaryAction>
            <CardMedia
              sixteenByNine
              style={{
                backgroundImage: 'url(/maps/' + roomMeta?.map + '.png)'
              }}
            />
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
              <Typography use="headline6" tag="h2">
                { roomMeta?.name }
              </Typography>
              <Typography
                use="subtitle2"
                tag="h3"
                theme="textSecondaryOnBackground"
                style={{ marginTop: '-1rem' }}
              >
                { room.clients }/{ room.maxClients || '∞' } player
              </Typography>
              <ChipSet>
                <Chip>{ roomMeta?.mode }</Chip>
                <Chip>{ roomMeta?.map }</Chip>
              </ChipSet>
            </div>
          </CardPrimaryAction>
        </Card>
      </GridCell>
    );
  }
}

export { RoomCard };