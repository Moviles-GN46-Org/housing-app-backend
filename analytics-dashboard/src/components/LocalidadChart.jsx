import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import analyticsService from "../services/analyticsService";

const LocalidadChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);


  const COLORS = ['#DA9958', '#2D3748', '#4A5568', '#718096', '#A0AEC0'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await analyticsService.getLocalidadStats();

        setData(response.data);
      } catch (error) {
        console.error("Error cargando estadísticas de localidades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center">Cargando datos geográficos...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Roommate Interest by Locality</h3>
          <p className="text-sm text-gray-500">How many users are looking for roommates in a specific zone?</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F0F0F0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="localidad" 
              type="category" 
              tick={{ fontSize: 12, fill: '#4A5568' }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#F7FAFC' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="conteo" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
          BQ3: Smart Geospatial Enrichment
        </span>
      </div>
    </div>
  );
};

export default LocalidadChart;