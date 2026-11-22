import React, { useEffect, useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  ExternalLink,
  Package,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Eye,
  Hash,
} from 'lucide-react';
import { api } from '../services/api';
import { Delivery, Order } from '../types';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const deliverySchema = z.object({
  order_id: z.number().int().positive('Please select a valid order'),
  courier: z.string().min(2, 'Courier name must be at least 2 characters'),
  tracking_no: z.string().min(3, 'Tracking number must be at least 3 characters'),
  shipped_on: z.string().optional().nullable(),
  delivered_on: z.string().optional().nullable(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
  });

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDeliveries({ limit: 100 });
      setDeliveries(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.getOrders({ limit: 100 });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  };

  useEffect(() => {
    loadDeliveries();
    loadOrders();
  }, []);

  // Compute available orders (orders without deliveries)
  const availableOrders = useMemo(() => {
    const existingOrderIds = new Set(deliveries.map((d) => d.order_id));
    return orders.filter((o) => !existingOrderIds.has(o.order_id));
  }, [orders, deliveries]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.tracking_no?.toLowerCase().includes(q) ||
        item.courier.toLowerCase().includes(q) ||
        item.customer_name?.toLowerCase().includes(q) ||
        String(item.order_id).includes(q);

      const matchesCourier = !courierFilter || item.courier === courierFilter;
      const matchesStatus = !statusFilter || item.shipping_status === statusFilter;

      return matchesSearch && matchesCourier && matchesStatus;
    });
  }, [deliveries, search, courierFilter, statusFilter]);

  const uniqueCouriers = useMemo(() => {
    const s = new Set<string>();
    deliveries.forEach((d) => {
      if (d.courier) s.add(d.courier);
    });
    return Array.from(s);
  }, [deliveries]);

  const openAddModal = () => {
    reset({
      order_id: availableOrders[0]?.order_id || 0,
      courier: 'BlueDart',
      tracking_no: `TRK-${Date.now().toString().slice(-6)}`,
      shipped_on: '',
      delivered_on: '',
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (d: Delivery) => {
    setSelectedDelivery(d);
    setValue('order_id', d.order_id);
    setValue('courier', d.courier);
    setValue('tracking_no', d.tracking_no || '');
    setValue('shipped_on', d.shipped_on ? d.shipped_on.split('T')[0] : '');
    setValue('delivered_on', d.delivered_on ? d.delivered_on.split('T')[0] : '');
    setFormError(null);
    setIsEditOpen(true);
  };

  const openViewModal = (d: Delivery) => {
    setSelectedDelivery(d);
    setIsViewOpen(true);
  };

  const openDeleteModal = (d: Delivery) => {
    setSelectedDelivery(d);
    setIsDeleteOpen(true);
  };

  const onSubmitAdd = async (data: DeliveryFormData) => {
    try {
      setSubmitting(true);
      setFormError(null);
      await api.createDelivery({
        order_id: Number(data.order_id),
        courier: data.courier,
        tracking_no: data.tracking_no,
        shipped_on: data.shipped_on || null,
        delivered_on: data.delivered_on || null,
      });
      setIsAddOpen(false);
      await loadDeliveries();
      await loadOrders();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err.message || 'Failed to create delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: DeliveryFormData) => {
    if (!selectedDelivery) return;
    try {
      setSubmitting(true);
      setFormError(null);
      await api.updateDelivery(selectedDelivery.delivery_id, {
        courier: data.courier,
        tracking_no: data.tracking_no,
        shipped_on: data.shipped_on || null,
        delivered_on: data.delivered_on || null,
      });
      setIsEditOpen(false);
      await loadDeliveries();
      await loadOrders();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err.message || 'Failed to update delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedDelivery) return;
    try {
      setSubmitting(true);
      await api.deleteDelivery(selectedDelivery.delivery_id);
      setIsDeleteOpen(false);
      setSelectedDelivery(null);
      await loadDeliveries();
      await loadOrders();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Failed to delete delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Delivery>[] = [
    {
      header: 'Delivery ID',
      accessor: 'delivery_id',
      sortable: true,
      className: 'w-24',
      render: (d) => <span className="font-mono text-xs font-semibold text-slate-400">#{d.delivery_id}</span>,
    },
    {
      header: 'Order & Customer',
      accessor: 'order_id',
      sortable: true,
      render: (d) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-400">Order #{d.order_id}</span>
            <StatusBadge status={d.order_status || 'PENDING'} />
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{d.customer_name || 'Customer'}</div>
        </div>
      ),
    },
    {
      header: 'Courier',
      accessor: 'courier',
      sortable: true,
      render: (d) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
          <Truck className="w-3.5 h-3.5 text-indigo-400" />
          {d.courier}
        </span>
      ),
    },
    {
      header: 'Tracking No',
      accessor: 'tracking_no',
      render: (d) => (
        <span className="font-mono text-xs bg-slate-900 px-2 py-1 rounded border border-slate-700/60 text-slate-300">
          {d.tracking_no || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Timeline',
      accessor: 'shipped_on',
      render: (d) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Shipped: {d.shipped_on ? new Date(d.shipped_on).toLocaleDateString() : 'Not yet'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Delivered: {d.delivered_on ? new Date(d.delivered_on).toLocaleDateString() : 'Pending'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'shipping_status',
      sortable: true,
      render: (d) => <StatusBadge status={d.shipping_status || 'PREPARING'} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openViewModal(d)}
            title="View Details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(d)}
            title="Edit Delivery"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700/60 transition"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDeleteModal(d)}
            title="Delete Delivery"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-indigo-400" />
            Deliveries Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track shipments, logistics partners, and synchronize fulfillment with order records (1:1 with Orders)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Delivery
        </button>
      </div>

      {/* Stats Quick Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Deliveries</div>
          <div className="text-2xl font-bold text-white mt-1">{deliveries.length}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-medium text-amber-400">In Transit (Shipped)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {deliveries.filter((d) => d.shipping_status === 'SHIPPED').length}
          </div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-medium text-emerald-400">Delivered</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {deliveries.filter((d) => d.shipping_status === 'DELIVERED').length}
          </div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Orders Awaiting Dispatch</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{availableOrders.length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking #, courier, or customer name..."
            className="w-full bg-slate-900 border border-slate-700/70 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Courier filter */}
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Couriers</option>
            {uniqueCouriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PREPARING">Preparing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Deliveries DataTable */}
      <DataTable
        columns={columns}
        data={filteredDeliveries}
        loading={loading}
        emptyMessage="No delivery records found matching your filters."
      />

      {/* Add Delivery Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Delivery" size="md">
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
            <strong>Database Constraint (1:1):</strong> <code>deliveries.order_id</code> is defined as a UNIQUE foreign key.
            Each order can have at most one delivery record.
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Order *</label>
            {availableOrders.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                All existing orders already have deliveries assigned! Place a new order first.
              </div>
            ) : (
              <select
                {...register('order_id', { valueAsNumber: true })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {availableOrders.map((o) => (
                  <option key={o.order_id} value={o.order_id}>
                    Order #{o.order_id} — {o.customer_name} (₹{o.total_amount}) [{o.status}]
                  </option>
                ))}
              </select>
            )}
            {errors.order_id && <p className="text-xs text-rose-400 mt-1">{errors.order_id.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Courier Partner *</label>
            <input
              type="text"
              list="couriers-list"
              {...register('courier')}
              placeholder="e.g. BlueDart, Delhivery, DTDC"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <datalist id="couriers-list">
              <option value="BlueDart" />
              <option value="Delhivery" />
              <option value="DTDC" />
              <option value="FedEx" />
              <option value="India Post" />
            </datalist>
            {errors.courier && <p className="text-xs text-rose-400 mt-1">{errors.courier.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tracking Number *</label>
            <input
              type="text"
              {...register('tracking_no')}
              placeholder="e.g. BD-88291"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            {errors.tracking_no && <p className="text-xs text-rose-400 mt-1">{errors.tracking_no.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shipped On</label>
              <input
                type="date"
                {...register('shipped_on')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Delivered On</label>
              <input
                type="date"
                {...register('delivered_on')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || availableOrders.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {submitting ? 'Creating...' : 'Create Delivery'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Delivery Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Delivery #${selectedDelivery?.delivery_id}`} size="md">
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-400">
            <span>Order Reference:</span>
            <span className="font-semibold text-indigo-400">Order #{selectedDelivery?.order_id}</span>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Courier Partner *</label>
            <input
              type="text"
              {...register('courier')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            {errors.courier && <p className="text-xs text-rose-400 mt-1">{errors.courier.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tracking Number *</label>
            <input
              type="text"
              {...register('tracking_no')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            {errors.tracking_no && <p className="text-xs text-rose-400 mt-1">{errors.tracking_no.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shipped On</label>
              <input
                type="date"
                {...register('shipped_on')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Delivered On</label>
              <input
                type="date"
                {...register('delivered_on')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Delivery Details Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title={`Delivery Details #${selectedDelivery?.delivery_id}`} size="md">
        {selectedDelivery && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">Shipping Status</span>
                <StatusBadge status={selectedDelivery.shipping_status || 'PREPARING'} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Associated Order</span>
                <span className="font-semibold text-indigo-400">Order #{selectedDelivery.order_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Customer Name</span>
                <span className="font-medium text-slate-200">{selectedDelivery.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Delivery Address</span>
                <span className="text-slate-300 text-xs text-right max-w-xs">{selectedDelivery.customer_address || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Courier Partner</span>
                <span className="text-slate-200 font-medium">{selectedDelivery.courier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Tracking Number</span>
                <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                  {selectedDelivery.tracking_no || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Shipped Date</span>
                <span className="text-slate-200 text-xs">
                  {selectedDelivery.shipped_on ? new Date(selectedDelivery.shipped_on).toLocaleDateString() : 'Not dispatched yet'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Delivered Date</span>
                <span className="text-slate-200 text-xs">
                  {selectedDelivery.delivered_on ? new Date(selectedDelivery.delivered_on).toLocaleDateString() : 'In transit'}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Delivery Record?"
        message={`Are you sure you want to delete delivery #${selectedDelivery?.delivery_id} for Order #${selectedDelivery?.order_id}? This will remove tracking information.`}
        confirmText="Delete Delivery"
        type="danger"
        isLoading={submitting}
      />
    </div>
  );
}
