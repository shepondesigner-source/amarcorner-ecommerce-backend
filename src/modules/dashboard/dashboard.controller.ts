import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

const getStartDate = (range: string): Date => {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }
};

export const DashboardController = {
  stats: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "week";
      const startDate = getStartDate(range);

      // Total Revenue: sum of all OrderItem prices (including discount if exists)
      const revenueAgg = await prisma.orderItem.aggregate({
        _sum: {
          discountPrice: true,
          price: true,
        },
        where: {
          order: {
            createdAt: { gte: startDate },
          },
        },
      });

      const totalRevenue =
        revenueAgg._sum.discountPrice ?? revenueAgg._sum.price ?? 0;

      // Total Orders
      const totalOrders = await prisma.order.count({
        where: { createdAt: { gte: startDate } },
      });

      // Total Users
      const totalUsers = await prisma.user.count({
        where: { createdAt: { gte: startDate } },
      });

      // Total Products
      const totalProducts = await prisma.product.count();

      res.json({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        revenueGrowth: 10, // placeholder
        orderGrowth: 5, // placeholder
        userGrowth: 8, // placeholder
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },

  revenue: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "week";
      const startDate = getStartDate(range);

      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: { createdAt: { gte: startDate } },
        },
        include: { order: true },
      });

      const result = orderItems.map((item) => ({
        date: item.order.createdAt.toISOString(),
        revenue: item.discountPrice ?? item.price,
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch revenue" });
    }
  },

  orders: async (req: Request, res: Response) => {
    try {
      const range = (req.query.range as string) || "week";
      const startDate = getStartDate(range);

      // Group orders by date (day precision)
      const orders = await prisma.order.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: { createdAt: { gte: startDate } },
      });

      const result = orders.map((o) => ({
        date: o.createdAt.toISOString(),
        orders: o._count.id,
        completed: 0, // placeholder
        pending: 0, // placeholder
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },

  categories: async (req: Request, res: Response) => {
    try {
      // Sum of prices per category
      const categoryAgg = await prisma.product.groupBy({
        by: ["categoryId"],
        _sum: { price: true },
      });

      const categories = await prisma.category.findMany();

      const result = categoryAgg.map((c) => {
        const category = categories.find((cat) => cat.id === c.categoryId);
        return {
          name: category?.name ?? "Unknown",
          value: c._sum.price ?? 0,
        };
      });

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  },

  topProducts: async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 5;

      // Get top products by sold quantity
      const products = await prisma.product.findMany({
        take: limit,
        orderBy: { sold: "desc" },
        include: { category: true },
      });

      const result = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name ?? "Unknown",
        sales: p.sold,
        revenue: (p.discountPrice ?? p.price) * p.sold,
        growth: 0,
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  },

  recentOrders: async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 5;

      const orders = await prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      });

      const result = orders.map((o) => ({
        id: o.id,
        orderNumber: o.id.slice(0, 6).toUpperCase(),
        customerName: o.user?.name ?? "Unknown",
        date: o.createdAt.toISOString(),
        amount: o.totalAmount,
        status: o.status,
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  },
};
