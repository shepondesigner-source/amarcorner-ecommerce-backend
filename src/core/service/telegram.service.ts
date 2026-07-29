import axios from "axios";
import { config } from "../../config/env";

export const sendTelegramMessage = async (text: string) => {
  const { botToken, chatId } = config.telegram;
  if (!botToken || !chatId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
};

export const buildOrderNotificationMessage = (params: {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  district: string;
  address: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    discountPrice?: number | null;
  }[];
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  comment?: string | null;
}) => {
  const itemLines = params.items
    .map(
      (i) =>
        `• ${i.name} x${i.quantity} — ৳${i.discountPrice ?? i.price}`,
    )
    .join("\n");

  return [
    `🛒 <b>New Order #${params.orderNumber}</b>`,
    ``,
    `👤 ${params.customerName}`,
    `📞 ${params.customerPhone}`,
    `📍 ${params.address}, ${params.district}`,
    ``,
    `<b>Items:</b>`,
    itemLines,
    ``,
    `🚚 Delivery: ৳${params.deliveryCharge}`,
    `💰 <b>Total: ৳${params.totalAmount}</b>`,
    `💳 Payment: ${params.paymentMethod}`,
    params.comment ? `📝 ${params.comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};
