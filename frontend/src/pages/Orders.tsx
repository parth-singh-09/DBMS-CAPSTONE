import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  CreditCard,
  AlertCircle,
  PackageCheck,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';
import { Order, Customer, Product, Discount, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

interface OrderItemRow {
  product_id: number;
  quantity: number;
  product?: Product;
}

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('order_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isLoading, setIsLoading] = useState(false);

  // Auxiliary data for order creation
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Creation State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | ''>('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.getOrders({
        search,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res && Array.isArray(res.data)) {
        setOrders(res.data);
      }
      if (res && res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setServerError(err.message || 'Unable to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuxData = async () => {
    try {
      const [cRes, pRes, dRes] = await Promise.all([
        api.getCustomers({ limit: 100 }),
        api.getProducts({ limit: 100 }),
        api.getDiscounts({ limit: 100 }),
      ]);
      setCustomers(cRes.data);
      setProducts(pRes.data);
      setDiscounts(dRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [pagination.page, search, statusFilter, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('ASC');
    }
  };

  const openCreateModal = () => {
    setServerError(null);
    setSelectedCustomerId(customers[0]?.customer_id || '');
    setSelectedDiscountId('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    if (products.length > 0) {
      setOrderItems([{ product_id: products[0].product_id, quantity: 1, product: products[0] }]);
    } else {
      setOrderItems([]);
    }
    setIsCreateOpen(true);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    setOrderItems([...orderItems, { product_id: products[0].product_id, quantity: 1, product: products[0] }]);
  };

  const removeItemRow = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const updateItemRowProduct = (idx: number, productId: number) => {
    const prod = products.find((p) => p.product_id === productId);
    const updated = [...orderItems];
    updated[idx] = { ...updated[idx], product_id: productId, product: prod };
    setOrderItems(updated);
  };

  const updateItemRowQty = (idx: number, quantity: number) => {
    const updated = [...orderItems];
    updated[idx] = { ...updated[idx], quantity: Math.max(1, quantity) };
    setOrderItems(updated);
  };

  // Calculations
  const subtotal = orderItems.reduce((sum, item) => {
    const price = Number(item.product?.unit_price || 0);
    return sum + price * item.quantity;
  }, 0);

  const selectedDiscount = discounts.find((d) => d.discount_id === Number(selectedDiscountId));
  const discountAmount = selectedDiscount
    ? selectedDiscount.discount_type === 'PERCENT'
      ? (subtotal * Number(selectedDiscount.value)) / 100
      : Number(selectedDiscount.value)
    : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setServerError('Please select a customer');
      return;
    }
    if (orderItems.length === 0) {
      setServerError('Please add at least one product item');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await api.createOrder({
        customer_id: Number(selectedCustomerId),
        discount_id: selectedDiscountId ? Number(selectedDiscountId) : null,
        order_date: orderDate,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      setIsCreateOpen(false);
      loadOrders();
      loadAuxData(); // Refresh product stock levels
    } catch (err: any) {
      setServerError(
        err.response?.data?.details ||
        err.response?.data?.message ||
        'Transaction failed and was safely rolled back.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewModal = async (orderId: number) => {
    try {
      const full = await api.getOrderById(orderId);
      setViewingOrder(full);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadOrders();
      if (viewingOrder && viewingOrder.order_id === orderId) {
        openViewModal(orderId);
      }
    } catch (err: any) {
      alert(`Status update error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    try {
      await api.deleteOrder(deletingOrder.order_id);
      setDeletingOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'order_id',
      header: 'Order #',
      sortable: true,
      width: '80px',
      render: (o) => <span className="font-mono text-indigo-400 font-bold">#{o.order_id}</span>,
    },
    {
      key: 'order_date',
      header: 'Date Placed',
      sortable: true,
      render: (o) => (
        <span className="font-mono text-xs text-slate-300">{o.order_date?.split('T')[0]}</span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (o) => (
        <div>
          <p className="font-semibold text-white">{o.customer_name}</p>
          <p className="text-[11px] text-slate-400">{o.customer_email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'discount_code',
      header: 'Discount Code',
      render: (o) =>
        o.discount_code ? (
          <span className="font-mono text-[11px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold border border-indigo-500/20">
            {o.discount_code} (-{o.discount_value}%)
          </span>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      render: (o) => (
        <span className="font-mono font-bold text-white">
          ₹{Number(o.total_amount).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'delivery',
      header: 'Delivery Courier',
      render: (o) =>
        o.has_delivery ? (
          <div className="flex items-center space-x-1.5 text-slate-300 text-xs">
            <Truck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{o.courier}</span>
            <span className="text-[10px] font-mono text-slate-400">({o.tracking_no})</span>
          </div>
        ) : (
          <span className="text-slate-500 text-xs italic">Unassigned</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className="text-xs text-slate-400 font-mono">Total Orders: {pagination.total}</div>
      </div>

      <DataTable
        title="Orders Processing"
        subtitle="Manage customer orders, multi-product line items, payment status, and dispatch"
        columns={columns}
        data={orders}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        searchValue={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onAdd={openCreateModal}
        addLabel="Place New Order"
        onRefresh={loadOrders}
        isLoading={isLoading}
        actions={(o) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openViewModal(o.order_id)}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
              title="View Order Details & Line Items"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingOrder(o)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete Order"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Interactive Order Creation Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Place New Order (Atomic Transaction)"
        subtitle="Select customer, add products, adjust quantities, verify stock, and commit via an ACID database transaction."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 font-medium flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Customer & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-100"
                required
              >
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.first_name} {c.last_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Order Date *</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-100 font-mono"
                required
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Order Items & Product Selection
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-950/60">
              {orderItems.map((item, idx) => {
                const maxStock = item.product?.qty_on_hand ?? 0;
                const price = Number(item.product?.unit_price || 0);
                const lineTotal = price * item.quantity;

                return (
                  <div key={idx} className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60">
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItemRowProduct(idx, Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-700 rounded-lg bg-slate-950 text-slate-100"
                      >
                        {products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.product_name} — ₹{Number(p.unit_price).toLocaleString()} (Stock: {p.qty_on_hand ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        max={maxStock > 0 ? maxStock : undefined}
                        value={item.quantity}
                        onChange={(e) => updateItemRowQty(idx, parseInt(e.target.value, 10) || 1)}
                        className="w-16 text-xs px-2 py-1 border border-slate-700 rounded-lg font-mono text-center bg-slate-950 text-slate-100"
                      />
                      <span className="text-[11px] text-slate-400">/ {maxStock} avail</span>
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-white">
                      ₹{lineTotal.toLocaleString()}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={orderItems.length === 1}
                      className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discount & Totals Breakdown */}
          <div className="p-4 bg-slate-950/70 rounded-xl space-y-2 border border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-mono font-bold text-white">₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Apply Discount:</span>
                <select
                  value={selectedDiscountId}
                  onChange={(e) => setSelectedDiscountId(e.target.value ? Number(e.target.value) : '')}
                  className="text-xs px-2.5 py-1 border border-slate-700 rounded bg-slate-950 text-slate-100 font-mono"
                >
                  <option value="">No Discount</option>
                  {discounts.map((d) => (
                    <option key={d.discount_id} value={d.discount_id}>
                      {d.code} ({d.discount_type === 'PERCENT' ? `${d.value}%` : `₹${d.value}`})
                    </option>
                  ))}
                </select>
              </div>
              <span className="font-mono text-emerald-400 font-semibold">
                -₹{discountAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
              <span>Final Order Total:</span>
              <span className="text-base text-indigo-400 font-mono">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Committing...' : 'Commit Order Transaction'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Detail Modal */}
      <Modal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        title={`Order Summary — #${viewingOrder?.order_id}`}
        subtitle={`Placed on ${viewingOrder?.order_date?.split('T')[0]} | Customer: ${viewingOrder?.first_name} ${viewingOrder?.last_name}`}
        maxWidth="2xl"
      >
        <div className="space-y-5 text-xs">
          {/* Status & Quick Action Bar */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Lifecycle Status:</span>
              <StatusBadge status={viewingOrder?.status || 'PENDING'} />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Update Status:</span>
              <select
                value={viewingOrder?.status}
                onChange={(e) => handleStatusChange(viewingOrder?.order_id, e.target.value)}
                className="text-xs px-2.5 py-1 border border-slate-700 rounded-lg bg-slate-900 text-slate-100"
              >
                <option value="PENDING">PENDING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED (Restores Stock)</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">Order Line Items</h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Historical Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {viewingOrder?.items?.map((item: any) => (
                    <tr key={item.product_id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">{item.product_name}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{item.sku || '—'}</td>
                      <td className="py-2 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">
                        ₹{Number(item.unit_price).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-white">
                        ₹{Number(item.line_total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Delivery Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <h5 className="font-bold text-white flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Payment Records</span>
              </h5>
              {viewingOrder?.payments?.length === 0 ? (
                <p className="text-slate-500 italic">No payments recorded yet.</p>
              ) : (
                viewingOrder?.payments?.map((p: any) => (
                  <div key={p.payment_id} className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 font-mono">
                    <span className="text-slate-300">{p.method} ({p.status})</span>
                    <span className="font-bold text-white">₹{Number(p.amount).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <h5 className="font-bold text-white flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-indigo-400" />
                <span>Logistics & Delivery</span>
              </h5>
              {viewingOrder?.delivery_id ? (
                <div className="space-y-1 text-slate-300">
                  <p><span className="text-slate-500">Courier:</span> <strong className="text-white">{viewingOrder.courier}</strong></p>
                  <p><span className="text-slate-500">Tracking #:</span> <span className="font-mono text-indigo-300">{viewingOrder.tracking_no}</span></p>
                  <p><span className="text-slate-500">Shipped:</span> {viewingOrder.shipped_on?.split('T')[0] || 'Pending'}</p>
                  <p><span className="text-slate-500">Delivered:</span> {viewingOrder.delivered_on?.split('T')[0] || 'In transit'}</p>
                </div>
              ) : (
                <p className="text-slate-500 italic">No delivery shipment assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Order Record"
        message={`Are you sure you want to delete Order #${deletingOrder?.order_id}? All related order_items, payments, and delivery records will be removed.`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};


export default Orders;
