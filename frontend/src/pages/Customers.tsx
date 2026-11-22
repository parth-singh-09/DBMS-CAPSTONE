import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Trash2, Eye, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { Customer, Pagination } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { StatusBadge } from '../components/StatusBadge';

const customerSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(50),
  last_name: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Valid email is required').max(100),
  phone: z.string().trim().max(15).optional().nullable(),
  address: z.string().trim().max(150).optional().nullable(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('customer_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCustomers({
        search,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res && Array.isArray(res.data)) {
        setCustomers(res.data);
      }
      if (res && res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setServerError(err.message || 'Unable to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
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
    setEditingCustomer(null);
    setServerError(null);
    reset({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setServerError(null);
    reset({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone || '',
      address: c.address || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: CustomerFormData) => {
    setServerError(null);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.customer_id, data);
      } else {
        await api.createCustomer(data);
      }
      setIsFormOpen(false);
      loadCustomers();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    try {
      await api.deleteCustomer(deletingCustomer.customer_id);
      setDeletingCustomer(null);
      loadCustomers();
    } catch (err: any) {
      alert(`Delete Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const openViewModal = async (c: Customer) => {
    try {
      const full = await api.getCustomerById(c.customer_id);
      setViewingCustomer(full);
    } catch (err: any) {
      console.error(err);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'customer_id',
      header: 'ID',
      sortable: true,
      width: '60px',
      render: (c) => <span className="font-mono text-indigo-400 font-semibold">{c.customer_id}</span>,
    },
    {
      key: 'first_name',
      header: 'Customer Name',
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-white">{c.first_name} {c.last_name}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email Address',
      sortable: true,
      render: (c) => (
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>{c.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => (
        <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{c.phone || '—'}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (c) => (
        <div className="flex items-center space-x-1.5 text-slate-300 truncate max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{c.address || '—'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        title="Customers Management"
        subtitle="Manage customer profiles, contact info, and delivery addresses"
        columns={columns}
        data={customers}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        searchValue={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onAdd={openCreateModal}
        addLabel="Add Customer"
        onRefresh={loadCustomers}
        isLoading={isLoading}
        actions={(c) => (
          <div className="flex items-center justify-end space-x-1">
            <button
              onClick={() => openViewModal(c)}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
              title="View Profile & Orders"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEditModal(c)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Edit Profile"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingCustomer(c)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Delete Customer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
        subtitle={
          editingCustomer
            ? `Updating records for customer #${editingCustomer.customer_id}`
            : 'Enter personal details. Email address must be unique.'
        }
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 font-medium">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                {...register('first_name')}
                placeholder="e.g. Aarav"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
              {errors.first_name && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                {...register('last_name')}
                placeholder="e.g. Sharma"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
              {errors.last_name && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g. aarav@mail.com"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
            {errors.email && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              {...register('phone')}
              placeholder="e.g. 9810000001"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
            {errors.phone && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="e.g. Rohini, Delhi"
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
            {errors.address && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.address.message}</p>
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
              {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Customer Details & Order History Modal */}
      <Modal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        title={`Customer Details — ${viewingCustomer?.first_name} ${viewingCustomer?.last_name}`}
        subtitle={`Customer ID: #${viewingCustomer?.customer_id} | ${viewingCustomer?.email}`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <p className="text-slate-400">Contact Number</p>
              <p className="font-semibold text-white mt-0.5">{viewingCustomer?.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-slate-400">Shipping Address</p>
              <p className="font-semibold text-white mt-0.5">{viewingCustomer?.address || 'Not provided'}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span>Order History ({viewingCustomer?.orders?.length || 0})</span>
            </h4>

            {viewingCustomer?.orders?.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                This customer has not placed any orders yet (Query 2 demonstration case).
              </p>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Order Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {viewingCustomer?.orders?.map((ord: any) => (
                      <tr key={ord.order_id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono font-semibold text-indigo-400">#{ord.order_id}</td>
                        <td className="py-2 px-3 text-slate-300">{ord.order_date?.split('T')[0]}</td>
                        <td className="py-2 px-3">
                          <StatusBadge status={ord.status} />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">
                          ₹{Number(ord.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete ${deletingCustomer?.first_name} ${deletingCustomer?.last_name} (${deletingCustomer?.email})? If they have existing orders, MySQL foreign key constraints will prevent deletion (Test 6 scenario).`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};


export default Customers;
