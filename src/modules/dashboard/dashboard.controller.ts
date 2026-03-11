import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { OrderStatus } from "../../../generated/prisma";
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

  shopTotalOrderCount: async (req: Request, res: Response) => {
    const { shopId } = req.params;

    // ── 1. BASIC SHOP INFO ───────────────────────────────────────────────────
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: { select: { name: true, email: true, phone: true } } },
    });

    // ── 2. PRODUCT OVERVIEW ──────────────────────────────────────────────────
    const productStats = await prisma.product.aggregate({
      where: { shopId },
      _count: { id: true },
      _sum: { stock: true, sold: true, shopPrice: true, shopSellPrice: true },
      _avg: { price: true, rating: true, shopPrice: true, shopSellPrice: true },
    });

    const activeProducts = await prisma.product.count({
      where: { shopId, isActive: true },
    });
    const outOfStockProducts = await prisma.product.count({
      where: { shopId, stock: 0 },
    });

    // ── 3. PRODUCT-WISE ORDERS ───────────────────────────────────────────────
    // Group OrderItem by product, filtered to this shop
    const productWiseOrders = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { product: { shopId } },
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: "desc" } },
    });

    const productIds = productWiseOrders.map((p) => p.productId);

    // Fetch full product details including shopPrice / shopSellPrice
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        shopPrice: true, // ← cost price (what shop paid)
        shopSellPrice: true, // ← sell price (what shop charges)
        imageUrls: true,
        stock: true,
        sold: true,
        rating: true,
        category: { select: { name: true } },
      },
    });

    const productMap = Object.fromEntries(productDetails.map((p) => [p.id, p]));

    // Enrich with revenue figures using shopSellPrice
    const productWiseOrdersEnriched = productWiseOrders.map((item) => {
      const product = productMap[item.productId];
      const unitsSold = item._sum.quantity ?? 0;
      const orderCount = item._count.id;

      // Shop revenue  = shopSellPrice × units sold
      // Shop cost     = shopPrice     × units sold
      // Shop profit   = (shopSellPrice - shopPrice) × units sold
      const shopRevenue = (product?.shopSellPrice ?? 0) * unitsSold;
      const shopCost = (product?.shopPrice ?? 0) * unitsSold;
      const shopProfit = shopRevenue - shopCost;

      return {
        product,
        orderCount,
        totalUnitsSold: unitsSold,
        shopRevenue,
        shopCost,
        shopProfit,
      };
    });

    // ── 4. SHOP REVENUE (shopSellPrice based, DELIVERED only) ────────────────
    const deliveredItems = await prisma.orderItem.findMany({
      where: {
        product: { shopId },
        order: { status: OrderStatus.DELIVERED },
      },
      select: {
        quantity: true,
        product: { select: { shopPrice: true, shopSellPrice: true } },
      },
    });

    const totalShopRevenue = deliveredItems.reduce(
      (sum, i) => sum + (i.product.shopSellPrice ?? 0) * i.quantity,
      0
    );
    const totalShopCost = deliveredItems.reduce(
      (sum, i) => sum + (i.product.shopPrice ?? 0) * i.quantity,
      0
    );
    const totalShopProfit = totalShopRevenue - totalShopCost;

    // Revenue breakdown by order status — all using shopSellPrice
    const revenueByStatus = await Promise.all(
      Object.values(OrderStatus).map(async (status) => {
        const items = await prisma.orderItem.findMany({
          where: { product: { shopId }, order: { status } },
          select: {
            quantity: true,
            product: { select: { shopPrice: true, shopSellPrice: true } },
          },
        });
        const revenue = items.reduce(
          (s, i) => s + (i.product.shopSellPrice ?? 0) * i.quantity,
          0
        );
        const cost = items.reduce(
          (s, i) => s + (i.product.shopPrice ?? 0) * i.quantity,
          0
        );
        return {
          status,
          revenue,
          cost,
          profit: revenue - cost,
          orderCount: items.length,
        };
      })
    );

    // ── 5. MONTHLY REVENUE TREND (last 12 months, shopSellPrice based) ───────
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyOrderItems = await prisma.orderItem.findMany({
      where: {
        product: { shopId },
        order: {
          status: OrderStatus.DELIVERED,
          createdAt: { gte: twelveMonthsAgo },
        },
      },
      select: {
        quantity: true,
        product: { select: { shopPrice: true, shopSellPrice: true } },
        order: { select: { createdAt: true } },
      },
    });

    const monthlyRevenue: Record<
      string,
      { revenue: number; cost: number; profit: number }
    > = {};
    for (const item of monthlyOrderItems) {
      const key = item.order.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      const rev = (item.product.shopSellPrice ?? 0) * item.quantity;
      const cost = (item.product.shopPrice ?? 0) * item.quantity;
      if (!monthlyRevenue[key])
        monthlyRevenue[key] = { revenue: 0, cost: 0, profit: 0 };
      monthlyRevenue[key].revenue += rev;
      monthlyRevenue[key].cost += cost;
      monthlyRevenue[key].profit += rev - cost;
    }

    // ── 6. ORDER STATUS BREAKDOWN ────────────────────────────────────────────
    const orderStatusBreakdown = await prisma.order.groupBy({
      by: ["status"],
      where: { items: { some: { product: { shopId } } } },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // ── 7. TOP SELLING PRODUCTS (by sold count) ──────────────────────────────
    const topSellingProducts = await prisma.product.findMany({
      where: { shopId },
      orderBy: { sold: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        shopPrice: true,
        shopSellPrice: true,
        sold: true,
        stock: true,
        rating: true,
        imageUrls: true,
        category: { select: { name: true } },
      },
    });

    // ── 8. CATEGORY-WISE REVENUE (shopSellPrice) ─────────────────────────────
    const categoryItems = await prisma.orderItem.findMany({
      where: { product: { shopId }, order: { status: OrderStatus.DELIVERED } },
      select: {
        quantity: true,
        product: {
          select: {
            shopPrice: true,
            shopSellPrice: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const categoryMap: Record<
      string,
      {
        name: string;
        revenue: number;
        cost: number;
        profit: number;
        units: number;
      }
    > = {};
    for (const item of categoryItems) {
      const cat = item.product.category;
      const rev = (item.product.shopSellPrice ?? 0) * item.quantity;
      const cost = (item.product.shopPrice ?? 0) * item.quantity;
      if (!categoryMap[cat.id])
        categoryMap[cat.id] = {
          name: cat.name,
          revenue: 0,
          cost: 0,
          profit: 0,
          units: 0,
        };
      categoryMap[cat.id].revenue += rev;
      categoryMap[cat.id].cost += cost;
      categoryMap[cat.id].profit += rev - cost;
      categoryMap[cat.id].units += item.quantity;
    }

    // ── 9. PAYMENT METHOD BREAKDOWN ──────────────────────────────────────────
    const paymentBreakdown = await prisma.payment.groupBy({
      by: ["method", "status"],
      where: { order: { items: { some: { product: { shopId } } } } },
      _count: { id: true },
      _sum: { amount: true },
    });

    // ── 10. CUSTOMER ANALYTICS ───────────────────────────────────────────────
    const uniqueCustomerIds = await prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        items: { some: { product: { shopId } } },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    const totalUniqueCustomers = uniqueCustomerIds.length;

    const customerOrderCounts = await prisma.order.groupBy({
      by: ["userId"],
      where: { items: { some: { product: { shopId } } } },
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    });
    const repeatCustomers = customerOrderCounts.length;

    // ── 11. AVERAGE ORDER VALUE ──────────────────────────────────────────────
    const avgOrderValue = await prisma.order.aggregate({
      where: {
        status: OrderStatus.DELIVERED,
        items: { some: { product: { shopId } } },
      },
      _avg: { totalAmount: true },
      _count: { id: true },
    });

    // ── 12. REVIEW / RATING ANALYTICS ───────────────────────────────────────
    const reviewStats = await prisma.review.count({
      where: { product: { shopId } },
    });
    const avgRating = await prisma.product.aggregate({
      where: { shopId },
      _avg: { rating: true },
    });

    // ── 13. OFFER / COUPON PERFORMANCE ──────────────────────────────────────
    const offerStats = await prisma.offer.findMany({
      where: { product: { shopId } },
      select: {
        couponCode: true,
        discount: true,
        usageCount: true,
        maxUsage: true,
        isActive: true,
        expireAt: true,
        product: { select: { name: true } },
      },
      orderBy: { usageCount: "desc" },
    });

    // ── 14. RECENT ORDERS (last 10) ──────────────────────────────────────────
    const recentOrders = await prisma.order.findMany({
      where: { items: { some: { product: { shopId } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, phone: true } },
        items: {
          where: { product: { shopId } },
          include: {
            product: {
              select: {
                name: true,
                imageUrls: true,
                shopPrice: true,
                shopSellPrice: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    // ── 15. INVENTORY ALERTS ─────────────────────────────────────────────────
    const lowStockProducts = await prisma.product.findMany({
      where: { shopId, isActive: true, stock: { gt: 0, lte: 5 } },
      select: { id: true, name: true, stock: true, imageUrls: true },
      orderBy: { stock: "asc" },
    });

    // ── RESPONSE ─────────────────────────────────────────────────────────────
    res.status(200).json({
      shop,

      products: {
        total: productStats._count.id,
        active: activeProducts,
        outOfStock: outOfStockProducts,
        totalStock: productStats._sum.stock ?? 0,
        totalSold: productStats._sum.sold ?? 0,
        avgPrice: productStats._avg.price ?? 0,
        avgRating: avgRating._avg.rating ?? 0,
        totalReviews: reviewStats,
        // Shop-price aggregates
        totalShopCostValue: productStats._sum.shopPrice ?? 0, // sum of shopPrice across all products
        totalShopSellValue: productStats._sum.shopSellPrice ?? 0, // sum of shopSellPrice across all products
        avgShopPrice: productStats._avg.shopPrice ?? 0,
        avgShopSellPrice: productStats._avg.shopSellPrice ?? 0,
      },

      productWiseOrders: productWiseOrdersEnriched, // ← includes shopRevenue, shopCost, shopProfit per product
      topSellingProducts,
      lowStockProducts,

      revenue: {
        // All revenue figures now use shopSellPrice × quantity
        total: totalShopRevenue,
        totalCost: totalShopCost,
        totalProfit: totalShopProfit,
        profitMargin:
          totalShopRevenue > 0
            ? +((totalShopProfit / totalShopRevenue) * 100).toFixed(2)
            : 0,

        byStatus: revenueByStatus,
        byCategory: Object.values(categoryMap),
        monthly: Object.entries(monthlyRevenue)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, v]) => ({ month, ...v })),
      },

      orders: {
        statusBreakdown: orderStatusBreakdown,
        avgOrderValue: avgOrderValue._avg.totalAmount ?? 0,
        totalDeliveredOrders: avgOrderValue._count.id,
        recentOrders,
      },

      customers: {
        totalUnique: totalUniqueCustomers,
        repeatCustomers,
        newCustomers: totalUniqueCustomers - repeatCustomers,
      },

      payments: { breakdown: paymentBreakdown },

      offers: offerStats,
    });
  },
};
