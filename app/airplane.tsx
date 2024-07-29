"use client";

const ALLEY = "A";
const SEAT = "S";
const VOID = " ";
const PASSENGER = new RegExp(/[a-z]/);

type CellType = "seat" | "alley" | "entrance" | "void";
class Cell {
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

  render<T>(renderer: Renderer<T>): T {
    return renderer.render(this);
  }

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
  embarked: boolean = false;
  color: string = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  constructor(cell: Cell, passenger: string) {
    this.passenger = passenger;
    this.cell = cell;
    cell.passengers.push(this);
  }
  render<T>(renderer: Renderer<T>) {
    return renderer.render(this);
  }

  takeTurn() {
    if (this.assignedSeat === "") {
      return;
    }
    const nextCell = this.nextCell();
    if (nextCell) {
      if (nextCell.isEmpty()) {
        this.move(nextCell);
      } else if (nextCell instanceof Seat) {
        // we have to go trough the passenger
        this.move(nextCell);
      }
    }
  }

  private move(cell: Cell) {
    this.cell.passengers = this.cell.passengers.filter((c) => c !== this);
    this.cell = cell;
    cell.passengers.push(this);
  }

  assignSeat(seat: string) {
    this.assignedSeat = seat;
  }

  nextCell() {
    if (this.assignedSeat === "") {
      return;
    }
    if (this.cell instanceof Seat && this.cell.seat === this.assignedSeat) {
      return;
    }
    let current = this.cell;
    if (!this.cell) {
      throw new Error("No cell found");
    }
    const [x, y] = this.assignedSeat.split(",").map(Number);

    if (current.y !== y) {
      return current.down()!;
    }

    // if we are on the alley, we move to the seat row
    // left or right
    if (current.x < x) {
      return current.right()!;
    } else {
      return current.left()!;
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

class Grid {
  movePassengers() {
    this.passengers.forEach((p) => p.takeTurn());
    this.listeners.forEach((listener) => listener());
    if (
      this.passengers.every((p) => {
        return p.cell instanceof Seat && p.cell.seat === p.assignedSeat;
      })
    ) {
      this.allPassengersSeated = true;
    }
  }
  cells: Cell[][];
  listeners: Array<() => void>;
  allPassengersSeated: boolean = false;
  passengers: Array<Passenger> = [];

  frontToBack() {
    this.passengers = this.passengers.sort((a, b) => {
      // check assigned seat
      const aSeat = a.assignedSeat.split(",").map(Number);
      const bSeat = b.assignedSeat.split(",").map(Number);
      return aSeat[1] - bSeat[1];
    });
  }

  randomize() {
    this.passengers = this.passengers.sort(() => Math.random() - 0.5);
  }

  windowMiddleAisle() {}

  backToFront() {
    this.passengers = this.passengers.sort((a, b) => {
      // check assigned seat
      const aSeat = a.assignedSeat.split(",").map(Number);
      const bSeat = b.assignedSeat.split(",").map(Number);
      return bSeat[1] - aSeat[1];
    });
  }

  constructor(width: number = 0, height: number = 0) {
    this.cells = [];
    this.listeners = [];

    // first row is the entrance with void cells
    this.cells.push(
      Array.from({ length: width }, (_, x) => {
        if (x === Math.floor(width / 2)) {
          return new Cell(x, 0, this, "entrance");
        }
        return new Cell(x, 0, this, "void");
      })
    );

    const entrance = this.cells[0][Math.floor(width / 2)];
    // rest of the rows are seats and alleys
    for (let y = 1; y < height; y++) {
      this.cells.push(
        Array.from({ length: width }, (_, x) => {
          if (x === Math.floor(width / 2)) {
            return new Alley(x, y, this, "alley");
          }
          return new Seat(x, y, this, "seat", `${x},${y}`);
        })
      );
    }
    // create passengers, assign each passenger to a seat, they all start at the entrance
    for (let y = 1; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = this.cells[y][x];
        if (cell instanceof Seat) {
          const passenger = new Passenger(entrance, `${x}${y}`);
          passenger.assignSeat(`${x},${y}`);
          this.passengers.push(passenger);
        }
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners = [...this.listeners, listener];
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  get(x: number, y: number): Cell | undefined {
    return this.cells[y]?.[x];
  }

  render<T>(renderer: Renderer<T>): T {
    return renderer.render(this);
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
            const content = element.passengers[element.passengers.length - 1];
            return this.render(content);
          }
          return (
            <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded">
              {element instanceof Seat ? element.seat.replace(",", "") : ""}
            </div>
          );
        case "alley":
          if (element.passengers.length > 0) {
            const content = Array.from(element.passengers)[0];
            return this.render(content);
          }
          return <div className="w-8 h-8"></div>;
        case "entrance":
          if (element.passengers.length > 0) {
            const content = Array.from(element.passengers)[0];
            return this.render(content);
          }
          return <div className="w-8 h-8"></div>;
        case "void":
          return <div className="bg-transparent w-8 h-8"></div>;
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
        <div
          className="flex items-center justify-center w-8 h-8 text-white rounded-full"
          style={{
            backgroundColor: element.color,
          }}
        >
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
