import { createHashHistory, History } from "history";

import { Room, Client } from 'colyseus.js';


class AppData {
  history: History<unknown>;
  client: Client;
  // currently joined room
  currentRoom?: Room;

  constructor() {
    this.history = createHashHistory();
    const prot = window.location.protocol.replace("http", "ws")
    const endpoint = `${prot}//${window.location.hostname}:3001`;
    this.client = new Client(endpoint);
  }
}

export default AppData;