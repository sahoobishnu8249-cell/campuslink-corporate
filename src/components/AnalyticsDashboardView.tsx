import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Briefcase, 
  Award, 
  Filter, 
  Layers, 
  Building2,
  Calendar
} from 'lucide-react';
import { CampusPlacementStats } from '../types/index.ts';

interface AnalyticsDashboardViewProps {
  stats: CampusPlacementStats;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({ stats }) => {
  const [selectedBranch, setSelectedBranch] = useState('All');

  const filteredBranchData = selectedBranch === 'All'
    ? stats.branchPlacement
    : stats.branchPlacement.filter(b => b.branch.toLowerCase().includes(selectedBranch.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Placement Conversion & Market Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Data-driven institutional intelligence across departments, corporate packages, and skill demands.
          </p>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-xs text-slate-500 font-medium">Branch:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent pr-4 py-1 focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Disciplines</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="AI & DS">AI & DS</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
          </select>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">Average Package</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">₹{stats.averagePackageLPA} LPA</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">↑ 10.3% vs 2025</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">Highest Package</div>
          <div className="text-2xl font-black text-indigo-600 font-mono mt-1">₹{stats.highestPackageLPA} LPA</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Google Super Dream</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">Total Placed Students</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{stats.placedStudents}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">72.4% Overall Rate</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">Active Corporate Partners</div>
          <div className="text-2xl font-black text-purple-600 font-mono mt-1">46+</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Tier-1 Marquee Recruiters</div>
        </div>
      </div>

      {/* Row 1 Charts: Branch Placement Rate & Skill Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Branch-wise Placement Rate */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Branch-wise Placement Rate (%)</h3>
              <p className="text-xs text-slate-500">Placement percentage per engineering department</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Batch 2026
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBranchData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any) => [`${val}%`, 'Placement Rate']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="rate" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Skill-wise Demand */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Most In-Demand Skills</h3>
              <p className="text-xs text-slate-500">Frequency of required skills across all active JDs</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Recruiter JDs
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.skillDemand} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  formatter={(val: any) => [`${val}% of drives`, 'JD Match Frequency']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="percentage" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2 Charts: CTC Package Trend & CTC Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 3: Average & Highest Package Trend */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Annual Package Growth Trend (LPA)</h3>
              <p className="text-xs text-slate-500">Average vs Highest CTC trend over the last 4 batches</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.averagePackageTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="highestColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="avgColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`₹${val} LPA`, name === 'highest' ? 'Highest CTC' : 'Average CTC']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Area type="monotone" dataKey="highest" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#highestColor)" />
                <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#avgColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-semibold pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600" />
              <span>Highest Package</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Average Package</span>
            </div>
          </div>
        </div>

        {/* Chart 4: Package Bracket Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Package Bracket Distribution</h3>
              <p className="text-xs text-slate-500">Number of offers across salary brackets</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.packageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Candidates`, 'Offers Count']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: Offers by Company Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Recruiter Engagement & Offers by Company</h3>
            <p className="text-xs text-slate-500">Corporate partners ranked by campus hiring volume</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Total Corporate Offers: <strong className="text-indigo-600 font-bold">{stats.totalOffers}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3 pl-2">Company Name</th>
                <th className="pb-3 text-center">Offers Extended</th>
                <th className="pb-3 text-right">Average Package</th>
                <th className="pb-3 text-right pr-2">Hiring Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.offersByCompany.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-2 font-extrabold text-slate-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {c.company.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{c.company}</span>
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-slate-800">
                    {c.offers} offers
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-700">
                    {c.avgCtc}
                  </td>
                  <td className="py-3 text-right pr-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      parseFloat(c.avgCtc.replace(/[^0-9.]/g, '')) >= 25 ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      parseFloat(c.avgCtc.replace(/[^0-9.]/g, '')) >= 14 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {parseFloat(c.avgCtc.replace(/[^0-9.]/g, '')) >= 25 ? 'Super Dream' : parseFloat(c.avgCtc.replace(/[^0-9.]/g, '')) >= 14 ? 'Dream' : 'Core'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
