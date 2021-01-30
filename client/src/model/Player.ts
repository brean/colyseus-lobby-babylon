import { Schema, type } from "@colyseus/schema";

class Player extends Schema {
  @type("string") id: string = '';
  @type("string") name: string = 'new Player';
  @type("string") color: string = '#ff0000';
  @type("string") character: string = 'dog';
  @type("boolean") admin: boolean = false;
  @type("boolean") ready: boolean = false;
  
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotation: number = 0;
}

export default Player;