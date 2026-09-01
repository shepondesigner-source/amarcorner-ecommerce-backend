import axios from "axios";
import { prisma } from "../config/prisma";

const BASE_URL =
  process.env.CARRYBEE_BASE_URL || "https://sandbox.carrybee.com";

const headers = () => ({
  "Client-ID": process.env.CARRYBEE_CLIENT_ID!,
  "Client-Secret": process.env.CARRYBEE_CLIENT_SECRET!,
  "Client-Context": process.env.CARRYBEE_CLIENT_CONTEXT!,
  "Content-Type": "application/json",
});

export const getCitiesService = async () => {
  const res = await axios.get(`${BASE_URL}/api/v2/cities`, {
    headers: headers(),
  });
  return res.data;
};

export const getZonesService = async (cityId: number) => {
  const res = await axios.get(`${BASE_URL}/api/v2/cities/${cityId}/zones`, {
    headers: headers(),
  });
  return res.data;
};

export const getAreasService = async (cityId: number, zoneId: number) => {
  const res = await axios.get(
    `${BASE_URL}/api/v2/cities/${cityId}/zones/${zoneId}/areas`,
    { headers: headers() },
  );
  return res.data;
};

export const trackCarrybeeOrderService = async (consignmentId: string) => {
  const res = await axios.get(`${BASE_URL}/api/v2/orders/${consignmentId}`, {
    headers: headers(),
  });
  return res.data;
};

export const cancelCarrybeeOrderService = async (consignmentId: string) => {
  const res = await axios.delete(`${BASE_URL}/api/v2/orders/${consignmentId}`, {
    headers: headers(),
  });
  return res.data;
};

export type CarrybeeOrderBody = {
  store_id: string;
  merchant_order_id?: string;
  delivery_type: number;
  product_type: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_secendary_phone?: string;
  recipient_address: string;
  city_id: number;
  zone_id: number;
  area_id?: number;
  special_instruction?: string;
  product_description?: string;
  item_weight: number;
  item_quantity?: number;
  collectable_amount?: number;
  is_closed_box?: boolean;
  is_exchange?: boolean;
};

export type CarrybeeStoreBody = {
  name: string;
  contact_person_name: string;
  contact_person_number: string;
  contact_person_secondary_number?: string;
  address: string;
  city_id: number;
  zone_id: number;
  area_id?: number;
  lat?: number;
  lng?: number;
  average_daily_pickup?: number;
  is_default_pickup_store?: boolean;
  is_default_return_store?: boolean;
};

export const getStoresService = async () => {
  const res = await axios.get(`${BASE_URL}/api/v2/stores`, {
    headers: headers(),
  });
  return res.data;
};

export const createStoreService = async (body: CarrybeeStoreBody) => {
  const res = await axios.post(`${BASE_URL}/api/v2/stores`, body, {
    headers: headers(),
  });
  return res.data;
};

export const createCarrybeeOrderService = async (body: CarrybeeOrderBody) => {
  const res = await axios.post(`${BASE_URL}/api/v2/orders`, body, {
    headers: headers(),
  });
  return res.data;
};

export const createCarrybeeOrderFromOrderService = async (
  orderId: string,
  cityId: number,
  zoneId: number,
  areaId: number | undefined,
  deliveryType: number = 1,
  itemWeight: number = 500,
  instruction?: string,
) => {
  const order = await prisma.order.findFirstOrThrow({
    where: { id: orderId },
    include: {
      shippingAddress: true,
      items: {
        include: {
          product: { include: { shop: true } },
        },
      },
    },
  });

  const shop = order.items[0]?.product.shop;
  if (!shop?.carrybeeId)
    throw new Error("Shop has no Carrybee store ID configured");

  const payload: CarrybeeOrderBody = {
    store_id: shop.carrybeeId,
    merchant_order_id: `ORD-${String(order.orderNumber).padStart(6, "0")}`,
    delivery_type: deliveryType,
    product_type: 1,
    recipient_name: order.shippingAddress.name,
    recipient_phone: order.shippingAddress.phone.trim(),
    recipient_address: `${order.shippingAddress.address}, ${order.shippingAddress.district}`,
    city_id: cityId,
    zone_id: zoneId,
    ...(areaId && { area_id: areaId }),
    product_description: `Ecommerce: ${order.items.length} item(s)`,
    item_quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
    item_weight: itemWeight,
    collectable_amount: Math.round(order.totalAmount),
    special_instruction: instruction,
  };

  const res = await axios.post(`${BASE_URL}/api/v2/orders`, payload, {
    headers: headers(),
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED", carrybeeStatus: "PLACED" },
  });

  return res.data;
};
