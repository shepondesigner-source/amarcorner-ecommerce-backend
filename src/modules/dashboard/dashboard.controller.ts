import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
const getShopFilter = (userId: string, role: string) => {
  if (role === "SHOP_OWNER") {
    return {
      items: {
        some: {
          product: {
            shop: {
              ownerId: userId,
            },
          },
        },
      },
    };
  }

  return {}; // ADMIN sees all
};
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
    const role = req.user?.role!;
    const userId = req.user?.id!;

    try {
      const range = (req.query.range as string) || "week";
      const startDate = getStartDate(range);

      let totalRevenue = 0;

      /** ADMIN → platform revenue */
      if (role === "ADMIN") {
        const revenueAgg = await prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { createdAt: { gte: startDate } },
        });

        totalRevenue = revenueAgg._sum.totalAmount || 0;
      }

      /** SHOP_OWNER → shop revenue */
      if (role === "SHOP_OWNER") {
        const items = await prisma.orderItem.findMany({
          where: {
            order: { createdAt: { gte: startDate } },
            product: {
              shop: {
                ownerId: userId,
              },
            },
          },
          select: {
            quantity: true,
            product: {
              select: {
                shopPrice: true,
              },
            },
          },
        });

        totalRevenue = items.reduce((sum, item) => {
          return sum + item.product.shopPrice * item.quantity;
        }, 0);
      }

      const totalOrders = await prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          ...getShopFilter(userId, role),
        },
      });

      const totalUsers = await prisma.user.count({
        where: { createdAt: { gte: startDate } },
      });

      const totalProducts = await prisma.product.count({
        where:
          role === "SHOP_OWNER"
            ? {
                shop: {
                  ownerId: userId,
                },
              }
            : {},
      });

      res.json({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        revenueGrowth: 10,
        orderGrowth: 5,
        userGrowth: 8,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },

  revenue: async (req: Request, res: Response) => {
    const filter = getShopFilter(req.user?.id!, req.user?.role!);
    const role = req.user?.role!;

    try {
      const range = (req.query.range as string) || "week";
      const startDate = getStartDate(range);

      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: { createdAt: { gte: startDate }, ...filter },
        },
        include: {
          order: true,
          product: true, // ✅ required
        },
      });

      const result = orderItems.map((item) => ({
        date: item.order.createdAt.toISOString(),
        revenue:
          role === "SHOP_OWNER"
            ? item.product.shopPrice * item.quantity
            : item.discountPrice ?? item.price,
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch revenue" });
    }
  },

  orders: async (req: Request, res: Response) => {
    const filter = getShopFilter(req.user?.id!, req.user?.role!);

    try {
      const range = (req.query.range as string) || "week";
      const startDate = getStartDate(range);

      // Group orders by date (day precision)
      const orders = await prisma.order.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: { createdAt: { gte: startDate }, ...filter },
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
    const role = req.user?.role!;
    const userId = req.user?.id!;

    try {
      const limit = Number(req.query.limit) || 5;

      // Get top products by sold quantity
      const products = await prisma.product.findMany({
        take: limit,
        orderBy: { sold: "desc" },
        where:
          role === "SHOP_OWNER"
            ? {
                shop: {
                  ownerId: userId,
                },
              }
            : {},
        include: { category: true },
      });

      const result = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name ?? "Unknown",
        sales: p.sold,
        revenue:
          role === "SHOP_OWNER"
            ? p.shopPrice * p.sold
            : (p.discountPrice ?? p.price) * p.sold,
        growth: 0,
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  },

  recentOrders: async (req: Request, res: Response) => {
    const filter = getShopFilter(req.user?.id!, req.user?.role!);
    const role = req.user?.role!;

    try {
      const limit = Number(req.query.limit) || 5;

      const orders = await prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        where: filter,
        include: {
          user: true,
          items: {
            include: {
              product: {
                select: {
                  shopPrice: true,
                },
              },
            },
          },
        },
      });

      const result = orders.map((o) => {
        const shopRevenue = o.items.reduce((sum, item) => {
          return sum + item.product.shopPrice * item.quantity;
        }, 0);

        return {
          id: o.id,
          orderNumber: o.id.slice(0, 6).toUpperCase(),
          customerName: o.user?.name ?? "Unknown",
          date: o.createdAt.toISOString(),
          amount: role === "SHOP_OWNER" ? shopRevenue : o.totalAmount,
          status: o.status,
        };
      });

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  },
};
