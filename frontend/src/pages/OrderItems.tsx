import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Trash2, ListOrdered, ShoppingBag, Tag } from 'lucide-react';
import { api } from '../services/api';
import { OrderItem, Product, Order, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const itemSchema = z.object({
  order_id: z.coerce.number().int().positive('Order ID is required'),
  product_id: z.coerce.number().int().positive('Product is required'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0 (CHECK constraint)'),
  unit_price: z.coerce.number().positive().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

export const OrderItems: React.FC = () => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [orderFilter, setOrderFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<OrderItem | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as any,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resItems, resProds] = await Promise.all([
        api.getOrderItems({
          order_id: orderFilter ? parseInt(orderFilter, 10) : undefined,
          product_id: productFilter ? parseInt(productFilter, 10) : undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
        api.getProducts({ limit: 100 }),
      ]);
      setItems(resItems.data);
      setPagination(resItems.pagination);
      setProducts(resProds.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagination.page, orderFilter, productFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setServerError(null);
    reset({
      order_id: 1,
      product_id: products[0]?.product_id || 1,
      quantity: 1,
      unit_price: Number(products[0]?.unit_price || 100),
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: OrderItem) => {
    setEditingItem(item);
    setServerError(null);
    reset({
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ItemFormData) => {
    setServerError(null);
    try {
      if (editingItem) {
        await api.updateOrderItemQty(editingItem.order_id, editingItem.product_id, data.quantity);
      } else {
        await api.createOrderItem(data);
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.deleteOrderItem(deletingItem.order_id, deletingItem.product_id);
      setDeletingItem(null);
      loadData();
    } catch (err: any) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const columns: Column<OrderItem>[] = [
    {
      key: 'order_id',
      header: 'Order #',
      sortable: true,
      width: '80px',
      render: (i) => <span className="font-mono text-indigo-400 font-bold">#{i.order_id}</span>,
    },
    {
      key: 'product_name',
      header: 'Product Ordered',
      render: (i) => (
        <div>
          <p className="font-semibold text-white">{i.product_name}</p>
          <p className="text-[11px] font-mono text-slate-400">Prod ID: #{i.product_id}</p>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (i) => <span className="text-slate-300">{(i as any).customer_name}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (i) => (
        <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
          {i.quantity}
        </span>
      ),
    },
    {
      key: 'unit_price',
      header: 'Historical Unit Price',
      render: (i) => (
        <span className="font-mono text-slate-300 font-medium">
          ₹{Number(i.unit_price).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'line_total',
      header: 'Line Total',
      render: (i) => (
        <span className="font-mono font-bold text-white">
          ₹{(Number(i.unit_price) * i.quantity).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 font-medium">Filter Order ID:</span>
            <input
              type="number"
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              placeholder="e.g. 1"
              className="w-24 text-xs px-2.5 py-1 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 font-medium">Filter Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-700 rounded-lg bg-slate-950 text-slate-100"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">Total Line Items: {pagination.total}</div>
      </div>

      <DataTable
        title="Order Items (Composite Key: order_id, product_id)"
        subtitle="M:N junction records preserving historical purchase prices at checkout time"
        columns={columns}
        data={items}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        onAdd={openCreateModal}
        addLabel="Add Line Item"
        onRefresh={loadData}
        isLoading={isLoading}
        actions={(i) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openEditModal(i)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Edit Quantity"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(i)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Remove Item"
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
        title={editingItem ? 'Update Line Item Quantity' : 'Add Line Item to Order'}
        subtitle="Enforces CHECK (quantity > 0) and composite primary key (order_id, product_id)."
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
                disabled={!!editingItem}
                {...register('order_id')}
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 disabled:bg-slate-900 disabled:text-slate-500 font-mono"
              />
              {errors.order_id && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.order_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product *</label>
              <select
                disabled={!!editingItem}
                {...register('product_id')}
                className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 disabled:bg-slate-900 disabled:text-slate-500"
              >
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name}
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.product_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quantity * <span className="font-normal text-slate-400">— Must be &gt; 0 (Test 3)</span>
            </label>
            <input
              type="number"
              {...register('quantity')}
              className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 font-mono"
            />
            {errors.quantity && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.quantity.message}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Test 3 Demonstration: Try entering 0 to verify the database constraint rejection.
            </p>
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
              {isSubmitting ? 'Saving...' : editingItem ? 'Update Quantity' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Line Item"
        message={`Are you sure you want to remove ${deletingItem?.product_name} from Order #${deletingItem?.order_id}? Associated stock will be restored.`}
        confirmLabel="Confirm Remove"
      />
    </div>
  );
};


export default OrderItems;
