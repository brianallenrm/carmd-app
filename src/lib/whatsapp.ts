import { WHATSAPP_CONFIG } from './constants';

/**
 * Sends a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(to: string, text: string) {
    if (!WHATSAPP_CONFIG.TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
        console.error("WhatsApp credentials not configured.");
        return { success: false, error: "Missing credentials" };
    }

    // Ensure phone number has international prefix (52 for Mexico if 10 digits)
    let formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
        formattedPhone = `52${formattedPhone}`;
    }

    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_CONFIG.TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedPhone,
                type: 'text',
                text: { body: text },
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("WhatsApp API Error:", data);
            return { success: false, error: data };
        }

        return { success: true, data };
    } catch (error) {
        console.error("WhatsApp Fetch Error:", error);
        return { success: false, error };
    }
}
