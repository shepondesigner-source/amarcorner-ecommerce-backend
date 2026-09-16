import axios from "axios";
import { prisma } from "../config/prisma";

const BASE_URL =
  process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1";

const headers = () => ({
  "Api-Key": process.env.STEADFAST_API_KEY!,
  "Secret-Key": process.env.STEADFAST_SECRET_KEY!,
  "Content-Type": "application/json",
});

export type SteadfastOrderBody = {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  alternative_phone?: string;
  recipient_email?: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: 0 | 1;
};

export type SteadfastConsignment = {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type SteadfastCreateOrderResponse = {
  status: number;
  message: string;
  consignment: SteadfastConsignment;
};

export const createSteadfastOrderService = async (
  body: SteadfastOrderBody,
): Promise<SteadfastCreateOrderResponse> => {
  const res = await axios.post(`${BASE_URL}/create_order`, body, {
    headers: headers(),
  });
  return res.data;
};

export const createSteadfastOrderFromOrderService = async (
  orderId: string,
  options?: {
    deliveryType?: 0 | 1;
    note?: string;
    itemDescription?: string;
    totalLot?: number;
  },
) => {
  const order = await prisma.order.findFirstOrThrow({
    where: { id: orderId },
    include: { shippingAddress: true, items: true },
  });

  const payload: SteadfastOrderBody = {
    invoice: `ORD-${String(order.orderNumber).padStart(6, "0")}`,
    recipient_name: order.shippingAddress.name,
    recipient_phone: order.shippingAddress.phone.trim(),
    recipient_address: `${order.shippingAddress.address}, ${order.shippingAddress.district}`,
    cod_amount: Math.round(order.totalAmount),
    note: options?.note,
    item_description:
      options?.itemDescription ?? `Ecommerce: ${order.items.length} item(s)`,
    total_lot: options?.totalLot,
    delivery_type: options?.deliveryType,
  };

  const data = await createSteadfastOrderService(payload);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "SHIPPED",
      steadfastStatus: "PLACED",
    },
  });

  return data;
};
