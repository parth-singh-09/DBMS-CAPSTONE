import React, { useEffect, useState } from 'react';
import {
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  IndianRupee,
  CreditCard,
  Clock,
  Ban,
  AlertTriangle,
  Repeat,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { DashboardKPI } from '../types';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Overview: React.FC = () => {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardAnalytics();
      setKpi(data.kpi);
      setCharts(data.charts);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-950 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-white shadow-md">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            Live MySQL 8.4 Database Analytics
          </span>
          <h1 className="text-lg sm:text-2xl font-bold mt-2 tracking-tight">
            E-Commerce Order & Customer Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            All metrics, chart aggregations, and performance counters are computed in real time from SQL
            queries executing directly against the normalized database.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold shadow-md transition-all self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total Customers"
          value={kpi?.totalCustomers ?? '—'}
          subtitle={`${kpi?.repeatCustomers ?? 0} repeat buyers`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Products"
          value={kpi?.totalProducts ?? '—'}
          subtitle={`Across ${kpi?.totalCategories ?? 0} categories`}
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Total Orders"
          value={kpi?.totalOrders ?? '—'}
          subtitle={`${kpi?.pendingOrders ?? 0} pending`}
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard
          title="Total Revenue"
          value={kpi ? `₹${Number(kpi.totalRevenue).toLocaleString()}` : '—'}
          subtitle="Non-cancelled orders"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Successful Paid"
          value={kpi ? `₹${Number(kpi.totalSuccessfulPayments).toLocaleString()}` : '—'}
          subtitle={`${kpi?.successfulPaymentsCount ?? 0} paid attempts`}
          icon={CreditCard}
          color="emerald"
        />
      </div>

      {/* Secondary Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending Orders</p>
            <p className="text-lg font-bold text-white">{kpi?.pendingOrders ?? 0}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cancelled Orders</p>
            <p className="text-lg font-bold text-white">{kpi?.cancelledOrders ?? 0}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Low Stock Items</p>
            <p className="text-lg font-bold text-white">{kpi?.lowStockProducts ?? 0}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Repeat Customers</p>
            <p className="text-lg font-bold text-white">{kpi?.repeatCustomers ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue Over Time</h3>
              <p className="text-xs text-slate-400">Daily sales aggregation from valid orders</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.revenueOverTime || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="order_date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Daily Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="daily_revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Orders Distribution by Status</h3>
              <p className="text-xs text-slate-400">Order lifecycle state breakdown</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.ordersByStatus || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any) => [val, 'Orders Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Selling Products */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Best-Selling Products by Revenue & Units</h3>
              <p className="text-xs text-slate-400">Top catalog items ranked by cumulative volume</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts?.bestSellers || []}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis dataKey="product_name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={130} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? `₹${Number(val).toLocaleString()}` : val,
                    name === 'revenue' ? 'Revenue' : 'Units Sold',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="units_sold" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Cohort Segmentation (vw_customer_type) */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Customer Segmentation</h3>
              <p className="text-xs text-slate-400">From View `vw_customer_type`</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.customerSegments || []}
                  dataKey="count"
                  nameKey="customer_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {(charts?.customerSegments || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Customers`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Overview;
