import React from "react";
import { LineChart, Line, ReferenceLine } from "recharts";

interface SparkLineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showLastValue?: boolean;
}

export function SparkLine({
  data,
  color,
  width = 60,
  height = 20,
  strokeWidth = 1.5,
  showLastValue = false,
}: SparkLineProps) {
  const [hovered, setHovered] = React.useState(false);

  if (data.length === 0) return null;

  const lastValue = data[data.length - 1];

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
    <div 
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={false}
          activeDot={false}
          isAnimationActive={true}
          animationDuration={800}
        />
      </LineChart>
      
      {showLastValue && (
        <span style={{ 
          fontSize: 9, 
          fontWeight: 700, 
          color, 
          marginLeft: 4, 
          fontFamily: 'var(--font-mono)',
          opacity: 0.8
        }}>
          {lastValue}%
        </span>
      )}

      {hovered && (
        <div style={{
          position: 'absolute',
          top: -24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--proof-surface-3)',
          border: '1px solid var(--proof-border)',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--proof-text)',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--proof-shadow-md)',
          pointerEvents: 'none',
          zIndex: 10,
          animation: 'scale-in 0.15s ease-out'
        }}>
          {lastValue}{data.every(v => v <= 100) ? '%' : ''}
        </div>
      )}
    </div>
  );
}
