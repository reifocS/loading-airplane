"use client";
import { startTransition, useEffect, useReducer, useState } from "react";
import { Alley, Grid, JSXRenderer, Passenger } from "./airplane";

export default function Component() {
  const [grid] = useState<Grid>(() => {
    const grid = new Grid(7, 10);
    return grid;
  });

  const [, rerender] = useReducer((i) => i + 1, 0);

  useEffect(() => {
    return grid.subscribe(rerender);
  }, [grid]);

  // console.log(grid?.render(new TextRenderer()));
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        {grid?.render(new JSXRenderer())}
        <button
          onClick={async () => {
            startTransition(async () => {
              while (!grid.allPassengersSeated) {
                grid.movePassengers();
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            });
          }}
        >
          launch
        </button>
        <input></input>
      </div>
    </>
  );
}
