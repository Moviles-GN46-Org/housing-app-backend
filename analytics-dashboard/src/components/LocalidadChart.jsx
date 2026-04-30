import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MapPinned, Loader2, AlertCircle } from "lucide-react";
import analyticsService from "../services/analyticsService";

const LocalidadChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const COLORS = ["#DA9958", "#2D3748", "#4A5568", "#718096", "#A0AEC0"];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await analyticsService.getLocalidadStats();
        const rows = Array.isArray(response?.data) ? response.data : [];
        setData(rows);
      } catch (error) {
        console.error("Error loading district statistics:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="bg-white_card rounded-2xl border border-[#E8DDD4] p-12 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-bronze mb-2" size={24} />
        <p className="text-taupe text-xs">Loading location data...</p>
      </div>
    );

  if (error)
    return (
      <div className="bg-white_card rounded-2xl border border-[#E8DDD4] p-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-rose-400 mb-2" size={24} />
        <p className="text-mocha font-medium text-sm">Connection Error</p>
        <p className="text-taupe text-xs">Unable to load location metrics.</p>
      </div>
    );

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
              <MapPinned size={16} className="text-bronze" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">
                District Activity
              </p>
              <h2 className="text-mocha font-semibold text-sm">
                Usage by District (Bogota)
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {data.length} districts
          </div>
        </div>

        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E8DDD4"
                strokeOpacity={0.6}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="localidad"
                type="category"
                tick={{ fontSize: 11, fill: "#8B7364" }}
                width={106}
              />
              <Tooltip
                cursor={{ fill: "#FBF3EB" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E8DDD4",
                  backgroundColor: "#FEFBF9",
                  boxShadow: "0 8px 20px rgba(88, 70, 58, 0.1)",
                }}
              />
              <Bar dataKey="conteo" radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LocalidadChart;
