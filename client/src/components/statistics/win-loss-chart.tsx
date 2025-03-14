import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

interface WinLossData {
  name: string;
  value: number;
  fill: string;
}

interface WinLossChartProps {
  data: WinLossData[];
  height?: number;
}

const WinLossChart = ({ data, height = 250 }: WinLossChartProps) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">No match data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} matches`, null]} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default WinLossChart;
