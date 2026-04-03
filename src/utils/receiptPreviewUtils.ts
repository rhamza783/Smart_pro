import { BillConfig, KOTConfig, PropertySettings, PrintStyle, Order, SplitPortion } from '../types';

const getStyle = (style?: PrintStyle) => {
  if (!style) return '';
  return `
    font-size: ${style.fontSize || '12px'};
    font-family: ${style.fontFamily || 'Inter'};
    font-weight: ${style.fontStyle === 'Bold' ? 'bold' : 'normal'};
    font-style: ${style.fontStyle === 'Italic' ? 'italic' : 'normal'};
  `;
};

const sampleOrder = {
  id: 'ORD-1234',
  table: 'Table 5',
  waiter: 'Ahmed',
  cashier: 'Hamza',
  startTime: Date.now() - 3600000,
  closedAt: Date.now(),
  customer: { name: 'John Doe', phone: '0300-1112223', address: 'Gulberg, Lahore' },
  items: [
    { name: 'Chicken Karahi (Half)', qty: 1, price: 2800, total: 2800, modifiers: [{ optionName: 'Desi Ghee', price: 100 }] }
  ],
  subtotal: 2800,
  discountVal: 100,
  total: 2700,
  payments: [{ method: 'Cash', amount: 2700 }]
};

