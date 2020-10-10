class Player {
  id: string = ""
  name: string = ""
  color: string = ""
  admin: boolean = false

  static fromData(data: any):Player {
    const player: Player = new Player()
    player.update(data)
    return player;
  }

  update(data: any) {
    this.id = data.id
    this.name = data.name
    this.color = data.color
    this.admin = data.admin
  }

  toJSON() {
    return {
      name: this.name,
      color: this.color
    }
  }
}

export default Player;