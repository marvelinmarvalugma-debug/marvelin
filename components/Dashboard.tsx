
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Employee, FullEvaluation, UserRole } from '../types';
import { t, Language } from '../services/translations';
import { VulcanDB } from '../services/storageService';

interface DashboardProps {
  employees: Employee[];
  lang: Language;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ employees, lang }) => {
  const allEvaluations = VulcanDB.getEvaluations();
  
  const stats = useMemo(() => {
    const total = employees.length;
    if (total === 0) return { total: 0, avgScore: 0, deptData: [], topPerformers: [], supervisorData: [] };

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
    }).slice(0, 5);

    // Métricas por Supervisor para RRHH
    const supervisorEvalCount = allEvaluations.reduce((acc: any, ev) => {
      acc[ev.evaluador] = (acc[ev.evaluador] || 0) + 1;
      return acc;
    }, {});

    const supervisorData = Object.entries(supervisorEvalCount).map(([name, count]) => ({
      name: name.split(' ')[0],
      count
    })).sort((a: any, b: any) => b.count - a.count);

    return { total, avgScore, deptData, topPerformers, supervisorData };
  }, [employees, allEvaluations]);

  const chartData = employees.map(emp => ({
    name: emp.name.split(' ')[0],
    score: Math.round(emp.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0))
  })).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('total_employees', lang)}</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.total}</h3>
          <p className="text-[10px] text-emerald-600 mt-2 font-black uppercase">↑ {t('active_payroll', lang)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('avg_performance', lang)}</p>
          <h3 className="text-3xl font-black text-indigo-600 mt-2">{Math.round(stats.avgScore)}%</h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${stats.avgScore}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('op_status', lang)}</p>
          <h3 className="text-3xl font-black text-emerald-500 mt-2">100%</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-black uppercase">Seguridad SIHOA ✓</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('monthly_goal', lang)}</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">95%</h3>
          <p className="text-[10px] text-indigo-600 mt-2 font-black uppercase">{t('vulcan_obj', lang)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-b pb-3">{t('score_by_emp', lang)} (Top 10)</h4>
          <div className="h-64 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold'}}
                />
                <Bar dataKey="score" fill="#003366" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supervisor Activity - RRHH Focus */}
        <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-b pb-3">Evaluaciones por Supervisor</h4>
          <div className="h-64 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.supervisorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} width={80} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: 'bold'}}
                />
                <Bar dataKey="count" fill="#FFCC00" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-b pb-3">{t('dist_by_area', lang)}</h4>
          <div className="h-64 lg:h-80 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: 'bold'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t('honor_roll', lang)}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">{t('employee', lang)}</th>
                  <th className="px-6 py-4 hidden sm:table-cell">{t('role', lang)}</th>
                  <th className="px-6 py-4">{t('performance', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topPerformers.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={emp.photo} alt={emp.name} className="w-8 h-8 rounded-full border border-slate-200 grayscale" />
                        <div className="ml-3">
                          <p className="font-bold text-slate-700 text-xs uppercase">{emp.name.split(',')[0]}</p>
                          <p className="sm:hidden text-[9px] text-slate-400 font-bold uppercase">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase hidden sm:table-cell">{emp.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-indigo-600 font-black mr-2 text-xs">
                          {Math.round(emp.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0))}%
                        </span>
                        <div className="w-16 lg:w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${emp.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0)}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
