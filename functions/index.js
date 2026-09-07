const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

const TELEGRAM_BOT_TOKEN = defineSecret('STYLE_SAAN_TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = defineSecret('STYLE_SAAN_TELEGRAM_CHAT_ID');

function money(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function esc(value) {
  return String(value ?? '').replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c]));
}

function orderText(order) {
  const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.products) ? order.products : []);
  const lines = items.map((item, i) => {
    const name = esc(item.name || item.title || item.productName || 'Product');
    const qty = Number(item.qty ?? item.quantity ?? 1);
    const price = Number(item.price || 0);
    return `${i + 1}. ${name} × ${qty} — ${money(price * qty)} MMK`;
  });

  const customer = order.customer || {};
  const name = esc(order.customerName || customer.name || '—');
  const phone = esc(order.phone || customer.phone || '—');
  const center = esc(order.centerName || order.shopCenter || order.center || '—');
  const delivery = esc(order.delivery || order.deliveryMethod || order.method || '—');
  const payment = esc(order.payment || order.paymentType || '—');
  const address = esc(order.address || customer.address || '—');
  const note = esc(order.note || order.orderNote || '—');
  const code = esc(order.orderCode || order.code || order.id || '—');
  const total = money(order.total || order.grandTotal || order.amount || 0);

  return [
    '🛍️ <b>STYLE SAAN — NEW ORDER</b>',
    '',
    `🔖 <b>Order:</b> ${code}`,
    `👤 <b>Customer:</b> ${name}`,
    `📞 <b>Phone:</b> ${phone}`,
    `🏪 <b>Center:</b> ${center}`,
    `🚚 <b>Delivery:</b> ${delivery}`,
    `💳 <b>Payment:</b> ${payment}`,
    `📍 <b>Address:</b> ${address}`,
    '',
    '<b>🧾 Items</b>',
    ...(lines.length ? lines : ['—']),
    '',
    `💰 <b>Total:</b> ${total} MMK`,
    `📝 <b>Note:</b> ${note}`,
  ].join('\n');
}

exports.notifyNewOrder = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
    region: 'asia-southeast1',
    retry: true,
  },
  async event => {
    const order = event.data?.data();
    if (!order) return;

    const token = TELEGRAM_BOT_TOKEN.value();
    const chatId = TELEGRAM_CHAT_ID.value();
    if (!token || !chatId) {
      throw new Error('Style Saan Telegram secrets are not configured.');
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: orderText({ ...order, id: event.params.orderId }),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('Telegram sendMessage failed', { status: response.status, body });
      throw new Error(`Telegram API failed with HTTP ${response.status}`);
    }

    logger.info('Style Saan order notification sent', { orderId: event.params.orderId });
  }
);