export const generateBillPreviewHTML = (billConfig: BillConfig, property: PropertySettings, realOrder?: any): string => {
  const order = realOrder || sampleOrder;
  const styles = billConfig.printStyles;
  const sections = billConfig.receiptSections || [];

  const renderSeparator = (section: any) => {
    const char = section.config?.char || '-';
    const style = section.config?.style || 'dashed';
    const spacing = section.config?.spacing || '5px';
    
    if (style === 'solid') {
      return `<div style="border-top: 1px solid #000; margin: ${spacing} 0;"></div>`;
    } else if (style === 'double') {
      return `<div style="border-top: 1px solid #000; border-bottom: 1px solid #000; height: 2px; margin: ${spacing} 0;"></div>`;
    } else {
      // Dashed or custom char
      return `<div style="text-align: center; overflow: hidden; white-space: nowrap; margin: ${spacing} 0; font-family: monospace; font-size: 12px; letter-spacing: 1px;">
        ${char.repeat(40)}
      </div>`;
    }
  };

  const renderSection = (section: any) => {
    if (!section.show) return '';

    switch (section.type) {
      case 'header':
        return `
          <div style="text-align: center; margin-bottom: 10px;">
            ${billConfig.printLogo && property.logo ? `
              <div style="margin-bottom: 10px;">
                <img src="${property.logo}" style="width: ${billConfig.logoWidth}px; height: auto;" />
              </div>
            ` : ''}
            ${billConfig.printPropInfo ? `
              <div style="${getStyle(styles.restaurantName)}">${property.name}</div>
              <div style="${getStyle(styles.restaurantAddr)}">${property.address}</div>
              <div style="${getStyle(styles.restaurantPhone)}">${property.phone}</div>
            ` : ''}
          </div>
        `;

      case 'divider':
        return renderSeparator(section);

      case 'meta':
        return `
          <div style="padding: 5px 0;">
            ${billConfig.printInvoiceNo ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="${getStyle(styles.orderHeading)}">Order #:</span>
                <span style="${getStyle(styles.orderValue)}">${order.id}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="${getStyle(styles.tableHeading)}">Table:</span>
              <span style="${getStyle(styles.tableValue)}">${order.table}</span>
            </div>
            ${billConfig.printStartTime ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="${getStyle(styles.dateHeading)}">Date:</span>
                <span style="${getStyle(styles.dateValue)}">${new Date(order.startTime).toLocaleDateString()}</span>
              </div>
            ` : ''}
            ${billConfig.printPrintTime ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="${getStyle(styles.timeHeading)}">Time:</span>
                <span style="${getStyle(styles.timeValue)}">${new Date().toLocaleTimeString()}</span>
              </div>
            ` : ''}
            ${billConfig.printWaiter ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="${getStyle(styles.serverHeading)}">Server:</span>
                <span style="${getStyle(styles.serverValue)}">${order.waiter}</span>
              </div>
            ` : ''}
            ${billConfig.printCashier ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="${getStyle(styles.cashierHeading)}">Cashier:</span>
                <span style="${getStyle(styles.cashierValue)}">${order.cashier}</span>
              </div>
            ` : ''}
          </div>
        `;

      case 'customer':
        return billConfig.printCustomer && order.customer?.name ? `
          <div style="margin-bottom: 10px; padding-bottom: 5px;">
            <div style="font-weight: bold; font-size: 12px;">Customer:</div>
            <div style="font-size: 11px;">${order.customer?.name || ''} - ${order.customer?.phone || ''}</div>
            <div style="font-size: 11px;">${order.customer?.address || ''}</div>
          </div>
        ` : '';

      case 'items':
        return `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left; ${getStyle(styles.itemName)}">Item</th>
                <th style="text-align: center; ${getStyle(styles.itemQty)}">Qty</th>
                <th style="text-align: right; ${getStyle(styles.itemPrice)}">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td style="${getStyle(styles.itemName)}">${item.type === 'deal' ? '🔥 ' : ''}${item.name}</td>
                  <td style="text-align: center; ${getStyle(styles.itemQty)}">${item.qty}</td>
                  <td style="text-align: right; ${getStyle(styles.itemPrice)}">${item.total}</td>
                </tr>
                ${item.type === 'deal' ? item.children?.map((child: any) => `
                  <tr>
                    <td colspan="3" style="padding-left: 15px; font-size: 10px; color: #666; font-style: italic;">
                      ↳ ${child.name} x${child.qty}
                    </td>
                  </tr>
                `).join('') : ''}
                ${item.modifiers?.map((mod: any) => `
                  <tr>
                    <td colspan="3" style="padding-left: 10px; font-size: 11px; color: #555;">
                      ▸ ${mod.optionName} ${mod.price > 0 ? `(+${mod.price})` : ''}
                    </td>
                  </tr>
                `).join('') || ''}
              `).join('')}
            </tbody>
          </table>
        `;

      case 'totals':
        return billConfig.printBreakdown ? `
          <div style="padding-top: 5px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; ${getStyle(styles.subtotal)}">
              <span>Subtotal:</span>
              <span>${order.subtotal || 0}</span>
            </div>
            ${(order.discountVal || order.discount || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; ${getStyle(styles.discount)}">
                <span>Discount:</span>
                <span>-${order.discountVal || order.discount || 0}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 5px; padding: 5px; background: #eee; ${getStyle(styles.grandTotal)}">
              <span>TOTAL:</span>
              <span>${order.total || 0}</span>
            </div>
          </div>
        ` : '';

      case 'payments':
        return billConfig.printPayments && order.payments ? `
          <div style="margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 12px; border-bottom: 1px solid #000; margin-bottom: 3px;">Payments:</div>
            ${order.payments.map((p: any) => `
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>${p.method}:</span>
                <span>${p.amount}</span>
              </div>
            `).join('')}
          </div>
        ` : '';

      case 'footer':
        return `
          <div style="text-align: center; margin-top: 10px; ${getStyle(styles.footer)}">
            ${(billConfig.customFooter || '').replace(/\n/g, '<br>')}
          </div>
        `;

      case 'custom':
        return `
          <div style="text-align: center; margin: 10px 0; font-size: 12px;">
            ${(section.config?.text || '').replace(/\n/g, '<br>')}
          </div>
        `;

      case 'qrcode':
        return `
          <div style="text-align: center; margin: 15px 0;">
            <div style="display: inline-block; padding: 5px; background: white; border: 1px solid #eee;">
              <div style="width: 100px; height: 100px; background: #333; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
                QR CODE<br>${section.config?.value || 'https://pos.com'}
              </div>
            </div>
            ${section.config?.label ? `<div style="font-size: 10px; margin-top: 5px;">${section.config.label}</div>` : ''}
          </div>
        `;

      case 'barcode':
        return `
          <div style="text-align: center; margin: 15px 0;">
            <div style="width: 150px; height: 40px; background: #333; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
              BARCODE: ${section.config?.value || order.id}
            </div>
            ${section.config?.label ? `<div style="font-size: 10px; margin-top: 5px;">${section.config.label}</div>` : ''}
          </div>
        `;

      default:
        return '';
    }
  };

  // Fallback if no sections defined
  if (sections.length === 0) {
    return `
      <div style="width: 100%; margin: 0 auto; background: white; color: black; padding: 10px; box-sizing: border-box;">
        <div style="text-align: center; color: #999; font-style: italic; padding: 40px 0;">
          No layout sections defined.
        </div>
      </div>
    `;
  }

  return `
    <div style="width: 100%; margin: 0 auto; background: white; color: black; padding: 10px; box-sizing: border-box; font-family: Inter, sans-serif;">
      ${sections.map(section => renderSection(section)).join('')}
    </div>
  `;
};

export const generateKOTPreviewHTML = (kotConfig: KOTConfig, property: PropertySettings, realOrder?: any): string => {
  const order = realOrder || sampleOrder;
  const styles = kotConfig.printStyles;

  return `
    <div style="width: 100%; margin: 0 auto; background: white; color: black; padding: 10px; box-sizing: border-box; font-family: Inter, sans-serif;">
      <div style="text-align: center; font-weight: bold; font-size: 18px; border-bottom: 2px solid #000; margin-bottom: 10px; padding-bottom: 5px;">
        *** KITCHEN ORDER TICKET ***
      </div>

      ${kotConfig.printLogo && property.logo ? `
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="${property.logo}" style="width: ${kotConfig.logoWidth}px; height: auto;" />
        </div>
      ` : ''}

      <div style="margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px dashed #000;">
        <div style="display: flex; justify-content: space-between;">
          <span style="${getStyle(styles.orderHeading)}">Order #:</span>
          <span style="${getStyle(styles.orderValue)}">${order.id || 'TEMP'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="${getStyle(styles.tableHeading)}">Table:</span>
          <span style="${getStyle(styles.tableValue)}">${order.table || 'N/A'}</span>
        </div>
        ${kotConfig.printWaiter ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="${getStyle(styles.serverHeading)}">Server:</span>
            <span style="${getStyle(styles.serverValue)}">${order.waiter || 'Staff'}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span style="${getStyle(styles.timeHeading)}">Time:</span>
          <span style="${getStyle(styles.timeValue)}">${new Date(order.startTime || Date.now()).toLocaleTimeString()}</span>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; ${getStyle(styles.itemName)}">Item</th>
            <th style="text-align: right; ${getStyle(styles.itemQty)}">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || []).map((item: any) => `
            <tr>
              <td style="${getStyle(styles.itemName)}">${item.type === 'deal' ? '🔥 ' : ''}${item.name}</td>
              <td style="text-align: right; font-weight: bold; font-size: 18px; ${getStyle(styles.itemQty)}">${item.qty}</td>
            </tr>
            ${item.type === 'deal' ? item.children?.map((child: any) => `
              <tr>
                <td colspan="2" style="padding-left: 15px; font-size: 14px; font-weight: bold; color: #333;">
                  ↳ ${child.name} x${child.qty * item.qty}
                </td>
              </tr>
            `).join('') : ''}
            ${item.modifiers?.map((mod: any) => `
              <tr>
                <td colspan="2" style="padding-left: 10px; font-size: 12px; font-weight: bold;">
                  ▸ ${mod.optionName}
                </td>
              </tr>
            `).join('') || ''}
            ${item.itemNote ? `
              <tr>
                <td colspan="2" style="padding-left: 10px; font-size: 11px; font-style: italic; color: #d00;">
                  Note: ${item.itemNote}
                </td>
              </tr>
            ` : ''}
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; ${getStyle(styles.footer)}">
        ${(kotConfig.customFooter || '').replace(/\n/g, '<br>')}
      </div>
    </div>
  `;
};

export const generateSplitBillPortionHTML = (billConfig: BillConfig, property: PropertySettings, order: Order, portion: SplitPortion, portionIndex: number, totalPortions: number): string => {
  const styles = billConfig.printStyles;
  const portionTotal = portion.customAmount || portion.items.reduce((acc, i) => acc + i.itemTotal, 0);

  return `
    <div style="width: 100%; max-width: 300px; margin: 0 auto; background: white; color: black; padding: 10px; box-sizing: border-box; font-family: Inter, sans-serif;">
      ${billConfig.printPropInfo ? `
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="${getStyle(styles.restaurantName)}">${property.name}</div>
          <div style="${getStyle(styles.restaurantAddr)}">${property.address}</div>
          <div style="${getStyle(styles.restaurantPhone)}">${property.phone}</div>
        </div>
      ` : ''}

      <div style="text-align: center; border: 1px solid #000; padding: 5px; margin-bottom: 10px; font-weight: bold; font-size: 14px;">
        SPLIT BILL — Part ${portionIndex} of ${totalPortions}
      </div>

      <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span>Order #:</span>
          <span>${order.id}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span>Table:</span>
          <span>${order.table}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span>Portion:</span>
          <span>${portion.label}</span>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; font-size: 11px;">Item</th>
            <th style="text-align: center; font-size: 11px;">Qty</th>
            <th style="text-align: right; font-size: 11px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${portion.items.length > 0 ? portion.items.map(item => `
            <tr>
              <td style="font-size: 11px; padding: 2px 0;">${item.itemName}</td>
              <td style="text-align: center; font-size: 11px;">${item.qty}</td>
              <td style="text-align: right; font-size: 11px;">${item.itemTotal.toLocaleString()}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="3" style="font-size: 11px; padding: 10px 0; text-align: center;">Custom Portion Amount</td>
            </tr>
          `}
        </tbody>
      </table>

      <div style="border-top: 1px solid #000; padding-top: 5px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
          <span>Portion Total:</span>
          <span>PKR ${portionTotal.toLocaleString()}</span>
        </div>
      </div>

      ${portion.payments.length > 0 ? `
        <div style="border-top: 1px dashed #000; padding-top: 5px;">
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">Payments:</div>
          ${portion.payments.map(p => `
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>${p.method}:</span>
              <span>PKR ${p.amount.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px solid #000; padding-top: 10px;">
        Thank you for visiting ${property.name}!
      </div>
    </div>
  `;
};

export const generateSplitBillSummaryHTML = (billConfig: BillConfig, property: PropertySettings, order: Order, splits: SplitPortion[]): string => {
  const styles = billConfig.printStyles;

  return `
    <div style="width: 100%; max-width: 300px; margin: 0 auto; background: white; color: black; padding: 10px; box-sizing: border-box; font-family: Inter, sans-serif;">
      ${billConfig.printPropInfo ? `
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="${getStyle(styles.restaurantName)}">${property.name}</div>
          <div style="${getStyle(styles.restaurantAddr)}">${property.address}</div>
          <div style="${getStyle(styles.restaurantPhone)}">${property.phone}</div>
        </div>
      ` : ''}

      <div style="text-align: center; border: 1px solid #000; padding: 5px; margin-bottom: 10px; font-weight: bold; font-size: 14px;">
        SPLIT BILL SUMMARY
      </div>

      <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span>Order #:</span>
          <span>${order.id}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span>Table:</span>
          <span>${order.table}</span>
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        ${splits.map((portion, idx) => {
          const total = portion.customAmount || portion.items.reduce((acc, i) => acc + i.itemTotal, 0);
          return `
            <div style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px;">
                <span>Portion ${idx + 1}: ${portion.label}</span>
                <span>PKR ${total.toLocaleString()}</span>
              </div>
              ${portion.payments.map(p => `
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666;">
                  <span>- ${p.method}</span>
                  <span>PKR ${p.amount.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>

      <div style="border-top: 2px solid #000; padding-top: 5px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
          <span>GRAND TOTAL:</span>
          <span>PKR ${order.total.toLocaleString()}</span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px solid #000; padding-top: 10px;">
        Thank you for visiting ${property.name}!
      </div>
    </div>
  `;
};

export const generateAdvanceReceiptHTML = (property: PropertySettings, advance: any): string => {
  return `
    <div style="width: 100%; max-width: 300px; margin: 0 auto; background: white; color: black; padding: 10px; box-sizing: border-box; font-family: Inter, sans-serif;">
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 16px; font-weight: bold;">${property.name}</div>
        <div style="font-size: 11px;">${property.address}</div>
        <div style="font-size: 11px;">${property.phone}</div>
      </div>

      <div style="text-align: center; border: 1px solid #000; padding: 5px; margin-bottom: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase;">
        Advance Payment Receipt
      </div>

      <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Receipt #:</span>
          <span>${advance.id}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Date:</span>
          <span>${new Date(advance.createdAt).toLocaleDateString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Time:</span>
          <span>${new Date(advance.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">Client Details:</div>
        <div style="font-size: 11px;">Name: ${advance.clientName}</div>
        <div style="font-size: 11px;">Phone: ${advance.clientPhone}</div>
      </div>

      <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
          <span>Deposit Type:</span>
          <span style="font-weight: bold; text-transform: uppercase;">${advance.type}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
          <span>Amount Paid:</span>
          <span>Rs. ${advance.amount.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 5px;">
          <span>Payment Method:</span>
          <span>${advance.paymentMethod}</span>
        </div>
      </div>

      ${advance.referenceNote ? `
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold; font-size: 11px;">Reference Note:</div>
          <div style="font-size: 11px; font-style: italic;">${advance.referenceNote}</div>
        </div>
      ` : ''}

      ${advance.expiryDate ? `
        <div style="margin-bottom: 10px; color: #d00;">
          <div style="font-weight: bold; font-size: 11px;">Expiry Date:</div>
          <div style="font-size: 11px;">${new Date(advance.expiryDate).toLocaleDateString()}</div>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px solid #000; padding-top: 10px;">
        This is a deposit receipt. Please present this receipt at the time of final billing.
        <br><br>
        Thank you for choosing ${property.name}!
      </div>
    </div>
  `;
};

export const generateRefundReceiptHTML = (property: PropertySettings, advance: any): string => {
  return `
    <div style="width: 100%; max-width: 300px; margin: 0 auto; background: white; color: black; padding: 10px; box-sizing: border-box; font-family: Inter, sans-serif;">
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 16px; font-weight: bold;">${property.name}</div>
        <div style="font-size: 11px;">${property.address}</div>
        <div style="font-size: 11px;">${property.phone}</div>
      </div>

      <div style="text-align: center; border: 1px solid #000; padding: 5px; margin-bottom: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase; background: #eee;">
        REFUND RECEIPT
      </div>

      <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Refund #:</span>
          <span>REF-${advance.id.split('-')[1]}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Original Adv #:</span>
          <span>${advance.id}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Date:</span>
          <span>${new Date(advance.refundedAt || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">Client Details:</div>
        <div style="font-size: 11px;">Name: ${advance.clientName}</div>
        <div style="font-size: 11px;">Phone: ${advance.clientPhone}</div>
      </div>

      <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #d00;">
          <span>Refund Amount:</span>
          <span>Rs. ${advance.amount.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 5px;">
          <span>Original Method:</span>
          <span>${advance.paymentMethod}</span>
        </div>
      </div>

      ${advance.refundReason ? `
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold; font-size: 11px;">Refund Reason:</div>
          <div style="font-size: 11px; font-style: italic;">${advance.refundReason}</div>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px solid #000; padding-top: 10px;">
        The deposit amount has been successfully refunded.
        <br><br>
        Thank you for choosing ${property.name}!
      </div>
    </div>
  `;
};
