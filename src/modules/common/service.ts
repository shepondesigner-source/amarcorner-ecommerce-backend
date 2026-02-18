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

import { resend } from "../../config/mail";

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
