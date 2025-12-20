
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Employee } from '../types';

interface DashboardProps {
  employees: Employee[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ employees }) => {
  const stats = useMemo(() => {
    const total = employees.length;
    const avgScore = employees.reduce((acc, emp) => {
      const score = emp.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0);
      return acc + score;
    }, 0) / total;

    const deptDistribution = employees.reduce((acc: any, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {});

    const deptData = Object.entries(deptDistribution).map(([name, value]) => ({ name, value }));

    const topPerformers = [...employees].sort((a, b) => {
      const scoreA = a.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0);
      const scoreB = b.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0);
      return scoreB - scoreA;
    }).slice(0, 3);

    return { total, avgScore, deptData, topPerformers };
  }, [employees]);

  const chartData = employees.map(emp => ({
    name: emp.name.split(' ')[0],
    score: Math.round(emp.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0))
  }));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Empleados</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium">↑ 12% desde el mes pasado</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Promedio Desempeño</p>
          <h3 className="text-3xl font-bold text-indigo-600 mt-2">{Math.round(stats.avgScore)}%</h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-full" style={{ width: `${stats.avgScore}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Evaluaciones Pendientes</p>
          <h3 className="text-3xl font-bold text-amber-500 mt-2">5</h3>
          <p className="text-xs text-slate-400 mt-2">Vence en 3 días</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Nivel de Satisfacción</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">4.8/5</h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium">Basado en encuestas 360°</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-semibold text-slate-800 mb-6">Puntuación General por Empleado</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-semibold text-slate-800 mb-6">Distribución por Departamento</h4>
          <div className="h-80 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h4 className="text-lg font-semibold text-slate-800">Top Performers</h4>
          <button className="text-indigo-600 text-sm font-medium hover:underline">Ver todos</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Empleado</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Departamento</th>
              <th className="px-6 py-4">Puntuación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.topPerformers.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img src={emp.photo} alt={emp.name} className="w-8 h-8 rounded-full border border-slate-200" />
                    <span className="ml-3 font-medium text-slate-700">{emp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    {emp.department}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-emerald-600 font-bold mr-2">
                      {Math.round(emp.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0))}%
                    </span>
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${emp.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0)}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
