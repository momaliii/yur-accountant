import Webhook from '../models/Webhook.js';
import axios from 'axios';

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(event, data) {
  try {
    const webhooks = await Webhook.find({
      isActive: true,
      events: event,
    });

    const promises = webhooks.map(async (webhook) => {
      try {
        const payload = {
          event,
          data,
          timestamp: new Date().toISOString(),
        };

        const signature = webhook.generateSignature(payload);
        const headers = {
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'Content-Type': 'application/json',
        };

        await axios.post(webhook.url, payload, {
          headers,
          timeout: 10000, // 10 second timeout
        });

        // Update success count
        webhook.successCount += 1;
        webhook.lastTriggered = new Date();
        await webhook.save();

        return { success: true, webhookId: webhook._id };
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error.message);

        // Update failure count
        webhook.failureCount += 1;
        webhook.lastTriggered = new Date();
        await webhook.save();

        return { success: false, webhookId: webhook._id, error: error.message };
      }
    });

    return await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return [];
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(signature, payload, secret) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}
