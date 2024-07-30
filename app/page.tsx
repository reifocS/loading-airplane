"use client";
import {
  startTransition,
  use,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Grid, JSXRenderer } from "./airplane";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Page() {
  const [strategy, setStrategy] = useState("backToFront");
  const [value, restart] = useReducer((i) => i + 1, 0);
  const [width, setWidth] = useState(7);
  const [height, setHeight] = useState(15);
  const key = strategy + value.toString() + `w${width}h${height}`;

  return (
    <Component
      strategy={strategy}
      setStrategy={setStrategy}
      key={key}
      restart={restart}
      width={width}
      height={height}
      setWidth={setWidth}
      setHeight={setHeight}
    />
  );
}

function Component({
  strategy,
  setStrategy,
  restart,
  width,
  height,
  setWidth,
  setHeight,
}: {
  strategy: string;
  setStrategy: (value: string) => void;
  restart: () => void;
  width: number;
  height: number;
  setWidth: (value: number) => void;
  setHeight: (value: number) => void;
}) {
  const [grid] = useState<Grid>(() => {
    const grid = new Grid(width, height);
    return grid;
  });

  const [, rerender] = useReducer((i) => i + 1, 0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(150);
  const speedRef = useRef(speed);

  speedRef.current = speed;

  useEffect(() => {
    return grid.subscribe(rerender);
  }, [grid]);

  // console.log(grid?.render(new TextRenderer()));
  return (
    <>
      <div className="flex gap-2 items-center justify-center h-screen overflow-auto">
        <GridComponent grid={grid} key={strategy} />
        <div className="flex flex-col gap-2">
          <Button
            disabled={running || grid.allPassengersSeated}
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
              // if (strategy === "windowMiddleAisle") {
              //   grid.windowMiddleAisle();
              // }
              if (strategy === "steffen") {
                grid.steffen();
              }

              setRunning(true);

              while (!grid.allPassengersSeated) {
                grid.movePassengers();
                await new Promise((resolve) =>
                  setTimeout(resolve, speedRef.current)
                );
              }
              setRunning(false);
            }}
          >
            launch
          </Button>
          <Button
            disabled={grid.allPassengersSeated || !running}
            onClick={() => {
              if (!grid.isPaused) {
                grid.pause();
              } else {
                grid.resume();
              }
            }}
          >
            {grid.isPaused ? "resume" : "pause"}
          </Button>
          <Button
            onClick={() => {
              restart();
            }}
          >
            restart
          </Button>
          <Input
            type="number"
            step={1}
            value={width}
            disabled={running}
            onChange={(e) => setWidth(Number(e.target.value))}
          ></Input>
          <Input
            type="number"
            disabled={running}
            step={1}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          ></Input>
          <Select
            disabled={running}
            value={strategy}
            onValueChange={(value) => {
              setStrategy(value);
            }}
          >
            <Input
              type="range"
              min={10}
              max={1000}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backToFront">Back to Front</SelectItem>
              <SelectItem value="frontToBack">Front to Back</SelectItem>
              <SelectItem value="random">Random</SelectItem>
              {/* <SelectItem value="windowMiddleAisle">
                Window Middle Aisle
              </SelectItem> */}
              <SelectItem value="steffen">Steffen Modified</SelectItem>
            </SelectContent>
            {/* <option value="windowMiddleAisle">Window Middle Aisle</option>
          <option value="steffenModified">Steffen Modified</option> */}
          </Select>
          {grid.iterations} iterations
        </div>
      </div>
    </>
  );
}

function GridComponent({ grid }: { grid: Grid }) {
  return grid.render(new JSXRenderer());
}
