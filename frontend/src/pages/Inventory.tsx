import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit2, Plus, Minus } from 'lucide-react';
import { api } from '../services/api';
import { InventoryItem, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

const adjustSchema = z.object({
  adjustment: z.coerce.number().int(),
  reason: z.string().optional(),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

export const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('inventory_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isLoading, setIsLoading] = useState(false);

  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema) as any,
  });

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const res = await api.getInventory({
        search,
        lowStockOnly,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setInventory(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [pagination.page, search, lowStockOnly, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('ASC');
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setServerError(null);
    reset({ adjustment: 10, reason: 'Warehouse restocking' });
  };

  const handleAdjustSubmit = async (data: AdjustFormData) => {
    if (!adjustingItem) return;
    setServerError(null);
    try {
      await api.adjustStock(adjustingItem.inventory_id, {
        adjustment: data.adjustment,
        reason: data.reason,
      });
      setAdjustingItem(null);
      loadInventory();
    } catch (err: any) {
      setServerError(
        err.response?.data?.details ||
        err.response?.data?.message ||
        'Failed to adjust stock. Check constraints prevent negative stock (CHECK qty_on_hand >= 0).'
      );
    }
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: 'inventory_id',
      header: 'ID',
      sortable: true,
      width: '60px',
      render: (i) => <span className="font-mono text-indigo-400 font-semibold">{i.inventory_id}</span>,
    },
    {
      key: 'product_name',
      header: 'Product Name',
      sortable: true,
      render: (i) => (
        <div>
          <p className="font-semibold text-white">{i.product_name}</p>
          <p className="text-[11px] font-mono text-slate-400">SKU: {i.sku || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'qty_on_hand',
      header: 'Stock On Hand',
      sortable: true,
      render: (i) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-base font-bold text-white">{i.qty_on_hand}</span>
          <span className="text-xs text-slate-400">units</span>
          {i.is_low_stock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              LOW STOCK
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'reorder_level',
      header: 'Reorder Level',
      sortable: true,
      render: (i) => <span className="font-mono text-slate-300">{i.reorder_level} units</span>,
    },
    {
      key: 'last_updated',
      header: 'Last Inventory Update',
      sortable: true,
      render: (i) => (
        <span className="font-mono text-slate-400 text-[11px]">
          {i.last_updated ? new Date(i.last_updated).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Low Stock Filter Bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-700 bg-slate-950 focus:ring-indigo-500"
            />
            <span>Show Low Stock Only (Check C: qty_on_hand &le; reorder_level)</span>
          </label>
        </div>
        <div className="text-xs text-slate-400">
          Enforced by: <code className="font-mono text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">CHECK (qty_on_hand &gt;= 0)</code>
        </div>
      </div>

      <DataTable
        title="Inventory Warehouse"
        subtitle="Live 1:1 stock tracking for all products in the catalog"
        columns={columns}
        data={inventory}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        searchValue={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRefresh={loadInventory}
        isLoading={isLoading}
        actions={(i) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openAdjustModal(i)}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Adjust Stock Quantity"
            >
              <Boxes className="w-3.5 h-3.5 text-indigo-400" />
              <span>Adjust Stock</span>
            </button>
          </div>
        )}
      />

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        title={`Adjust Stock — ${adjustingItem?.product_name}`}
        subtitle={`Current Quantity: ${adjustingItem?.qty_on_hand} | Reorder Level: ${adjustingItem?.reorder_level}`}
      >
        <form onSubmit={handleSubmit(handleAdjustSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 font-medium">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Stock Adjustment (Positive to restock, Negative to deplete)
            </label>
            <input
              type="number"
              {...register('adjustment')}
              placeholder="+20 or -5"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
            />
            {errors.adjustment && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.adjustment.message}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Test 4 Demonstration: Enter a value like -{Number(adjustingItem?.qty_on_hand || 0) + 10} to observe
              MySQL's CHECK constraint trigger an error.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Note</label>
            <input
              type="text"
              {...register('reason')}
              placeholder="e.g. Supplier delivery PO-4481"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAdjustingItem(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Apply Stock Change'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


export default Inventory;
