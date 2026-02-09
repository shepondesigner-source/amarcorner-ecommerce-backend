type InvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  discountPrice?: number | null;
};

export const invoiceTemplate = ({
  orderId,
  items,
  total,
  deliveryCharge,
  companyName = "MY COMPANY",
  logoUrl = "https://res.cloudinary.com/streed/image/upload/v1770635890/vecteezy_golden-logo-template_23654784_heuhhi.png",
}: {
  orderId: string;
  items: InvoiceItem[];
  total: number;
  deliveryCharge: number;
  companyName?: string;
  logoUrl?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invoice #${orderId}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            color: white;
        }
        
        .company-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 30px;
        }
        
        .company-logo {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .company-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .company-details h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .invoice-title {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .invoice-title h2 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .invoice-title p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .order-info {
            background: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 40px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .info-item h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 8px;
        }
        
        .info-item p {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        
        .items-table thead {
            background: #f1f5f9;
        }
        
        .items-table th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .items-table tbody tr {
            border-bottom: 1px solid #e2e8f0;
        }
        
        .items-table tbody tr:hover {
            background: #f8fafc;
        }
        
        .items-table td {
            padding: 20px 16px;
            font-size: 16px;
        }
        
        .item-name {
            font-weight: 500;
            color: #1e293b;
        }
        
        .item-qty, .item-price {
            color: #475569;
        }
        
        .original-price {
            text-decoration: line-through;
            color: #94a3b8;
            font-size: 14px;
            margin-right: 8px;
        }
        
        .discount-price {
            color: #10b981;
            font-weight: 600;
        }
        
        .summary {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 30px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .summary-row:last-child {
            border-bottom: none;
        }
        
        .total-row {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            padding: 16px 0;
        }
        
        .footer {
            padding: 30px 40px;
            background: #1e293b;
            color: white;
            text-align: center;
        }
        
        .footer p {
            margin-bottom: 8px;
            font-size: 14px;
            opacity: 0.8;
        }
        
        .thank-you {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #ffffff;
        }
        
        @media (max-width: 600px) {
            .header, .content {
                padding: 24px;
            }
            
            .company-info {
                flex-direction: column;
                text-align: center;
                gap: 16px;
            }
            
            .items-table {
                display: block;
                overflow-x: auto;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <div class="company-logo">
                    <img src="${logoUrl}" alt="${companyName} Logo">
                </div>
                <div class="company-details">
                    <h1>${companyName}</h1>
                    <p>Professional Services & Solutions</p>
                </div>
            </div>
            
            <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>Thank you for your order!</p>
            </div>
        </div>
        
        <div class="content">
            <div class="order-info">
                <div class="info-grid">
                    <div class="info-item">
                        <h3>Invoice Number</h3>
                        <p>#${orderId}</p>
                    </div>
                    <div class="info-item">
                        <h3>Date Issued</h3>
                        <p>${new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</p>
                    </div>
                    <div class="info-item">
                        <h3>Total Items</h3>
                        <p>${items.length}</p>
                    </div>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Item</th>
                        <th style="width: 20%;">Quantity</th>
                        <th style="width: 30%;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${items
                      .map(
                        (item) => `
                    <tr>
                        <td class="item-name">${item.name}</td>
                        <td class="item-qty">${item.quantity}</td>
                        <td class="item-price">
                            ${
                              item.discountPrice
                                ? `
                                <span class="original-price">${(
                                  item.price * item.quantity
                                ).toFixed(2)} BDT</span>
                                <span class="discount-price">${(
                                  item.discountPrice * item.quantity
                                ).toFixed(2)} BDT</span>
                            `
                                : `
                                ${(item.price * item.quantity).toFixed(2)} BDT
                            `
                            }
                        </td>
                    </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div class="summary">
                <div class="summary-row">
                    <span>Subtotal = </span>
                    <span>${(total - deliveryCharge).toFixed(2)} BDT</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Charge = </span>
                    <span>${deliveryCharge.toFixed(2)} BDT</span>
                </div>
                <div class="summary-row total-row">
                    <span>Total Amount = </span>
                    <span>${total.toFixed(2)} BDT</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="thank-you">Thank you for choosing ${companyName}!</div>
            <p>If you have any questions about this invoice, please contact us</p>
            <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
