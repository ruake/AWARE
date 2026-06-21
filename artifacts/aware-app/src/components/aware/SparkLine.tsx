import React from "react";
import { LineChart, Line, ReferenceLine } from "recharts";

interface SparkLineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export function SparkLine({
  data,
  color,
  width = 60,
  height = 20,
  strokeWidth = 1.5,
}: SparkLineProps) {
  if (data.length === 0) return null;

  if (data.length === 1) {
    const chartData = [{ v: data[0] }, { v: data[0] }];
    return (
      <LineChart
        width={width}
        height={height}
        data={chartData}
        margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
      >
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="3 3"
          strokeOpacity={0.5}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </LineChart>
    );
  }

  const allSame = data.every((v) => v === data[0]);
  const chartData = data.map((v) => ({ v }));

  return (
    <LineChart
      width={width}
      height={height}
      data={chartData}
      margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
    >
      {allSame && (
        <ReferenceLine
          y={data[0]}
          stroke={color}
          strokeOpacity={0.35}
          strokeDasharray="2 2"
        />
      )}
      <Line
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={strokeWidth}
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
