// airplane.test.ts
import { Alley, Grid, Passenger, TextRenderer } from "../app/airplane";
import { test, expect } from "vitest";

test("TextRenderer", () => {
  const renderer = new TextRenderer();
  const grid = new Grid(7, 2);
  const text = grid.render(renderer);
  expect(text).toBe(`0,0 1,0 2,0 A 4,0 5,0 6,0\n0,1 1,1 2,1 A 4,1 5,1 6,1`);

  // test moving passengers
  const passenger = new Passenger(grid.get(3, 0)!, "p");
  expect(grid.render(renderer)).toBe(
    `0,0 1,0 2,0 p 4,0 5,0 6,0\n0,1 1,1 2,1 A 4,1 5,1 6,1`
  );
  passenger.moveRight();
  expect(grid.render(renderer)).toBe(
    `0,0 1,0 2,0 A p 5,0 6,0\n0,1 1,1 2,1 A 4,1 5,1 6,1`
  );
  // assign a seat to the passenger
  passenger.assignedSeat = "6,1";
  // compute path to the seat
  const path = passenger.pathToSeat();
  const coords = path?.map((cell) => `${cell.x},${cell.y}`).join(" ");
  console.log(coords);
  expect(coords).toBe("3,0 3,1 4,1 5,1 6,1");
  // move the passenger to the seat
  const startingCell = grid.cells[0].find((cell) => cell instanceof Alley)!;
  passenger.moveAt(startingCell);
  for (let cell of path!) {
    passenger.moveAt(cell);
  }
  expect(grid.render(renderer)).toBe(
    `0,0 1,0 2,0 A 4,0 5,0 6,0\n0,1 1,1 2,1 A 4,1 5,1 p`
  );
});
