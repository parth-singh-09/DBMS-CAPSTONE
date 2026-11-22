import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Trash2, CreditCard, IndianRupee, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Payment, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const paymentSchema = z.object({
  order_id: z.coerce.number().int().positive('Order ID is required'),
  method: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD']),
  amount: z.coerce.number().positive('Payment amount must be greater than 0 (CHECK constraint)'),
  status: z.enum(['SUCCESS', 'FAILED', 'REFUNDED']),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('payment_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isLoading, setIsLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as any,
  });

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPayments({
        search,
        method: methodFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setPayments(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [pagination.page, search, methodFilter, statusFilter, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('ASC');
    }
  };

  const openCreateModal = () => {
    setEditingPayment(null);
    setServerError(null);
    reset({
      order_id: 1,
      method: 'UPI',
      amount: 1200,
      status: 'SUCCESS',
      paid_on: new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  };

  const openEditModal = (p: Payment) => {
    setEditingPayment(p);
    setServerError(null);
    reset({
      order_id: p.order_id,
      method: p.method,
      amount: Number(p.amount),
      status: p.status,
      paid_on: p.paid_on ? p.paid_on.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: PaymentFormData) => {
    setServerError(null);
    try {
      if (editingPayment) {
        await api.updatePayment(editingPayment.payment_id, data);
      } else {
        await api.createPayment(data);
      }
      setIsFormOpen(false);
      loadPayments();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPayment) return;
    try {
      await api.deletePayment(deletingPayment.payment_id);
      setDeletingPayment(null);
      loadPayments();
    } catch (err: any) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: 'payment_id',
      header: 'Pay #',
      sortable: true,
      width: '70px',
      render: (p) => <span className="font-mono text-indigo-400 font-bold">#{p.payment_id}</span>,
    },
    {
      key: 'order_id',
      header: 'Order #',
      sortable: true,
      render: (p) => <span className="font-mono font-bold text-indigo-400">Order #{p.order_id}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (p) => <span className="font-semibold text-white">{p.customer_name}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-semibold text-xs px-2.5 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-700">
          {p.method}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-white">
          ₹{Number(p.amount).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Payment Status',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} type="payment" />,
    },
    {
      key: 'paid_on',
      header: 'Transaction Date',
      sortable: true,
      render: (p) => (
        <span className="font-mono text-xs text-slate-300">
          {p.paid_on ? p.paid_on.split('T')[0] : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Method & Status Filters */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 font-medium">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-700 rounded-lg bg-slate-950 text-slate-100"
            >
              <option value="">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
              <option value="NETBANKING">NETBANKING</option>
              <option value="COD">COD</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-700 rounded-lg bg-slate-950 text-slate-100"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">Total Transactions: {pagination.total}</div>
      </div>

      <DataTable
        title="Payment Transactions (1:N with Orders)"
        subtitle="Record multiple payment attempts per order (UPI, Card, NetBanking, COD)"
        columns={columns}
        data={payments}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        searchValue={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onAdd={openCreateModal}
        addLabel="Record Payment"
        onRefresh={loadPayments}
        isLoading={isLoading}
        actions={(p) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openEditModal(p)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Edit Payment"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingPayment(p)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete Payment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPayment ? 'Edit Payment Record' : 'Record New Payment'}
        subtitle="Enforces CHECK constraints for payment methods and payment status."
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 font-medium">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Order ID *</label>
              <input
                type="number"
                {...register('order_id')}
                placeholder="e.g. 3"
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 font-mono"
              />
              {errors.order_id && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.order_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method *</label>
              <select
                {...register('method')}
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100"
              >
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="NETBANKING">NETBANKING</option>
                <option value="COD">COD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount (₹) * <span className="font-normal text-slate-400">— &gt; 0</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="1200.00"
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 font-mono"
              />
              {errors.amount && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Status *</label>
              <select
                {...register('status')}
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100"
              >
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Date *</label>
            <input
              type="date"
              {...register('paid_on')}
              className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 font-mono"
            />
            {errors.paid_on && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.paid_on.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingPayment ? 'Update Payment' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Record"
        message={`Are you sure you want to delete Payment #${deletingPayment?.payment_id} for Order #${deletingPayment?.order_id}? (Report Section 5.2 demonstrates deleting FAILED payments).`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};


export default Payments;
