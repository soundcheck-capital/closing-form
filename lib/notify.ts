// "Bank account connected" goes through the n8n webhook "Closing — Bank Connected", which posts via Slack Notify
// (automation@, #origination-underwriting) like every other SoundCheck notification.
export async function notifyBankConnected(payload: {
  companyName: string;
  fullName: string;
  email: string;
  customerId: string;
  financialConnectionsAccountId: string;
}): Promise<void> {
  const url = process.env.N8N_BANK_CONNECTED_WEBHOOK_URL;
  const apiKey = process.env.N8N_WEBHOOK_API_KEY;
  if (!url || !apiKey) throw new Error('N8N_BANK_CONNECTED_WEBHOOK_URL or N8N_WEBHOOK_API_KEY is not set');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`n8n notification failed (${res.status})`);
}
