import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Tags,
  Package,
  Boxes,
  Percent,
  ShoppingCart,
  ListOrdered,
  CreditCard,
  Truck,
  Terminal,
  LineChart,
  Eye,
  KeyRound,
  Workflow,
  CheckCircle,
  Network,
  Settings,
  Database,
  ExternalLink,
  ChevronRight,
  Bell,
  Code2,
  Server,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import { api } from '../services/api';

const navItems = [
  { section: 'Dashboard & Core' },
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { section: 'Data Management' },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Categories', path: '/categories', icon: Tags },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Inventory', path: '/inventory', icon: Boxes },
  { name: 'Discounts', path: '/discounts', icon: Percent },
  { name: 'Orders', path: '/orders', icon: ShoppingCart },
  { name: 'Order Items', path: '/order-items', icon: ListOrdered },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Deliveries', path: '/deliveries', icon: Truck },
  { section: 'DBMS Engine Lab' },
  { name: 'SQL Query Lab', path: '/query-lab', icon: Terminal, highlight: true },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'Views', path: '/views', icon: Eye },
  { name: 'Index Management', path: '/indexes', icon: KeyRound },
  { name: 'Transactions', path: '/transactions', icon: Workflow },
  { name: 'Database Testing', path: '/testing', icon: CheckCircle },
  { name: 'SQL Concepts', path: '/concepts', icon: Code2 },
  { name: 'Database Schema', path: '/schema', icon: Network },
  { section: 'System' },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const AppLayout: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; version?: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const status = await api.getSystemStatus();
        setDbStatus({
          connected: status.database.connected,
          version: status.database.version,
        });
      } catch {
        setDbStatus({ connected: false });
      }
    };
    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => clearInterval(interval);
  }, []);

  // Determine current page title
  const currentNav = navItems.find((item) => 'path' in item && item.path === location.pathname);
  const pageTitle = currentNav && 'name' in currentNav ? currentNav.name : 'Overview';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. DARK NAVY SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-snug">ShopDBMS</h1>
              <p className="text-[11px] font-medium text-slate-400">MySQL 8.4 Engine</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 text-xs">
          {navItems.map((item, idx) => {
            if ('section' in item) {
              return (
                <div key={idx} className="pt-3 pb-1 px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.section}
                  </span>
                </div>
              );
            }

            const Icon = item.icon;
            const isHighlight = item.highlight;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : isHighlight
                      ? 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {isHighlight && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                    SQL
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Database Status Pill */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/80">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-2 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
              <span className="text-slate-300 font-medium">
                {dbStatus?.connected ? `shop (v${dbStatus.version?.split('-')[0]})` : 'Disconnected'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Port 3306</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white tracking-tight truncate max-w-[170px] sm:max-w-none">
              {pageTitle}
            </h2>
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400">
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span>E-Commerce Analytics System</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Live DB Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="hidden sm:inline">Live MySQL Connection</span>
              <span className="sm:hidden font-mono">Live DB</span>
            </div>

            <div className="hidden lg:block h-5 w-px bg-slate-800"></div>

            {/* Academic Tag */}
            <div className="text-right hidden lg:block">
              <p className="text-xs font-semibold text-slate-200">DBMS Mini Project</p>
              <p className="text-[10px] text-slate-400 font-mono">BCNF / 3NF Relational Model</p>
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
