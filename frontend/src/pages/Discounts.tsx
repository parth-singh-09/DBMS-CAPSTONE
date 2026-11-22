import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Trash2, Percent, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { Discount, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const discountSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(20).toUpperCase(),
  discount_type: z.enum(['PERCENT', 'FLAT']),
  value: z.coerce.number().positive('Value must be greater than 0 (CHECK constraint)'),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid to must be YYYY-MM-DD'),
});

type DiscountFormData = z.infer<typeof discountSchema>;

export const Discounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('discount_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isLoading, setIsLoading] = useState(false);

  // Test coupon code input
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<Discount | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema) as any,
  });

  const loadDiscounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDiscounts({
        search,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setDiscounts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, [pagination.page, search, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('ASC');
    }
  };

  const handleTestCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    try {
      const disc = await api.validateDiscountCode(testCode);
      setTestResult({ success: true, data: disc });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Invalid or expired discount code',
      });
    }
  };

  const openCreateModal = () => {
    setEditingDiscount(null);
    setServerError(null);
    reset({
      code: '',
      discount_type: 'PERCENT',
      value: 10,
      valid_to: '2026-12-31',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setServerError(null);
    reset({
      code: d.code,
      discount_type: d.discount_type,
      value: Number(d.value),
      valid_to: d.valid_to?.split('T')[0],
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: DiscountFormData) => {
    setServerError(null);
    try {
      if (editingDiscount) {
        await api.updateDiscount(editingDiscount.discount_id, data);
      } else {
        await api.createDiscount(data);
      }
      setIsFormOpen(false);
      loadDiscounts();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDiscount) return;
    try {
      await api.deleteDiscount(deletingDiscount.discount_id);
      setDeletingDiscount(null);
      loadDiscounts();
    } catch (err: any) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const columns: Column<Discount>[] = [
    {
      key: 'discount_id',
      header: 'ID',
      sortable: true,
      width: '60px',
      render: (d) => <span className="font-mono text-indigo-400 font-semibold">{d.discount_id}</span>,
    },
    {
      key: 'code',
      header: 'Coupon Code',
      sortable: true,
      render: (d) => (
        <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
          {d.code}
        </span>
      ),
    },
    {
      key: 'discount_type',
      header: 'Type',
      sortable: true,
      render: (d) => (
        <span className="text-xs font-semibold text-slate-300">{d.discount_type}</span>
      ),
    },
    {
      key: 'value',
      header: 'Discount Value',
      sortable: true,
      render: (d) => (
        <span className="font-mono font-bold text-white">
          {d.discount_type === 'PERCENT' ? `${d.value}%` : `₹${d.value}`}
        </span>
      ),
    },
    {
      key: 'valid_to',
      header: 'Valid Until',
      sortable: true,
      render: (d) => (
        <span className="font-mono text-xs text-slate-300">
          {d.valid_to ? d.valid_to.split('T')[0] : '—'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (d) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            d.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {d.is_active ? 'Active' : 'Expired'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Coupon Tester Card */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Percent className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Coupon Validation</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Test checking coupon status (e.g. SAVE10 or WELCOME5)</p>
        </div>

        <form onSubmit={handleTestCoupon} className="flex items-center space-x-2">
          <input
            type="text"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE (e.g. SAVE10)"
            className="text-xs font-mono uppercase px-3 py-1.5 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-100 w-44"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
          >
            Check
          </button>
        </form>

        {testResult && (
          <div className="text-xs flex items-center space-x-2">
            {testResult.success ? (
              <span className="flex items-center text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Valid: {testResult.data.value}% off until {testResult.data.valid_to?.split('T')[0]}
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-medium">
                <XCircle className="w-4 h-4 mr-1" />
                {testResult.message}
              </span>
            )}
          </div>
        )}
      </div>

      <DataTable
        title="Promotional Discounts"
        subtitle="Manage coupon codes and promotional percentages"
        columns={columns}
        data={discounts}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        searchValue={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onAdd={openCreateModal}
        addLabel="Add Discount"
        onRefresh={loadDiscounts}
        isLoading={isLoading}
        actions={(d) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openEditModal(d)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Edit Discount"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingDiscount(d)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete Discount"
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
        title={editingDiscount ? 'Edit Discount Code' : 'Create New Discount'}
        subtitle="Discount code must be unique and value must be positive (CHECK value > 0)."
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 font-medium">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code (Unique) *</label>
            <input
              type="text"
              {...register('code')}
              placeholder="e.g. FESTIVE20"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono uppercase"
            />
            {errors.code && <p className="text-[11px] text-rose-400 mt-1">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Type *</label>
              <select
                {...register('discount_type')}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="PERCENT">PERCENT (%)</option>
                <option value="FLAT">FLAT (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Value * <span className="font-normal text-slate-400">— &gt; 0</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('value')}
                placeholder="e.g. 15.00"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
              />
              {errors.value && <p className="text-[11px] text-rose-400 mt-1">{errors.value.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Valid Until (Date) *</label>
            <input
              type="date"
              {...register('valid_to')}
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
            />
            {errors.valid_to && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.valid_to.message}</p>
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
              {isSubmitting ? 'Saving...' : editingDiscount ? 'Update Code' : 'Create Code'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingDiscount}
        onClose={() => setDeletingDiscount(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Discount Code"
        message={`Are you sure you want to delete discount "${deletingDiscount?.code}"? If past orders have used this code, foreign key constraints will restrict deletion.`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};


export default Discounts;
