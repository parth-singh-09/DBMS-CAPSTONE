import axios from 'axios';
import {
  Customer,
  Category,
  Product,
  InventoryItem,
  Discount,
  Order,
  OrderItem,
  Payment,
  Delivery,
  DashboardKPI,
  PredefinedQuery,
  QueryResult,
  TestResult,
  ConsistencyCheck,
  TableMetadata,
  RelationshipMetadata,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Guard against Vercel SPA html fallback when backend is unreachable
client.interceptors.response.use(
  (response) => {
    const contentType = String(response.headers['content-type'] || '');
    if (
      typeof response.data === 'string' &&
      (contentType.includes('text/html') ||
        response.data.trim().startsWith('<!doctype html') ||
        response.data.trim().startsWith('<html'))
    ) {
      throw new Error(
        'Backend connection error: Expected JSON response but received HTML. Please configure VITE_API_URL in your Vercel project settings to point to your live backend.'
      );
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // System
  getSystemStatus: () => client.get('/system/status').then((r) => r.data.data),
  resetToSeeds: () => client.post('/system/reset-seeds').then((r) => r.data),

  // Customers
  getCustomers: (params?: any) => client.get('/customers', { params }).then((r) => r.data),
  getCustomerById: (id: number) => client.get(`/customers/${id}`).then((r) => r.data.data),
  createCustomer: (data: Partial<Customer>) => client.post('/customers', data).then((r) => r.data),
  updateCustomer: (id: number, data: Partial<Customer>) => client.put(`/customers/${id}`, data).then((r) => r.data),
  deleteCustomer: (id: number) => client.delete(`/customers/${id}`).then((r) => r.data),

  // Categories
  getCategories: (params?: any) => client.get('/categories', { params }).then((r) => r.data),
  getCategoryById: (id: number) => client.get(`/categories/${id}`).then((r) => r.data.data),
  createCategory: (data: Partial<Category>) => client.post('/categories', data).then((r) => r.data),
  updateCategory: (id: number, data: Partial<Category>) => client.put(`/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id: number) => client.delete(`/categories/${id}`).then((r) => r.data),

  // Products
  getProducts: (params?: any) => client.get('/products', { params }).then((r) => r.data),
  getProductById: (id: number) => client.get(`/products/${id}`).then((r) => r.data.data),
  createProduct: (data: any) => client.post('/products', data).then((r) => r.data),
  updateProduct: (id: number, data: Partial<Product>) => client.put(`/products/${id}`, data).then((r) => r.data),
  deleteProduct: (id: number) => client.delete(`/products/${id}`).then((r) => r.data),

  // Inventory
  getInventory: (params?: any) => client.get('/inventory', { params }).then((r) => r.data),
  getInventoryById: (id: number) => client.get(`/inventory/${id}`).then((r) => r.data.data),
  updateInventory: (id: number, data: { qty_on_hand?: number; reorder_level?: number }) =>
    client.put(`/inventory/${id}`, data).then((r) => r.data),
  adjustStock: (id: number, data: { adjustment: number; reason?: string }) =>
    client.post(`/inventory/${id}/adjust`, data).then((r) => r.data),

  // Discounts
  getDiscounts: (params?: any) => client.get('/discounts', { params }).then((r) => r.data),
  getDiscountById: (id: number) => client.get(`/discounts/${id}`).then((r) => r.data.data),
  validateDiscountCode: (code: string) => client.get(`/discounts/validate/${code}`).then((r) => r.data.data),
  createDiscount: (data: Partial<Discount>) => client.post('/discounts', data).then((r) => r.data),
  updateDiscount: (id: number, data: Partial<Discount>) => client.put(`/discounts/${id}`, data).then((r) => r.data),
  deleteDiscount: (id: number) => client.delete(`/discounts/${id}`).then((r) => r.data),

  // Orders
  getOrders: (params?: any) => client.get('/orders', { params }).then((r) => r.data),
  getOrderById: (id: number) => client.get(`/orders/${id}`).then((r) => r.data.data),
  createOrder: (data: any) => client.post('/orders', data).then((r) => r.data),
  updateOrderStatus: (id: number, status: string) => client.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
  deleteOrder: (id: number) => client.delete(`/orders/${id}`).then((r) => r.data),

  // Order Items
  getOrderItems: (params?: any) => client.get('/order-items', { params }).then((r) => r.data),
  getOrderItemById: (orderId: number, productId: number) =>
    client.get(`/order-items/${orderId}/${productId}`).then((r) => r.data.data),
  createOrderItem: (data: any) => client.post('/order-items', data).then((r) => r.data),
  updateOrderItemQty: (orderId: number, productId: number, quantity: number) =>
    client.put(`/order-items/${orderId}/${productId}`, { quantity }).then((r) => r.data),
  deleteOrderItem: (orderId: number, productId: number) =>
    client.delete(`/order-items/${orderId}/${productId}`).then((r) => r.data),

  // Payments
  getPayments: (params?: any) => client.get('/payments', { params }).then((r) => r.data),
  getPaymentById: (id: number) => client.get(`/payments/${id}`).then((r) => r.data.data),
  createPayment: (data: any) => client.post('/payments', data).then((r) => r.data),
  updatePayment: (id: number, data: any) => client.put(`/payments/${id}`, data).then((r) => r.data),
  deletePayment: (id: number) => client.delete(`/payments/${id}`).then((r) => r.data),

  // Deliveries
  getDeliveries: (params?: any) => client.get('/deliveries', { params }).then((r) => r.data),
  getDeliveryById: (id: number) => client.get(`/deliveries/${id}`).then((r) => r.data.data),
  createDelivery: (data: any) => client.post('/deliveries', data).then((r) => r.data),
  updateDelivery: (id: number, data: any) => client.put(`/deliveries/${id}`, data).then((r) => r.data),
  deleteDelivery: (id: number) => client.delete(`/deliveries/${id}`).then((r) => r.data),

  // Analytics
  getDashboardAnalytics: () => client.get('/analytics/dashboard').then((r) => r.data.data),
  getRevenueOverTime: () => client.get('/analytics/revenue-over-time').then((r) => r.data.data),
  getBestSellers: (limit = 5) => client.get('/analytics/best-sellers', { params: { limit } }).then((r) => r.data.data),

  // SQL Query Lab
  getQueryCatalog: (): Promise<PredefinedQuery[]> => client.get('/query-lab/catalog').then((r) => r.data.data),
  executePredefinedQuery: (id: string): Promise<{ query: PredefinedQuery } & QueryResult> =>
    client.post(`/query-lab/predefined/${id}`).then((r) => r.data),
  executeCustomQuery: (sql: string): Promise<QueryResult> =>
    client.post('/query-lab/execute', { sql }).then((r) => r.data),

  // Views
  getViewsMetadata: () => client.get('/views').then((r) => r.data.data),
  executeView: (name: string) => client.get(`/views/${name}/data`).then((r) => r.data.data),

  // Indexes
  getIndexes: () => client.get('/indexes').then((r) => r.data.data),
  explainQuery: (sql: string) => client.post('/indexes/explain', { sql }).then((r) => r.data.data),

  // Transactions
  runTransactionDemo: () => client.post('/transactions/demo').then((r) => r.data),

  // Testing
  runAllTests: (): Promise<{
    tests: TestResult[];
    consistencyChecks: ConsistencyCheck[];
    passedCount: number;
    failedCount: number;
    totalCount: number;
  }> => client.post('/testing/run-all').then((r) => r.data.data),
  getConsistencyChecks: (): Promise<ConsistencyCheck[]> => client.get('/testing/consistency').then((r) => r.data.data),

  // Concepts
  runDdlDemo: () => client.post('/concepts/ddl').then((r) => r.data),
  runDmlDemo: () => client.post('/concepts/dml').then((r) => r.data),
  runDclDemo: () => client.post('/concepts/dcl').then((r) => r.data),

  // Schema
  getSchemaMetadata: (): Promise<{ database: string; tables: TableMetadata[]; relationships: RelationshipMetadata[] }> =>
    client.get('/schema/metadata').then((r) => r.data.data),
};
