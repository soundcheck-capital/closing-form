/**
 * Service pour gérer les appels au webhook Stripe FCA
 * Récupère les données de session FCA nécessaires pour l'étape ACH
 */

export interface FCAData {
  fcsess: string;
  fcsess_client_secret: string;
  sessionId?: string;
  permissions?: string[];
  filters?: {
    countries?: string[];
    account_subcategories?: string[] | null;
  };
}

export interface FCAResponse {
  success: boolean;
  data?: FCAData;
  error?: string;
}

class StripeFCAService {
  private webhookUrl: string;
  private pendingRequest: Promise<FCAResponse> | null = null;

  constructor() {
    this.webhookUrl = process.env.REACT_APP_STRIPE_FCA_WEBHOOK || '';
  }

  /**
   * Évite les appels concurrents identiques
   */
  private async deduplicateRequest(requestFn: () => Promise<FCAResponse>): Promise<FCAResponse> {
    if (this.pendingRequest) {
      console.log('🔄 Deduplicating FCA request');
      return await this.pendingRequest;
    }

    this.pendingRequest = requestFn().finally(() => {
      this.pendingRequest = null;
    });

    return await this.pendingRequest;
  }

  /**
   * Récupère les données FCA de façon générique (sans customerId/dealId)
   * @returns Promise<FCAResponse>
   */
  async getFCAData(): Promise<FCAResponse> {
    return this.deduplicateRequest(async () => {
      try {
        if (!this.webhookUrl) {
          throw new Error('Stripe FCA webhook URL not configured');
        }

        const payload = {
          timestamp: new Date().toISOString()
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ FCA request timeout after 30 seconds, aborting...');
          controller.abort();
        }, 30000);

        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`FCA webhook request failed: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();

        if (responseText === 'Accepted' || responseText === '"Accepted"') {
          return {
            success: false,
            error: 'FCA data preparation in progress, please try again in a moment...'
          };
        }

        try {
          const cleanedResponseText = responseText.replace(/,(\s*[}\]])/g, '$1');
          const result = JSON.parse(cleanedResponseText);

          if (result.id && result.client_secret) {
            return {
              success: true,
              data: {
                fcsess: result.id,
                fcsess_client_secret: result.client_secret,
                sessionId: result.id,
                permissions: result.permissions,
                filters: result.filters
              }
            };
          }

          return {
            success: false,
            error: 'FCA response missing required fields (id, client_secret)'
          };
        } catch (parseError) {
          console.error('❌ Could not parse FCA JSON response:', parseError);
          return {
            success: false,
            error: 'Invalid FCA response format from webhook'
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }
}

export const stripeFCAService = new StripeFCAService();
export default stripeFCAService;
