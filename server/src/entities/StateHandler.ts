import { Schema, MapSchema, type } from "@colyseus/schema";
import Player from "../entities/Player";

export default class StateHandler extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}