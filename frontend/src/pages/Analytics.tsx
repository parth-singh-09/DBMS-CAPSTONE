import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  CreditCard,
  Package,
  Users,
  Award,
  Layers,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm">Calculating relational analytics & metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
        <p className="font-semibold">Error Loading Analytics</p>
        <p className="text-sm mt-1">{error || 'Unknown error occurred'}</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpi, charts } = data;

  // Format category revenue data
  const categoryData = (charts.revenueByCategory || []).map((c: any) => ({
    name: c.category_name,
    revenue: Number(c.total_revenue),
    units: Number(c.units_sold),
  }));

  // Format payment methods
  const paymentData = (charts.paymentMethods || []).map((p: any) => ({
    method: `${p.method} (${p.status})`,
    amount: Number(p.total_amount),
    count: Number(p.transaction_count),
  }));

  // Customer segments from vw_customer_type
  const segmentData = (charts.customerSegments || []).map((s: any) => ({
    name: s.customer_type,
    count: Number(s.count),
    revenue: Number(s.total_revenue || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart2 className="w-7 h-7 text-indigo-400" />
            E-Commerce & Customer Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time business intelligence derived from SQL aggregation, grouping, and analytical views
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Order Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">₹{kpi.totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Collected via Payments:</span>
            <span className="font-semibold text-slate-200">₹{kpi.totalSuccessfulPayments.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{kpi.totalOrders}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Fulfilled / Delivered:</span>
            <span className="font-semibold text-emerald-400">{kpi.deliveredOrders} orders</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Repeat Customer Rate</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {kpi.totalCustomers > 0 ? ((kpi.repeatCustomers / kpi.totalCustomers) * 100).toFixed(0) : 0}%
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Repeat Buyers (≥2 orders):</span>
            <span className="font-semibold text-slate-200">{kpi.repeatCustomers} customers</span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog & Stock Health</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{kpi.totalProducts} Products</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Low Stock Warnings:</span>
            <span className={`font-semibold ${kpi.lowStockProducts > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {kpi.lowStockProducts} items
            </span>
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Category Revenue & Customer Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue by Product Category</h2>
              <p className="text-xs text-slate-400">Total sales volume and revenue generated across categories</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              JOIN + GROUP BY
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Segmentation */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Customer Segmentation</h2>
              <p className="text-xs text-slate-400">Classified using SQL View <code>vw_customer_type</code></p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              CASE WHEN
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {segmentData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(value: any, name: any) => [`${value} Customers`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-700/40">
            {segmentData.map((s: any, idx: number) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-300 font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">{s.count} users</span>
                  <span className="text-slate-200 font-semibold font-mono">₹{s.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Payment Distribution & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Methods */}
        <div className="lg:col-span-6 bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Payment Methods Distribution</h2>
              <p className="text-xs text-slate-400">Total volume and transaction status per payment channel</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              payments
            </span>
          </div>

          <div className="space-y-3">
            {paymentData.map((p: any, idx: number) => (
              <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">{p.method}</span>
                    <span className="text-[11px] text-slate-400 block">{p.count} transactions</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400 font-mono">₹{p.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="lg:col-span-6 bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Top Revenue Generating Products</h2>
              <p className="text-xs text-slate-400">Ranked by total sales revenue from completed orders</p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              SUM + ORDER BY
            </span>
          </div>

          <div className="space-y-3">
            {(charts.bestSellers || []).map((prod: any, idx: number) => (
              <div
                key={prod.product_id}
                className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-200">{prod.product_name}</span>
                    <span className="text-[11px] text-slate-400 block">
                      {prod.category_name} • {prod.units_sold} units sold
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-100 font-mono">₹{Number(prod.revenue).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
