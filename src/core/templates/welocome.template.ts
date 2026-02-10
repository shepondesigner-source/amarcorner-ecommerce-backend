// templates/welcomeTemplate.ts
export const welcomeTemplate = ({
  name,
  storeName,
}: {
  name: string;
  storeName: string;
}) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Welcome to ${storeName} 🎉</h2>
    <p>Hi ${name},</p>

    <p>
      Your account has been successfully created.
      We’re excited to have you as part of our eCommerce family!
    </p>

    <ul>
      <li>Browse and shop amazing products</li>
      <li>Track your orders easily</li>
      <li>Get exclusive offers and discounts</li>
    </ul>

    <p>
      If you need any help, feel free to contact our support team.
    </p>

    <p>
      Happy shopping! 🛒 <br />
      <strong>${storeName} Team</strong>
    </p>
  </div>
`;
