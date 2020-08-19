
class Vector {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  round() {
    return new Vector(Math.round(this.x), Math.round(this.y));
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  distance(from: Vector) {
    return Math.hypot(from.x - this.x, from.y - this.y);
  }
}

export default Vector;