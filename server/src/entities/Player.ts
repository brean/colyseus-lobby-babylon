import { Schema, type } from "@colyseus/schema";

export default class Player extends Schema {
  @type("string") id: string = '';
  @type("string") name: string = 'new Player';
  @type("string") color: string = '#ff0000';
  @type("string") character: string = 'dog';
  @type("boolean") admin: boolean = false;
  @type("boolean") ready: boolean = false;
  // Pose
  @type("number") x: number = 0.0;
  @type("number") y: number = 0.0;
  @type("number") z: number = 0.0;
  @type("number") rotation: number = 0.0;
  // velocity
  orientation: number = 0.0;
  speed: number = 0.0;
  jump: boolean = false;
}
