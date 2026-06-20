import React from "react";
import { LineChart, Line } from "recharts";

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
  if (data.length < 2) return null;
  const chartData = data.map((v) => ({ v }));
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
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
