/**
 * Cloudflare Email Worker for My FX Partner
 *
 * This worker receives emails from Cloudflare Email Routing
 * and forwards the relevant data to the Next.js API endpoint.
 *
 * ## Setup Instructions:
 * 1. Go to Cloudflare Dashboard > Workers & Pages > Create Worker
 * 2. Paste this code
 * 3. Add Environment Variable: EMAIL_INGEST_SECRET (same as your .env)
 * 4. Add Environment Variable: API_ENDPOINT (e.g., https://your-domain.com/api/webhooks/email-inbound)
 * 5. Go to Cloudflare Dashboard > Email > Email Routing > Email Workers
 * 6. Link this worker to catch-all or specific address (import@your-domain.com)
 */

export default {
    async email(message, env, ctx) {
        // Extract email metadata
        const toAddress = message.to; // e.g., "import+uuid@domain.com"
        const fromAddress = message.from;
        const subject = message.headers.get("subject") || "";

        // Read the raw email content
        const rawEmail = await new Response(message.raw).text();

        // Simple text extraction (for plain text emails)
        // For more robust parsing, use a library like postal-mime
        let bodyText = "";
        try {
            // Try to find the plain text body in the raw email
            // This is a simplified approach - adjust based on your email format
            const textMatch = rawEmail.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\n$)/i);
            if (textMatch) {
                bodyText = textMatch[1];
            } else {
                // Fallback: use the entire raw email if no text part found
                bodyText = rawEmail;
            }
        } catch (e) {
            console.error("Failed to extract body:", e);
            bodyText = rawEmail;
        }

        // Prepare payload
        const payload = {
            to: toAddress,
            from: fromAddress,
            subject: subject,
            body: bodyText
        };

        console.log(`Processing email from ${fromAddress} to ${toAddress}`);

        // Send to Next.js API
        const apiEndpoint = env.API_ENDPOINT || "https://my-fx-partner.vercel.app/api/webhooks/email-inbound";
        const apiSecret = env.EMAIL_INGEST_SECRET;

        if (!apiSecret) {
            console.error("EMAIL_INGEST_SECRET is not set");
            return;
        }

        try {
            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-secret": apiSecret
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log("API Response:", response.status, JSON.stringify(result));

            if (!response.ok) {
                // Optionally: forward original email to an error address
                // await message.forward("errors@your-domain.com");
                console.error("API Error:", result);
            }
        } catch (error) {
            console.error("Failed to call API:", error);
        }
    }
};
