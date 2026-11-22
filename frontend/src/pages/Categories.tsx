import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Trash2, Eye, Tag, Package } from 'lucide-react';
import { api } from '../services/api';
import { Category, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const categorySchema = z.object({
  category_name: z.string().trim().min(1, 'Category name is required').max(50),
  description: z.string().trim().max(100).optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('category_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isLoading, setIsLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<any | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCategories({
        search,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setCategories(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [pagination.page, search, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('ASC');
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setServerError(null);
    reset({ category_name: '', description: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setServerError(null);
    reset({ category_name: c.category_name, description: c.description || '' });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    setServerError(null);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.category_id, data);
      } else {
        await api.createCategory(data);
      }
      setIsFormOpen(false);
      loadCategories();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await api.deleteCategory(deletingCategory.category_id);
      setDeletingCategory(null);
      loadCategories();
    } catch (err: any) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const openViewModal = async (c: Category) => {
    try {
      const full = await api.getCategoryById(c.category_id);
      setViewingCategory(full);
    } catch (err: any) {
      console.error(err);
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'category_id',
      header: 'ID',
      sortable: true,
      width: '60px',
      render: (c) => <span className="font-mono text-indigo-400 font-semibold">{c.category_id}</span>,
    },
    {
      key: 'category_name',
      header: 'Category Name',
      sortable: true,
      render: (c) => (
        <div className="flex items-center space-x-2">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-white">{c.category_name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (c) => <span className="text-slate-300 truncate max-w-sm">{c.description || '—'}</span>,
    },
    {
      key: 'products_count',
      header: 'Assigned Products',
      sortable: true,
      render: (c) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Package className="w-3 h-3 mr-1" />
          {c.products_count ?? 0} Products
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        title="Product Categories"
        subtitle="Manage product categories and taxonomic classification"
        columns={columns}
        data={categories}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        searchValue={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onAdd={openCreateModal}
        addLabel="Add Category"
        onRefresh={loadCategories}
        isLoading={isLoading}
        actions={(c) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openViewModal(c)}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
              title="View Category & Products"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEditModal(c)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Edit Category"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingCategory(c)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete Category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        subtitle="Categories group products for partition analytics and catalog browsing."
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 font-medium">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
            <input
              type="text"
              {...register('category_name')}
              placeholder="e.g. Peripherals"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
            {errors.category_name && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.category_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="e.g. Input devices, keypads, and accessories"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.description.message}</p>
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
              {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Category Detail Modal */}
      <Modal
        isOpen={!!viewingCategory}
        onClose={() => setViewingCategory(null)}
        title={`Category — ${viewingCategory?.category_name}`}
        subtitle={`Category ID: #${viewingCategory?.category_id} | ${viewingCategory?.description || 'No description'}`}
      >
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Classified Products ({viewingCategory?.products?.length || 0})
          </h4>

          {viewingCategory?.products?.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">No products in this category.</p>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {viewingCategory?.products?.map((p: any) => (
                    <tr key={p.product_id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">{p.product_name}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{p.sku || '—'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-white">
                        ₹{Number(p.unit_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deletingCategory?.category_name}"? If products belong to this category, MySQL foreign key constraints will prevent deletion.`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};


export default Categories;
