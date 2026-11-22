import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Trash2, Package, Tag, Boxes, IndianRupee } from 'lucide-react';
import { api } from '../services/api';
import { Product, Category, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { StatusBadge } from '../components/StatusBadge';

const productSchema = z.object({
  product_name: z.string().trim().min(1, 'Product name is required').max(100),
  sku: z.string().trim().max(20).optional().nullable(),
  unit_price: z.coerce.number().positive('Unit price must be greater than 0 (CHECK constraint)'),
  category_id: z.coerce.number().int().positive('Please select a valid category'),
  initial_stock: z.coerce.number().int().min(0, 'Initial stock cannot be negative').optional(),
  reorder_level: z.coerce.number().int().min(0).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('product_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isLoading, setIsLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
  });

  const loadCategories = async () => {
    try {
      const res = await api.getCategories({ limit: 100 });
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts({
        search,
        category_id: selectedCategory,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [pagination.page, search, selectedCategory, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('ASC');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setServerError(null);
    reset({
      product_name: '',
      sku: '',
      unit_price: 100,
      category_id: categories[0]?.category_id || 1,
      initial_stock: 50,
      reorder_level: 10,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setServerError(null);
    reset({
      product_name: p.product_name,
      sku: p.sku || '',
      unit_price: Number(p.unit_price),
      category_id: p.category_id,
      initial_stock: p.qty_on_hand ?? 0,
      reorder_level: p.reorder_level ?? 10,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    setServerError(null);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.product_id, {
          product_name: data.product_name,
          sku: data.sku,
          unit_price: data.unit_price,
          category_id: data.category_id,
        });
      } else {
        await api.createProduct(data);
      }
      setIsFormOpen(false);
      loadProducts();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      await api.deleteProduct(deletingProduct.product_id);
      setDeletingProduct(null);
      loadProducts();
    } catch (err: any) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'product_id',
      header: 'ID',
      sortable: true,
      width: '60px',
      render: (p) => <span className="font-mono text-indigo-400 font-semibold">{p.product_id}</span>,
    },
    {
      key: 'product_name',
      header: 'Product Name',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-white">{p.product_name}</p>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU Code',
      sortable: true,
      render: (p) => (
        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-700">
          {p.sku || '—'}
        </span>
      ),
    },
    {
      key: 'category_name',
      header: 'Category',
      sortable: true,
      render: (p) => (
        <span className="inline-flex items-center text-slate-300">
          <Tag className="w-3 h-3 text-indigo-400 mr-1.5" />
          {p.category_name}
        </span>
      ),
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-white">
          ₹{Number(p.unit_price).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'qty_on_hand',
      header: 'Stock Status',
      sortable: true,
      render: (p) => {
        const qty = p.qty_on_hand ?? 0;
        const reorder = p.reorder_level ?? 10;
        const isLow = qty <= reorder;
        return (
          <div className="flex items-center space-x-2">
            <span className="font-mono font-semibold text-slate-200">{qty} units</span>
            {isLow ? (
              <StatusBadge status="LOW STOCK" type="stock" />
            ) : (
              <span className="text-[11px] text-emerald-400 font-medium">In Stock</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Category Filter Bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300">Filter Category:</span>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs py-1.5 px-3 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-100"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total Products: {pagination.total}
        </div>
      </div>

      <DataTable
        title="Products Catalog"
        subtitle="Manage inventory items, pricing, SKU codes, and category associations"
        columns={columns}
        data={products}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        searchValue={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onAdd={openCreateModal}
        addLabel="Add Product"
        onRefresh={loadProducts}
        isLoading={isLoading}
        actions={(p) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openEditModal(p)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Edit Product"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingProduct(p)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Prices must satisfy CHECK (unit_price > 0). When creating, a 1:1 inventory record is automatically instantiated."
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 font-medium">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              {...register('product_name')}
              placeholder="e.g. Mechanical Keyboard"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
            {errors.product_name && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.product_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU Code (Unique)</label>
              <input
                type="text"
                {...register('sku')}
                placeholder="e.g. EL-005"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono"
              />
              {errors.sku && <p className="text-[11px] text-rose-400 mt-1">{errors.sku.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                {...register('category_id')}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Unit Price (₹) * <span className="font-normal text-slate-400">— Must be &gt; 0</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('unit_price')}
              placeholder="e.g. 1200.00"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
            {errors.unit_price && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.unit_price.message}</p>
            )}
          </div>

          {!editingProduct && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stock (Qty)</label>
                <input
                  type="number"
                  {...register('initial_stock')}
                  defaultValue={50}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reorder Level</label>
                <input
                  type="number"
                  {...register('reorder_level')}
                  defaultValue={10}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete product "${deletingProduct?.product_name}"? If order items exist referencing this product, MySQL foreign keys will restrict deletion.`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};


export default Products;
