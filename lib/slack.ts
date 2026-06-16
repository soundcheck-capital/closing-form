import { WebClient } from '@slack/web-api';

// ponytail: lazy init to avoid build-time crash when env var isn't set
let _slack: WebClient | null = null;

export function getSlack(): WebClient {
  if (!_slack) {
    if (!process.env.SLACK_BOT_TOKEN) {
      throw new Error('SLACK_BOT_TOKEN is not set');
    }
    _slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  }
  return _slack;
}

export const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || 'C09H2RMPR9P';
