'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomBar = (props) => {
  const { fill, x, y, width, height, name } = props;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <g>
      <rect
        x={x}
        y={isHovered ? y - 2 : y}
        width={width}
        height={isHovered ? height + 2 : height}
        fill={fill}
        rx={4}
        className="transition-all duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          opacity: isHovered ? 1 : 0.8,
          filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none',
        }}
      />
    </g>
  );
};

export default function CaseStatisticsChart({ data }) {
  // Process data to ensure consistent colors and styling
  const processedData = data?.map(item => ({
    ...item,
    fill: '#4B5563', // Consistent gray color for all bars
  })) || [];

  return (
    <div className="bg-card p-2 rounded-lg">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={processedData}
          layout="vertical"
          margin={{ left: 32, right: 32, top: 16, bottom: 16 }}
          barCategoryGap={32}
          barGap={8}
        >
          <CartesianGrid 
            horizontal={false} 
            strokeDasharray="3 3" 
            stroke="#e5e5e5" 
            vertical={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#222", fontSize: 14, fontWeight: 500 }}
            width={90}
          />
          <XAxis 
            type="number" 
            hide 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '9999px',
              padding: '6px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            labelStyle={{ display: 'none' }}
            formatter={(value, name, props) => [
              <div key="tooltip" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-800"></span>
                <span className="text-sm font-medium text-gray-900">
                  {value} {value === 1 ? 'Case' : 'Cases'}
                </span>
              </div>,
              null
            ]}
          />
          <Bar
            dataKey="value"
            name="Cases"
            radius={[4, 4, 0, 0]}
            barSize={24}
            shape={<CustomBar />}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
