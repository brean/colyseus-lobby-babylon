
import { Schema, type } from "@colyseus/schema";

export class Position extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
}

export interface PressedKeys {
  x: number;
  y: number;
}

export class Player extends Schema {
  @type("string") id: string = '';
  @type("string") name: string = 'new Player';
  @type("string") color: string = '#ff0000';
  @type("boolean") admin: boolean = false;
  @type(Position) position = new Position();
  pressedKeys: PressedKeys = { x: 0, y: 0 };
}

