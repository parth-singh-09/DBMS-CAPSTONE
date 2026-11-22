import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { AppLayout } from './layouts/AppLayout';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-white">Application Connection Error</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unable to load page content. If this is running on Vercel, please ensure your backend API is online and the{' '}
              <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">VITE_API_URL</code> environment variable is configured in your Vercel Project Settings.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all text-left">
              {this.state.error?.message || 'Unknown render error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              Retry / Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages
import Overview from './pages/Overview';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Discounts from './pages/Discounts';
import Orders from './pages/Orders';
import OrderItems from './pages/OrderItems';
import Payments from './pages/Payments';
import Deliveries from './pages/Deliveries';
import QueryLab from './pages/QueryLab';
import Analytics from './pages/Analytics';
import Views from './pages/Views';
import IndexManagement from './pages/IndexManagement';
import Transactions from './pages/Transactions';
import DatabaseTesting from './pages/DatabaseTesting';
import SqlConcepts from './pages/SqlConcepts';
import DatabaseSchema from './pages/DatabaseSchema';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="customers" element={<Customers />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="discounts" element={<Discounts />} />
          <Route path="orders" element={<Orders />} />
          <Route path="order-items" element={<OrderItems />} />
          <Route path="payments" element={<Payments />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="query-lab" element={<QueryLab />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="views" element={<Views />} />
          <Route path="indexes" element={<IndexManagement />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="testing" element={<DatabaseTesting />} />
          <Route path="concepts" element={<SqlConcepts />} />
          <Route path="schema" element={<DatabaseSchema />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <VercelAnalytics />
    </BrowserRouter>
  </ErrorBoundary>
);
}
