import { WHATSAPP_CONFIG } from './constants';

/**
 * Sends a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(to: string, text: string) {
    if (!WHATSAPP_CONFIG.TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
        console.error("WhatsApp credentials not configured.");
        return { success: false, error: "Missing credentials" };
    }

    // Ensure phone number has international prefix and remove the Mexican intercalated '1' (521... -> 52...)
    let formattedPhone = to.replace(/\D/g, '');
    
    // Clean up potential double '52' prefix (e.g. 525255...)
    if (formattedPhone.startsWith('5252') && formattedPhone.length > 12) {
        formattedPhone = formattedPhone.substring(2);
    }
    
    if (formattedPhone.length === 10) {
        formattedPhone = `52${formattedPhone}`;
    } else if (formattedPhone.startsWith('521') && formattedPhone.length === 13) {
        formattedPhone = '52' + formattedPhone.substring(3);
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
