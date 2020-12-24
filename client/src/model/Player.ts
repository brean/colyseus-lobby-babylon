import { Schema, type } from "@colyseus/schema";

export class Pose extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotation: number = 0;
}

export class Player extends Schema {
  @type("string") id: string = '';
  @type("string") name: string = 'new Player';
  @type("string") color: string = '#ff0000';
  @type("boolean") admin: boolean = false;
  @type(Pose) pose = new Pose();
  @type("number") orientation: number = 0.0;
  @type("number") speed: number = 0.0;
}
