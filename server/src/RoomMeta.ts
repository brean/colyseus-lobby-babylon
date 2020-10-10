export default class RoomMeta {
    name: string;
    mode: string;
    map: string;
  
    constructor(
        name: string = "", 
        mode: string = "", 
        map: string = "") {
      this.name = name;
      this.mode = mode;
      this.map = map;
    }
  }