"use client";
import { startTransition, useEffect, useReducer, useState } from "react";
import { Grid, JSXRenderer } from "./airplane";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Page() {
  const [strategy, setStrategy] = useState("backToFront");

  return (
    <Component strategy={strategy} setStrategy={setStrategy} key={strategy} />
  );
}

function Component({
  strategy,
  setStrategy,
}: {
  strategy: string;
  setStrategy: (value: string) => void;
}) {
  const [grid] = useState<Grid>(() => {
    const grid = new Grid(7, 20);
    return grid;
  });

  const [, rerender] = useReducer((i) => i + 1, 0);
  const [iteration, setIteration] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    return grid.subscribe(rerender);
  }, [grid]);

  // console.log(grid?.render(new TextRenderer()));
  return (
    <>
      <div className="flex gap-2 items-center justify-center h-screen">
        <GridComponent grid={grid} key={strategy} />
        <div className="flex flex-col gap-2">
          <Button
            disabled={running}
            onClick={async () => {
              if (strategy === "backToFront") {
                grid.backToFront();
              }
              if (strategy === "frontToBack") {
                grid.frontToBack();
              }
              if (strategy === "random") {
                grid.randomize();
              }
              if (strategy === "windowMiddleAisle") {
                grid.windowMiddleAisle();
              }
              if (strategy === "steffenModified") {
                // grid.windowAisleMiddle();
              }

              setRunning(true);

              startTransition(async () => {
                while (!grid.allPassengersSeated) {
                  grid.movePassengers();
                  setIteration((prev) => prev + 1);
                  await new Promise((resolve) => setTimeout(resolve, 50));
                }
                setRunning(false);
              });
            }}
          >
            launch
          </Button>
          <Select
            disabled={running}
            value={strategy}
            onValueChange={(value) => {
              setStrategy(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backToFront">Back to Front</SelectItem>
              <SelectItem value="frontToBack">Front to Back</SelectItem>
              <SelectItem value="random">Random</SelectItem>
              <SelectItem value="windowMiddleAisle">
                Window Middle Aisle
              </SelectItem>
            </SelectContent>
            {/* <option value="windowMiddleAisle">Window Middle Aisle</option>
          <option value="steffenModified">Steffen Modified</option> */}
          </Select>
          {iteration} iterations
        </div>
      </div>
    </>
  );
}

function GridComponent({ grid }: { grid: Grid }) {
  return grid.render(new JSXRenderer());
}
