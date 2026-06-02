import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import analyticsService from "../services/analyticsService";

const DeviceBrandChart = ({ refreshToken }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await analyticsService.getDeviceBrandStats();
        setData(response.data || []);
      } catch (error) {
        console.error("Error cargando marcas:", error);
      }
    };

    fetchData();
  }, [refreshToken]);

  const COLORS = ["#DA9958", "#2D3748", "#4A5568", "#718096", "#A0AEC0"];

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E8DDD4] shadow-sm h-full flex flex-col">
      <h2 className="text-mocha font-semibold text-sm mb-4 uppercase">
        Most used brand devices
      </h2>
      
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-taupe text-sm">
          Aún no hay datos de dispositivos...
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="conteo"
                nameKey="marca"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DeviceBrandChart;