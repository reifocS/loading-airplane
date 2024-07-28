"use client";
import { useEffect, useSyncExternalStore } from "react";
import {
  Grid,
  gridStore,
  JSXRenderer,
  Passenger,
  TextRenderer,
} from "./airplane";

const serverGrid = new Grid(7, 10);
export default function Component() {
  const grid = useSyncExternalStore(
    gridStore.subscribe,
    gridStore.getSnapshot,
    () => serverGrid
  );

  useEffect(() => {
    const passengers = grid.cells
      .flat()
      .map((cell) => cell.passengers)
      .flat();
    if (passengers.length === 0) {
      // create a new passenger if there are no passengers
      const x = Math.floor(Math.random() * grid.cells[0].length);
      const y = Math.floor(Math.random() * grid.cells.length);
      const passenger = new Passenger(grid.get(x, y)!, "p");
      passengers.push(passenger);
    }
    const onkeydown = (e: KeyboardEvent) => {
      for (let passenger of passengers) {
        if (e.key === "ArrowRight") {
          passenger.moveRight();
        } else if (e.key === "ArrowLeft") {
          passenger.moveLeft();
        } else if (e.key === "ArrowUp") {
          passenger.moveUp();
        } else if (e.key === "ArrowDown") {
          passenger.moveDown();
        }
      }
      if (e.key === " ") {
        // create a new passenger
        const x = Math.floor(Math.random() * grid.cells[0].length);
        const y = Math.floor(Math.random() * grid.cells.length);
        new Passenger(grid.get(x, y)!, "p");
      }
    };

    window.addEventListener("keydown", onkeydown);

    return () => window.removeEventListener("keydown", onkeydown);
  }, [grid]);

  console.log(grid?.render(new TextRenderer()));
  return (
    <>
      <div className="flex items-center justify-center h-screen">
        {grid?.render(new JSXRenderer())}
      </div>
    </>
  );
}
