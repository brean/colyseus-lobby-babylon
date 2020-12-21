import { Schema, type } from "@colyseus/schema";

export class Position extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
}

export class Orientation extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") w: number = 0;
}

export interface LinearVelocity {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

export interface Velocity {
  linear: LinearVelocity,
  rotation: number
}

export class Player extends Schema {
  @type("string") id: string = '';
  @type("string") name: string = 'new Player';
  @type("string") color: string = '#ff0000';
  @type("boolean") admin: boolean = false;
  @type(Position) position: Position = new Position();
  @type("number") rotation: number = 0.0;
  @type(Orientation) orientation: Orientation = new Orientation();
  velocity: Velocity = {
    linear: {x: 0, y: 0, z: 0},
    rotation: 0.0
  };
}
