// types/dashboard.ts
export type RevenueData = { date: string; revenue: number; previous?: number };
export type OrderData = { date: string; orders: number; completed?: number; pending?: number };
export type CategoryChartItem = { name: string; value: number };
export type TopProductItem = {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  growth: number;
};
export type RecentOrderItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  amount: number;
  status: string;
};
export type Stats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
};
