// Sends a WhatsApp message to the bakery owner via CallMeBot.
// Setup: owner adds +34 644 59 71 30 to contacts and sends "I allow callmebot to send me messages".
// They receive an API key by reply. Store it in CALLMEBOT_API_KEY.
// WHATSAPP_OWNER_PHONE should be in international format without "+", e.g. 972501234567

export async function sendOwnerWhatsApp(message: string): Promise<void> {
  const phone  = process.env.WHATSAPP_OWNER_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!phone || !apiKey) return; // silently skip if not configured

  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(message)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) console.error("[WhatsApp] CallMeBot responded with", res.status);
  } catch (err) {
    console.error("[WhatsApp] Failed to send notification:", err);
  }
}

export function buildOrderMessage(params: {
  clientName: string;
  clientPhone: string;
  deliveryDate: Date;
  items: { name: string; quantity: number; priceAtPurchase: number }[];
  totalPrice: number;
}): string {
  const { clientName, clientPhone, deliveryDate, items, totalPrice } = params;

  const dateStr = new Intl.DateTimeFormat("he-IL", {
    weekday: "long", day: "numeric", month: "long",
  }).format(deliveryDate);

  const itemLines = items
    .map(i => `• ${i.name} × ${i.quantity} — ₪${(Number(i.priceAtPurchase) * i.quantity).toFixed(2)}`)
    .join("\n");

  return [
    `🥖 *הזמנה חדשה – לה-ברד*`,
    ``,
    `👤 ${clientName}`,
    `📞 ${clientPhone}`,
    `📅 *איסוף:* ${dateStr}`,
    ``,
    `🛒 *פרטי ההזמנה:*`,
    itemLines,
    ``,
    `💰 *סה"כ: ₪${totalPrice.toFixed(2)}*`,
    ``,
    `——`,
    `שימו לב,`,
    `הזמנתכם תועבר לייצור רק לאחר תשלום. נא להעביר בביט את סכום ההזמנה.`,
    `תודה, מאפיית לה-ברד`,
  ].join("\n");
}
