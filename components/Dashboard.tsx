import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useInventoryContext } from '../context/InventoryContext';
import { Card } from './Card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC = () => {
  const { inventoryData, warehouseTotals, totalInventoryCount, products } = useInventoryContext();

  const productChartData = useMemo(() => Object.entries(inventoryData)
    .map(([productId, data]) => ({
      name: data.productName,
      // FIX: Access warehouse stock through the new nested `stock` property.
      'انبار ۱': data.stock.w1 || 0,
      'انبار ۲': data.stock.w2 || 0,
    }))
    .filter(p => p['انبار ۱'] > 0 || p['انبار ۲'] > 0), [inventoryData]);

  const warehouseChartData = useMemo(() => warehouseTotals.map(w => ({
    name: w.name.split(' ')[0] + ' ' + w.name.split(' ')[1], // Shorten name
    value: w.total,
  })), [warehouseTotals]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-md font-semibold text-gray-500">کل موجودی</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalInventoryCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-md font-semibold text-gray-500">موجودی انبار ۱</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{warehouseTotals[0]?.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-md font-semibold text-gray-500">موجودی انبار ۲</h3>
            <p className="text-3xl font-bold text-orange-500 mt-2">{warehouseTotals[1]?.total || 0}</p>
        </div>
      </div>

      <Card title="موجودی بر اساس کالا">
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={productChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="انبار ۱" fill="#0088FE" />
                    <Bar dataKey="انبار ۲" fill="#00C49F" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </Card>

      <Card title="پراکندگی موجودی در انبارها">
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={warehouseChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        // FIX: The `percent` prop from recharts can be undefined or a string. Using Number() ensures
                        // the value is a number before multiplication, preventing the arithmetic operation type error.
                        label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                    >
                        {warehouseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
