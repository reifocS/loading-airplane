"use client";

const ALLEY = "A";
const SEAT = "S";
const VOID = " ";
const PASSENGER = new RegExp(/[a-z]/);

type CellType = "seat" | "alley";
abstract class Cell {
  x: number;
  y: number;
  passengers: Array<Passenger>;
  grid: Grid;
  type: CellType;

  constructor(x: number, y: number, grid: Grid, type: CellType) {
    this.x = x;
    this.y = y;
    this.passengers = [];
    this.grid = grid;
    this.type = type;
  }

  isEmpty() {
    return this.passengers.length === 0;
  }

  abstract render<T>(renderer: Renderer<T>): T;

  up() {
    return this.grid.get(this.x, this.y - 1);
  }

  down() {
    return this.grid.get(this.x, this.y + 1);
  }

  left() {
    return this.grid.get(this.x - 1, this.y);
  }

  right() {
    return this.grid.get(this.x + 1, this.y);
  }
}

class Seat extends Cell {
  seat: string;
  constructor(x: number, y: number, grid: Grid, type: CellType, seat: string) {
    super(x, y, grid, type);
    this.seat = seat;
  }
  render<T>(renderer: Renderer<T>): T {
    return renderer.render(this);
  }
}

class Alley extends Cell {
  render<T>(renderer: Renderer<T>): T {
    return renderer.render(this);
  }
}

class Passenger {
  passenger: string;
  assignedSeat: string = "";
  cell: Cell;
  constructor(cell: Cell, passenger: string) {
    this.passenger = passenger;
    this.cell = cell;
    cell.passengers.push(this);
    emitChange();
  }
  render<T>(renderer: Renderer<T>) {
    return renderer.render(this);
  }

  private move(cell: Cell) {
    this.cell.passengers = this.cell.passengers.filter((c) => c !== this);
    this.cell = cell;
    cell.passengers.push(this);
    emitChange();
  }

  assignSeat(seat: string) {
    this.assignedSeat = seat;
  }

  pathToSeat() {
    if (this.assignedSeat === "") {
      return;
    }
    // always start from alley on the first row
    const start = this.cell.grid.cells[0].find((cell) => cell instanceof Alley);
    if (!start) {
      throw new Error("No alley found");
    }
    const [x, y] = this.assignedSeat.split(",").map(Number);

    const path = [start];
    let current = start;
    while (current.y !== y) {
      current = current.down()!;
      path.push(current);
    }

    // if we are on the alley, we move to the seat row
    // left or right
    if (current.x < x) {
      while (current.x !== x) {
        current = current.right()!;
        path.push(current);
      }
    } else {
      while (current.x !== x) {
        current = current.left()!;
        path.push(current);
      }
    }

    if (current.x !== x || current.y !== y) {
      throw new Error("No seat found");
    }

    if (current instanceof Seat) {
      return path;
    } else {
      throw new Error("No seat found");
    }
  }

  moveAt(cell: Cell) {
    this.move(cell);
  }

  moveLeft() {
    const left = this.cell.left();
    if (left) {
      this.move(left);
    }
  }

  moveRight() {
    const right = this.cell.right();
    if (right) {
      this.move(right);
    }
  }

  moveUp() {
    const up = this.cell.up();
    if (up) {
      this.move(up);
    }
  }

  moveDown() {
    const down = this.cell.down();
    if (down) {
      this.move(down);
    }
  }
}

const pattern = [SEAT, SEAT, SEAT, SEAT, ALLEY, SEAT, SEAT, SEAT, SEAT];

class Grid {
  cells: Cell[][];
  constructor(width: number, height: number) {
    this.cells = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => {
        // if (pattern[x % pattern.length] === SEAT) {
        //   return new Seat(x, y, this, "seat", `${x},${y}`);
        // }
        // return new Alley(x, y, this, "alley");
        // alley are in the middle of the row
        if (x === Math.floor(width / 2)) {
          return new Alley(x, y, this, "alley");
        }
        // seats are on the sides
        return new Seat(x, y, this, "seat", `${x},${y}`);
      })
    );
  }
  get(x: number, y: number): Cell | undefined {
    return this.cells[y]?.[x];
  }

  copy() {
    const grid = new Grid(this.cells[0].length, this.cells.length);
    grid.cells = this.cells.map((row) => row.map((cell) => cell));
    return grid;
  }

  render<T>(renderer: Renderer<T>): T {
    return renderer.render(this);
  }
}

let grid = new Grid(pattern.length, 10);
let listeners: Array<() => void> = [];

export const gridStore = {
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getSnapshot() {
    return grid;
  },
};

function emitChange() {
  grid = grid.copy();
  for (let listener of listeners) {
    listener();
  }
}

abstract class Renderer<T> {
  abstract render(el: Grid | Cell | Passenger): T;
}

export class JSXRenderer extends Renderer<JSX.Element> {
  render(element: Grid | Cell | Passenger): JSX.Element {
    if (element instanceof Cell) {
      switch (element.type) {
        case "seat":
          if (element.passengers.length > 0) {
            const content = Array.from(element.passengers)[0];
            return this.render(content);
          }
          return (
            <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded">
              {element instanceof Seat ? element.seat : ""}
            </div>
          );
        case "alley":
          if (element.passengers.length > 0) {
            const content = Array.from(element.passengers)[0];
            return this.render(content);
          }
          return (
            <div className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded">
              {ALLEY}
            </div>
          );
      }
    }
    if (element instanceof Grid) {
      return (
        <div className="flex flex-col gap-2 bg-gray-300 p-4 rounded-lg">
          {element.cells.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((cell, colIndex) => (
                <div key={colIndex}>{this.render(cell)}</div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (element instanceof Passenger) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">
          {element.passenger}
        </div>
      );
    }
    element satisfies never;
    throw new Error("Invalid element");
  }
}

export class TextRenderer extends Renderer<string> {
  render(element: Grid | Cell | Passenger): string {
    if (element instanceof Cell) {
      if (element.passengers.length > 0) {
        const content = element.passengers[0];
        return this.render(content);
      }
      return element instanceof Seat ? element.seat : ALLEY;
    }
    if (element instanceof Grid) {
      return element.cells
        .map((row) => row.map((cell) => this.render(cell)).join(" ")) // Utilisation d'un espace pour séparer les cellules horizontalement
        .join("\n");
    }
    if (element instanceof Passenger) {
      return element.passenger;
    }
    element satisfies never;
    throw new Error("Invalid element");
  }
}

export { Cell, Seat, Alley, Passenger, Grid };
