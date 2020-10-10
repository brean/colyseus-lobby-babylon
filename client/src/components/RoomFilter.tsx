
import React, { Component } from 'react';
import { Icon } from '@rmwc/icon';
import { Chip, ChipSet } from '@rmwc/chip';
import { 
  DataTable, DataTableContent, DataTableHead, DataTableRow,
  DataTableHeadCell, DataTableBody, DataTableCell
} from '@rmwc/data-table';

import '@rmwc/icon/styles';
import '@rmwc/data-table/styles';
import '@rmwc/chip/styles';

type SelectedFilter = {
  gameModes: Map<string, boolean>
  gameMaps: Map<string, boolean>
  toggleMap: Function
  toggleMode: Function
}

class RoomFilter extends Component<SelectedFilter> {
  createCells(cellContent: Map<string, boolean>, toggleFunc: Function) {
    let cells = [];
    for (let cellKey of cellContent.keys()) {
      cells.push(<Chip
        key={'game_' + cellKey}
        label={cellKey}
        selected={cellContent.get(cellKey)}
        onInteraction={() => {
          toggleFunc(cellKey)
        }}
      />);
    }
    return cells;
  }

  render() {
    return (
      <DataTable>
        <DataTableContent>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell>
                <Icon icon={{ 
                  icon: 'details', 
                  basename: 'material-icons',
                  size: 'small'}}> </Icon>&nbsp;
                Filter
              </DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            <DataTableRow>
              <DataTableCell>Game Mode</DataTableCell>
              <DataTableCell alignEnd>
                <ChipSet choice>
                  { this.createCells(this.props.gameModes, this.props.toggleMode) }
                </ChipSet>
              </DataTableCell>
            </DataTableRow>
            <DataTableRow>
              <DataTableCell>Map</DataTableCell>
              <DataTableCell>
                <ChipSet choice>
                  { this.createCells(this.props.gameMaps, this.props.toggleMap) }
                </ChipSet>
              </DataTableCell>
            </DataTableRow>
          </DataTableBody>
        </DataTableContent>
      </DataTable>
    );
  }
}

export { RoomFilter };