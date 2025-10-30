/**
 * Service pour gérer les appels au webhook Stripe FCA
 * Récupère les données de session FCA nécessaires pour l'étape ACH
 */

export interface FCAData {
  fcsess: string;
  fcsess_client_secret: string;
  sessionId?: string;
  customerId?: string;
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
  private pendingRequests: Map<string, Promise<FCAResponse>> = new Map();

  constructor() {
    this.webhookUrl = process.env.REACT_APP_STRIPE_FCA_WEBHOOK || '';
  }

  /**
   * Génère une clé unique pour une requête
   */
  private getRequestKey(customerId: string): string {
    return `fca_${customerId}`;
  }

  /**
   * Évite les appels concurrents identiques
   */
  private async deduplicateRequest(
    requestKey: string, 
    requestFn: () => Promise<FCAResponse>
  ): Promise<FCAResponse> {
    // Si une requête identique est déjà en cours, attendre sa réponse
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Deduplicating FCA request: ${requestKey}`);
      return await this.pendingRequests.get(requestKey)!;
    }

    // Créer et stocker la nouvelle requête
    const requestPromise = requestFn().finally(() => {
      // Nettoyer après completion
      this.pendingRequests.delete(requestKey);
    });

    this.pendingRequests.set(requestKey, requestPromise);
    return await requestPromise;
  }

  /**
   * Récupère les données FCA pour un customer Stripe
   * @param customerId - ID du customer Stripe
   * @returns Promise<FCAResponse>
   */
  async getFCAData(customerId: string): Promise<FCAResponse> {
    const requestKey = this.getRequestKey(customerId);
    
    return this.deduplicateRequest(requestKey, async () => {
      console.log('🚀 Starting FCA data retrieval for customer:', customerId);
      
      try {
        if (!this.webhookUrl) {
          throw new Error('Stripe FCA webhook URL not configured');
        }

        if (!customerId) {
          throw new Error('Customer ID is required');
        }

        console.log('📡 Calling FCA webhook:', this.webhookUrl);
        
        const payload = {
          customerId
        };
        console.log('📡 FCA payload sent:', payload);

        // Créer un AbortController pour gérer le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ FCA request timeout after 30 seconds, aborting...');
          controller.abort();
        }, 30000); // 30 secondes timeout

        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('📨 FCA response received:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ FCA response error:', errorText);
          throw new Error(`FCA webhook request failed: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        console.log('📨 FCA service response:', responseText);
        
        // Si Make.com retourne "Accepted", c'est normal - le scénario traite en arrière-plan
        if (responseText === "Accepted" || responseText === '"Accepted"') {
          console.log('⏳ FCA scenario is processing in background...');
          return {
            success: false,
            error: 'FCA data preparation in progress, please try again in a moment...'
          };
        }
        
        try {
          // Clean the JSON by removing trailing commas
          const cleanedResponseText = responseText.replace(/,(\s*[}\]])/g, '$1');
          console.log('🧹 Cleaned FCA JSON response:', cleanedResponseText);
          
          const result = JSON.parse(cleanedResponseText);
          console.log('✅ FCA response data:', result);
          
          // Vérifier que les données requises sont présentes
          // Les champs dans la réponse Stripe sont 'id' et 'client_secret'
          if (result.id && result.client_secret) {
            return {
              success: true,
              data: {
                fcsess: result.id,  // "fcsess_1SLPaeEbD091Xafj34jWNmfa"
                fcsess_client_secret: result.client_secret,  // "fcsess_client_secret_I2ZZrXiBvEHO8GUTGNcF7lbR"
                sessionId: result.id,
                customerId: result.account_holder?.customer,
                permissions: result.permissions,
                filters: result.filters
              }
            };
          } else {
            console.warn('⚠️ FCA response missing required fields:', result);
            console.warn('⚠️ Expected fields: id, client_secret');
            console.warn('⚠️ Available fields:', Object.keys(result));
            return {
              success: false,
              error: 'FCA response missing required fields (id, client_secret)'
            };
          }
        } catch (parseError) {
          console.error('❌ Could not parse FCA JSON response:', responseText);
          console.error('❌ Parse error details:', parseError);
          return {
            success: false,
            error: 'Invalid FCA response format from webhook'
          };
        }
      } catch (error) {
        console.error('❌ Error getting FCA data:', error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  /**
   * Récupère les données FCA en utilisant le customer ID de l'environnement
   * @returns Promise<FCAResponse>
   */
  async getFCADataFromEnv(): Promise<FCAResponse> {
    const customerId = process.env.REACT_APP_STRIPE_CUSTOMER_ID;
    
    if (!customerId) {
      return {
        success: false,
        error: 'REACT_APP_STRIPE_CUSTOMER_ID not configured'
      };
    }

    return this.getFCAData(customerId);
  }
}

export const stripeFCAService = new StripeFCAService();
export default stripeFCAService;
