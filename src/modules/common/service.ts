// import { mailTransporter } from "../../config/mail";

// type SendMailOptions = {
//   to: string;
//   subject: string;
//   html: string;
// };

// export const MailService = {
//   send: async ({ to, subject, html }: SendMailOptions) => {
//     await mailTransporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to,
//       subject,
//       html,
//     });
//   },
// };

import axios from "axios";
import { resend } from "../../config/mail";
import { getPathaoToken } from "../../core/service/pathao.service";
import { prisma } from "../../config/prisma";

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const MailService = {
  send: async ({ to, subject, html }: SendMailOptions) => {
    await resend.emails.send({
      from: "Website <website@resend.dev>",
      to,
      subject,
      html,
    });
  },
};

export async function sendOtp(email: string, otp: string) {
  await fetch("https://www.amarcorner.com/api/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: email,
      message: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    }),
  });
}

export const createPathaoOrder = async (orderId: any) => {
  const token = await getPathaoToken();
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      user: true,
      shippingAddress: true,
      items: {
        include: {
          product: {
            include: {
              shop: true,
            },
          },
        },
      },
    },
  });
  const res = await axios.post(
    `${process.env.PATHAO_BASE_URL}/aladdin/api/v1/orders`,
    {
      store_id: order?.items[0].product.shop.pathaoId,
      merchant_order_id: `ORD-0000${order?.orderNumber}`,
      recipient_name: order?.user.name,
      recipient_phone: order?.user.phone,
      recipient_address: order?.shippingAddress.address,
      amount_to_collect: order?.totalAmount,
      item_description: "Ecommerce Product",
      item_quantity: 1,
      item_weight: 0.5,
      item_type: 2,
      delivery_type: 48,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  const updateOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      pathaoStatus: "PLACED",
      status: "SHIPPED",
    },
  });

  return res.data;
};
