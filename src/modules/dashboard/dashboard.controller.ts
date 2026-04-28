import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { OrderStatus, VendorPayoutStatus } from "../../../generated/prisma";

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

const getDateRange = (
  query: Record<string, unknown>,
): { startDate: Date; endDate: Date } => {
  if (query.startDate && query.endDate) {
    const startDate = new Date(query.startDate as string);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(query.endDate as string);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  // Default: last 7 days
  const now = new Date();
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
    0,
    0,
    0,
    0,
  );
  return { startDate, endDate };
};

export const DashboardController = {
  stats: async (req: Request, res: Response) => {
    try {
      const role = req.user?.role!;
      const userId = req.user?.id!;
      const { startDate, endDate } = getDateRange(
        req.query as Record<string, unknown>,
      );

      // -----------------------------------
      // ADMIN DASHBOARD
      // -----------------------------------
      if (role === "ADMIN") {
        const [
          allOrdersAgg,
          deliveredOrdersAgg,
          deliveredItems,
          paidPayoutsAgg,
          pendingPayoutsAgg,
          ordersByStatus,
          totalProducts,
          totalUsers,
          newUsers,
          totalShops,
          newShops,
          pendingPayoutsCount,
        ] = await Promise.all([
          // Gross: all orders in range regardless of status
          prisma.order.aggregate({
            where: { createdAt: { gte: startDate, lte: endDate } },
            _sum: { totalAmount: true },
            _count: { id: true },
          }),

          // DELIVERED orders in range — for count, avg, and delivery charge sum
          prisma.order.aggregate({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              status: OrderStatus.DELIVERED,
            },
            _sum: { totalAmount: true, deliveryCharge: true },
            _count: { id: true },
            _avg: { totalAmount: true },
          }),

          // DELIVERED order items — product revenue (no delivery) and vendor cost
          prisma.orderItem.findMany({
            where: {
              order: {
                createdAt: { gte: startDate, lte: endDate },
                status: OrderStatus.DELIVERED,
              },
            },
            select: {
              quantity: true,
              price: true,
              discountPrice: true,
              product: { select: { shopSellPrice: true, shopPrice: true } },
            },
          }),

          // Vendor payouts already paid (all time)
          prisma.vendorPayout.aggregate({
            where: { status: VendorPayoutStatus.PAID },
            _sum: { amount: true },
          }),

          // Vendor payouts still owed (all time — outstanding obligation)
          prisma.vendorPayout.aggregate({
            where: {
              status: {
                in: [VendorPayoutStatus.PENDING, VendorPayoutStatus.PROCESSING],
              },
            },
            _sum: { amount: true },
          }),

          // Order counts + amounts grouped by status in range
          prisma.order.groupBy({
            by: ["status"],
            where: { createdAt: { gte: startDate, lte: endDate } },
            _count: { id: true },
            _sum: { totalAmount: true },
          }),

          prisma.product.count({ where: { isActive: true } }),

          prisma.user.count(),

          // Users who registered in the date range
          prisma.user.count({
            where: { createdAt: { gte: startDate, lte: endDate } },
          }),

          prisma.shop.count(),

          // Shops created in the date range
          prisma.shop.count({
            where: { createdAt: { gte: startDate, lte: endDate } },
          }),

          // Total count of unsettled vendor payouts
          prisma.vendorPayout.count({
            where: {
              status: {
                in: [VendorPayoutStatus.PENDING, VendorPayoutStatus.PROCESSING],
              },
            },
          }),
        ]);

        const grossRevenue = allOrdersAgg._sum.totalAmount ?? 0;
        const totalDeliveryCharges =
          deliveredOrdersAgg._sum.deliveryCharge ?? 0;

        // Product-only revenue: snapshot price × qty, no delivery charge
        const productRevenue = deliveredItems.reduce(
          (sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity,
          0,
        );

        // Vendor cost: shopSellPrice × qty for delivered items (vendor's earned portion)
        const vendorCost = deliveredItems.reduce(
          (sum, i) => sum + i.product.shopPrice * i.quantity,
          0,
        );

        const totalVendorPaid = paidPayoutsAgg._sum.amount ?? 0;
        const pendingPayoutsAmount = pendingPayoutsAgg._sum.amount ?? 0;

        // Platform profit = vendorCost − (pendingPayouts + paidVendorPayouts)
        // i.e. what vendors earned from orders minus what has already been paid / is queued
        const platformProfit = productRevenue - vendorCost;

        const avgOrderValue = +(
          deliveredOrdersAgg._avg.totalAmount?.toFixed(2) ?? 0
        );

        return res.json({
          role: "ADMIN",

          // Revenue
          grossRevenue, // All order totalAmounts in range (incl. delivery, all statuses)
          productRevenue, // DELIVERED items only, delivery excluded
          totalDeliveryCharges, // Delivery charges from delivered orders
          vendorCost, // shopSellPrice × qty (vendor's earned portion, delivered items)
          totalVendorPaid, // Vendor payouts already sent
          platformProfit, // vendorCost − pendingPayoutsAmount − totalVendorPaid
          platformProfitMargin:
            vendorCost > 0
              ? +((platformProfit / vendorCost) * 100).toFixed(2)
              : 0,
          // Outstanding obligations to vendors
          pendingPayoutsAmount: pendingPayoutsAmount - totalVendorPaid,
          pendingPayoutsCount,

          // Order metrics in range
          totalOrders: allOrdersAgg._count.id,
          deliveredOrders: deliveredOrdersAgg._count.id,
          avgOrderValue,
          ordersByStatus: ordersByStatus.map((s) => ({
            status: s.status,
            count: s._count.id,
            amount: s._sum.totalAmount ?? 0,
          })),

          // Catalog & user counts
          totalProducts,
          totalUsers,
          newUsers,
          totalShops,
          newShops,
        });
      }

      // -----------------------------------
      // SHOP OWNER DASHBOARD
      // -----------------------------------
      if (role === "SHOP_OWNER") {
        const shop = await prisma.shop.findFirst({
          where: { ownerId: userId },
          select: { id: true },
        });

        if (!shop) {
          return res.status(404).json({ message: "Shop not found" });
        }

        const [
          totalProducts,
          totalOrders,
          uniqueCustomers,
          orderItems,
          paidPayoutsAgg,
          pendingPayoutsAgg,
        ] = await Promise.all([
          prisma.product.count({ where: { shopId: shop.id } }),

          prisma.order.count({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              items: { some: { product: { shopId: shop.id } } },
            },
          }),

          prisma.order.findMany({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              items: { some: { product: { shopId: shop.id } } },
            },
            distinct: ["userId"],
            select: { userId: true },
          }),

          // All order items in range for revenue + cost calculation
          prisma.orderItem.findMany({
            where: {
              order: { createdAt: { gte: startDate, lte: endDate } },
              product: { shopId: shop.id },
            },
            select: {
              quantity: true,
              product: {
                select: { shopPrice: true, shopSellPrice: true },
              },
            },
          }),

          // Payouts admin already sent to this shop in range
          prisma.vendorPayout.aggregate({
            where: {
              shopId: shop.id,
              createdAt: { gte: startDate, lte: endDate },
              status: VendorPayoutStatus.PAID,
            },
            _sum: { amount: true },
          }),

          // Payouts still owed to this shop (outstanding)
          prisma.vendorPayout.aggregate({
            where: {
              shopId: shop.id,
              status: {
                in: [VendorPayoutStatus.PENDING, VendorPayoutStatus.PROCESSING],
              },
            },
            _sum: { amount: true },
          }),
        ]);

        // shopSellPrice = what shop charges → revenue
        const totalRevenue = orderItems.reduce(
          (sum, item) => sum + item.product.shopSellPrice * item.quantity,
          0,
        );
        // shopPrice = inventory cost price
        const totalCost = orderItems.reduce(
          (sum, item) => sum + item.product.shopPrice * item.quantity,
          0,
        );
        const grossProfit = totalRevenue - totalCost;

        return res.json({
          role: "SHOP_OWNER",

          // Revenue (shopSellPrice × qty for orders in range)
          totalRevenue,
          totalCost,
          grossProfit,
          profitMargin:
            totalRevenue > 0
              ? +((grossProfit / totalRevenue) * 100).toFixed(2)
              : 0,

          // Payout info from admin
          vendorPayoutsReceived: paidPayoutsAgg._sum.amount ?? 0,
          vendorPayoutsPending:
            (pendingPayoutsAgg._sum.amount ?? 0) -
            (paidPayoutsAgg._sum.amount ?? 0),

          // Counts
          totalOrders,
          totalProducts,
          uniqueCustomers: uniqueCustomers.length,
          totalShops: 1,
        });
      }

      return res.json({ message: "No dashboard data" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  },

  revenue: async (req: Request, res: Response) => {
    const filter = getShopFilter(req.user?.id!, req.user?.role!);
    const role = req.user?.role!;

    try {
      const { startDate, endDate } = getDateRange(
        req.query as Record<string, unknown>,
      );

      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: { createdAt: { gte: startDate, lte: endDate }, ...filter },
        },
        include: {
          order: true,
          product: true,
        },
      });

      const result = orderItems.map((item) => ({
        date: item.order.createdAt.toISOString(),
        // Fix 1: SHOP_OWNER uses shopSellPrice (sell price), not shopPrice (cost price)
        // Fix 2: multiply by quantity for correct totals
        revenue:
          role === "SHOP_OWNER"
            ? item.product.shopSellPrice * item.quantity
            : (item.discountPrice ?? item.price) * item.quantity,
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
      const { startDate, endDate } = getDateRange(
        req.query as Record<string, unknown>,
      );

      // Prisma groupBy on a DateTime column groups by exact timestamp (one row per order).
      // Fetch with status and group by date string in JS instead.
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate, lte: endDate }, ...filter },
        select: { createdAt: true, status: true },
      });

      const grouped: Record<
        string,
        { orders: number; completed: number; pending: number }
      > = {};

      for (const o of orders) {
        const day = o.createdAt.toISOString().slice(0, 10); // "YYYY-MM-DD"
        if (!grouped[day])
          grouped[day] = { orders: 0, completed: 0, pending: 0 };
        grouped[day].orders += 1;
        if (o.status === OrderStatus.DELIVERED) grouped[day].completed += 1;
        if (o.status === OrderStatus.PENDING) grouped[day].pending += 1;
      }

      const result = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },

  categories: async (req: Request, res: Response) => {
    const role = req.user?.role!;
    const userId = req.user?.id!;

    try {
      const { startDate, endDate } = getDateRange(
        req.query as Record<string, unknown>,
      );

      let shopId: string | undefined;
      if (role === "SHOP_OWNER") {
        const shop = await prisma.shop.findFirst({
          where: { ownerId: userId },
          select: { id: true },
        });
        shopId = shop?.id;
      }

      // Use actual delivered order items for category revenue (not product list prices)
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            status: OrderStatus.DELIVERED,
            createdAt: { gte: startDate, lte: endDate },
          },
          ...(shopId ? { product: { shopId } } : {}),
        },
        select: {
          quantity: true,
          price: true,
          discountPrice: true,
          product: {
            select: {
              shopSellPrice: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      });

      const categoryMap: Record<string, { name: string; value: number }> = {};
      for (const item of orderItems) {
        const cat = item.product.category;
        const revenue =
          role === "SHOP_OWNER"
            ? item.product.shopSellPrice * item.quantity
            : (item.discountPrice ?? item.price) * item.quantity;
        if (!categoryMap[cat.id])
          categoryMap[cat.id] = { name: cat.name, value: 0 };
        categoryMap[cat.id].value += revenue;
      }

      res.json(Object.values(categoryMap));
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

      const products = await prisma.product.findMany({
        take: limit,
        orderBy: { sold: "desc" },
        where: role === "SHOP_OWNER" ? { shop: { ownerId: userId } } : {},
        include: { category: true },
      });

      const result = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name ?? "Unknown",
        sales: p.sold,
        // Fix: SHOP_OWNER was using shopPrice (cost) — should be shopSellPrice (sell price)
        revenue:
          role === "SHOP_OWNER"
            ? p.shopSellPrice * p.sold
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
                select: { shopSellPrice: true },
              },
            },
          },
        },
      });

      const result = orders.map((o) => {
        // Fix: was using shopPrice (cost price) — now correctly uses shopSellPrice
        const shopRevenue = o.items.reduce(
          (sum, item) => sum + item.product.shopSellPrice * item.quantity,
          0,
        );

        return {
          id: o.id,
          orderNumber: o.orderNumber, // Fix: use the auto-increment orderNumber, not id slice
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
    const productWiseOrders = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { product: { shopId } },
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: "desc" } },
    });

    const productIds = productWiseOrders.map((p) => p.productId);

    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        shopPrice: true,
        shopSellPrice: true,
        imageUrls: true,
        stock: true,
        sold: true,
        rating: true,
        category: { select: { name: true } },
      },
    });

    const productMap = Object.fromEntries(productDetails.map((p) => [p.id, p]));

    const productWiseOrdersEnriched = productWiseOrders.map((item) => {
      const product = productMap[item.productId];
      const unitsSold = item._sum.quantity ?? 0;
      const orderCount = item._count.id;

      // shopRevenue  = shopSellPrice × units sold
      // shopCost     = shopPrice     × units sold
      // shopProfit   = (shopSellPrice - shopPrice) × units sold
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

    // ── 4. SHOP REVENUE (DELIVERED only) ─────────────────────────────────────
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
      0,
    );
    const totalShopCost = deliveredItems.reduce(
      (sum, i) => sum + (i.product.shopPrice ?? 0) * i.quantity,
      0,
    );
    const totalShopProfit = totalShopRevenue - totalShopCost;

    // Revenue breakdown by order status
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
          0,
        );
        const cost = items.reduce(
          (s, i) => s + (i.product.shopPrice ?? 0) * i.quantity,
          0,
        );
        return {
          status,
          revenue,
          cost,
          profit: revenue - cost,
          orderCount: items.length,
        };
      }),
    );

    // ── 5. MONTHLY REVENUE TREND (last 12 months, DELIVERED only) ────────────
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

    // ── 8. CATEGORY-WISE REVENUE (shopSellPrice, DELIVERED only) ─────────────
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
        totalShopCostValue: productStats._sum.shopPrice ?? 0,
        totalShopSellValue: productStats._sum.shopSellPrice ?? 0,
        avgShopPrice: productStats._avg.shopPrice ?? 0,
        avgShopSellPrice: productStats._avg.shopSellPrice ?? 0,
      },

      productWiseOrders: productWiseOrdersEnriched,
      topSellingProducts,
      lowStockProducts,

      revenue: {
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
