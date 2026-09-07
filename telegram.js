// telegram.js

// Telegram Configuration
const TELEGRAM_CONFIG = {
  BOT_TOKEN: '8706802717:AAEfjZHO5zeJ-710xufnBPMPw50oIRJMa2k',
  CHAT_ID: '5050699658'
};

/**
 * Order အချက်အလက်များကို Telegram သို့ စာနှင့် စလစ်ပုံ ပို့ပေးသည့် Function
 * @param {Object} orderData - Order အချက်အလက်များ
 */
export async function sendOrderToTelegram(orderData) {
  const { BOT_TOKEN, CHAT_ID } = TELEGRAM_CONFIG;

  const captionMessage = `
🛒 **Order အသစ်ဝင်လာပါသည်။**
--------------------------
👤 **အမည်:** ${orderData.customerName}
📞 **ဖုန်းနံပါတ်:** ${orderData.phone}
🏠 **လိပ်စာ:** ${orderData.address}

📦 **မှာယူသော ပစ္စည်းများ:**
${orderData.items}

💰 **စုစုပေါင်း ကျသင့်ငွေ:** ${orderData.totalAmount} Ks
--------------------------
⏰ **အချိန်:** ${new Date().toLocaleString()}
  `;

  try {
    let url;
    let payload = {
      chat_id: CHAT_ID,
      parse_mode: 'Markdown',
    };

    if (orderData.slipImageUrl) {
      url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
      payload.photo = orderData.slipImageUrl;
      payload.caption = captionMessage;
    } else {
      url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      payload.text = captionMessage;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Error sending order to Telegram:', error);
    return false;
  }
}
