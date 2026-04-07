import React, { FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TimeSeriesLineChartProps {
  data: Array<{ date: string; [key: string]: any }>;
  series: Array<{ key: string; label: string }>;
  title: string;
  height?: number;
}

export const TimeSeriesLineChart: FC<TimeSeriesLineChartProps> = ({ data, series, title, height = 400 }) => {
  return (
    <div className="bg-white p-4 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 60, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#333"
            height={80}
            tick={(props) => {
              const { x, y, payload } = props;
              const [programs, date] = payload.value.split('\n');
              return (
                <g transform={`translate(${x},${y})`}>
                  <text x={0} y={5} dy={10} textAnchor="middle">
                    {programs}
                  </text>
                  <text x={0} y={25} dy={10} textAnchor="middle">
                    {date}
                  </text>
                </g>
              );
            }}
          />
          <YAxis stroke="#333" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            labelStyle={{ color: '#333' }}
          />
          <Legend wrapperStyle={{ color: '#333' }} />
          {series.map((serie, index) => (
            <Line
              key={serie.key}
              type="monotone"
              dataKey={serie.key}
              name={serie.label}
              stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
              strokeWidth={2}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
