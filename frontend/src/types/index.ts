export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

export interface Category {
  category_id: number;
  category_name: string;
  description?: string | null;
  products_count?: number;
}

export interface Product {
  product_id: number;
  product_name: string;
  sku?: string | null;
  unit_price: number;
  category_id: number;
  category_name?: string;
  qty_on_hand?: number;
  reorder_level?: number;
}

export interface InventoryItem {
  inventory_id: number;
  product_id: number;
  qty_on_hand: number;
  reorder_level: number;
  last_updated: string;
  product_name: string;
  sku?: string | null;
  unit_price: number;
  is_low_stock: boolean;
}

export interface Discount {
  discount_id: number;
  code: string;
  discount_type: 'PERCENT' | 'FLAT';
  value: number;
  valid_to: string;
  is_active?: boolean;
}

export interface OrderItem {
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total?: number;
  product_name?: string;
  sku?: string | null;
}

export interface Order {
  order_id: number;
  customer_id: number;
  discount_id?: number | null;
  order_date: string;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  customer_name?: string;
  customer_email?: string;
  discount_code?: string | null;
  discount_value?: number | null;
  has_delivery?: boolean;
  courier?: string | null;
  tracking_no?: string | null;
  total_paid?: number;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface Payment {
  payment_id: number;
  order_id: number;
  method: 'UPI' | 'CARD' | 'NETBANKING' | 'COD';
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paid_on: string;
  customer_name?: string;
}

export interface Delivery {
  delivery_id: number;
  order_id: number;
  courier: string;
  tracking_no?: string | null;
  shipped_on?: string | null;
  delivered_on?: string | null;
  order_date?: string;
  order_status?: string;
  total_amount?: number;
  customer_name?: string;
  customer_address?: string;
  shipping_status?: 'PREPARING' | 'SHIPPED' | 'DELIVERED';
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
}

export interface DashboardKPI {
  totalCustomers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
  totalSuccessfulPayments: number;
  successfulPaymentsCount: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
  repeatCustomers: number;
}

export interface PredefinedQuery {
  id: string;
  category: 'Joins' | 'Subqueries' | 'Set Operations' | 'Business Analytics' | 'Advanced SQL' | 'Aggregates' | 'Filtering';
  name: string;
  sqlConcept: string;
  description: string;
  tablesInvolved: string[];
  businessUtility: string;
  sql: string;
  expectedSummary?: string;
}

export interface QueryResult {
  success: boolean;
  sql: string;
  executionTimeMs: number;
  rowCount: number;
  columns: string[];
  rows: any[];
  error?: {
    code: string;
    message: string;
  };
}

export interface TestResult {
  num: number;
  name: string;
  sql: string;
  expectedResult: string;
  actualResult: string;
  status: 'PASS' | 'FAIL';
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
}

export interface ConsistencyCheck {
  id: string;
  name: string;
  sql: string;
  expected: string;
  actualRows: any[];
  status: 'PASS' | 'FAIL';
  explanation: string;
}

export interface TableMetadata {
  name: string;
  columns: {
    name: string;
    type: string;
    isPrimary: boolean;
    isUnique: boolean;
    isNullable: boolean;
    default: any;
  }[];
  constraints: {
    name: string;
    type: string;
  }[];
  foreignKeys: {
    column: string;
    refTable: string;
    refColumn: string;
    constraintName: string;
  }[];
}

export interface RelationshipMetadata {
  id: string;
  from: string;
  fromCol: string;
  to: string;
  toCol: string;
  cardinality: string;
  label: string;
}
