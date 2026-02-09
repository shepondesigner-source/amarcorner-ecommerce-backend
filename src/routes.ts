import { Router } from "express";
import authRoutes from "./modules/auth/auth.route";
import categoryRoutes from "./modules/category/category.routes";
import subcategoryRoutes from "./modules/sub-category/sub-category.routes";
import userRoutes from "./modules/user/user.routes";
import addressRoutes from "./modules/address/address.route";

import bannerRoutes from "./modules/banner/banner.route";
import productRoutes from "./modules/product/product.route";
import orderRoutes from "./modules/order/order.route";
import shopRoutes from "./modules/shop/shop.routes";

import paymentRoutes from "./modules/payment/payment.route";
import sizeRoutes from "./modules/size/size.route";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);

// Category routes
router.use("/categories", categoryRoutes);

// SubCategory routes
router.use("/subcategories", subcategoryRoutes);

// Product routes
router.use("/banners", bannerRoutes);

// Product routes
router.use("/products", productRoutes);

// dashboard routes
router.use("/dashboard", dashboardRoutes);

//Order routes
router.use("/orders", orderRoutes);

//Shop routes
router.use("/shops", shopRoutes);

//User routes
router.use("/users", userRoutes);

//ShippingAddress routes
router.use("/address", addressRoutes   );

// payment routes
router.use("/payments", paymentRoutes);

// size routes
router.use("/sizes", sizeRoutes);

// Health check route
router.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

export default router;
