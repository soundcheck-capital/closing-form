/**
 * Service pour communiquer avec Make.com pour les opérations DocuSign
 * Cette approche évite les problèmes d'authentification côté frontend
 */

import { statusCache } from '../utils/statusCache';

export interface DocuSignRequest {
  envelopeId?: string;
  templateId?: string;
  recipientEmail?: string;
  recipientId?: string;
  clientUserId?: string;
  returnUrl?: string;
  documentType?: 'contract' | 'rr';
  action?: 'create' | 'get_status' | 'get_signing_url';
}

export interface DocuSignResponse {
  success: boolean;
  data?: {
    envelopeId?: string;
    signingUrl?: string;
    status?: string;
    isSigned?: boolean;
    signedAt?: string;
    recipientId?: string;
    error?: string;
  };
  error?: string;
}

class MakeDocuSignService {
  private makeWebhookUrl: string;
  private makeStatusWebhookUrl: string;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.makeWebhookUrl = process.env.REACT_APP_MAKE_DOCUSIGN_WEBHOOK_URL || 'https://hook.us1.make.com/oh1irr1e37pyp95c7fyofwdysonjb5mr';
    this.makeStatusWebhookUrl = process.env.REACT_APP_MAKE_DOCUSIGN_STATUS_WEBHOOK_URL || 'https://hook.us1.make.com/oh1irr1e37pyp95c7fyofwdysonjb5mr';
  }

  /**
   * Génère une clé unique pour une requête
   */
  private getRequestKey(action: string, envelopeId: string, additionalParams?: any): string {
    const params = additionalParams ? JSON.stringify(additionalParams) : '';
    return `${action}_${envelopeId}_${params}`;
  }

  /**
   * Évite les appels concurrents identiques
   */
  private async deduplicateRequest<T>(
    requestKey: string, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Si une requête identique est déjà en cours, attendre sa réponse
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Deduplicating request: ${requestKey}`);
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
   * Trigger DocuSign to create recipient view for signing via Make.com
   */
  async getRecipientView(request: DocuSignRequest): Promise<DocuSignResponse> {
    const requestKey = this.getRequestKey('get_recipient_view', request.envelopeId || '', request);
    
    return this.deduplicateRequest(requestKey, async () => {
      console.log('🚀 Starting getRecipientView with request:', request);
      
      try {
        if (!this.makeWebhookUrl) {
          throw new Error('Make.com DocuSign webhook URL not configured');
        }

        // Créer un AbortController pour gérer le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ Request timeout after 30 seconds, aborting...');
          controller.abort();
        }, 30000); // 30 secondes timeout

        const response = await fetch(this.makeWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_recipient_view',
            ...request
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('📨 Response received:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`Make.com request failed: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        console.log('📨 DocuSign service response:', responseText);
        
        // Si Make.com retourne "Accepted", c'est normal - le scénario traite en arrière-plan
        if (responseText === "Accepted" || responseText === '"Accepted"') {
          console.log('⏳ Make.com scenario is processing in background...');
          return {
            success: false,
            error: 'Please wait a moment for the document to be prepared...'
          };
        }
        
        try {
          // Clean the JSON by removing trailing commas
          const cleanedResponseText = responseText.replace(/,(\s*[}\]])/g, '$1');
          console.log('🧹 Cleaned JSON response:', cleanedResponseText);
          
          const result = JSON.parse(cleanedResponseText);
          console.log('✅ Response data:', result);
          return result;
        } catch (parseError) {
          console.error('❌ Could not parse JSON response:', responseText);
          console.error('❌ Parse error details:', parseError);
          return {
            success: false,
            error: 'Invalid response format from Make.com'
          };
        }
      } catch (error) {
        console.error('❌ Error getting recipient view:', error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }


  /**
   * Obtenir le statut d'une enveloppe DocuSign via Make.com
   * @param envelopeId L'ID de l'enveloppe DocuSign
   * @param forceRefresh Si true, ignore le cache et force un appel au webhook
   */
  async getEnvelopeStatus(envelopeId: string, forceRefresh: boolean = false): Promise<{status?: string, envelopeId?: string} | {success: false, error: string}> {
    // Vérifier le cache d'abord (sauf si forceRefresh)
    if (!forceRefresh) {
      const cachedData = statusCache.get(envelopeId, 'status');
      if (cachedData) {
        console.log('📋 Using cached status data (use forceRefresh=true to bypass)');
        return cachedData;
      }
    } else {
      // Invalider le cache si on force le refresh
      statusCache.invalidate(envelopeId, 'status');
      console.log('🔄 Force refresh: cache invalidated, calling webhook...');
    }

    const requestKey = this.getRequestKey('get_status', envelopeId);
    
    return this.deduplicateRequest(requestKey, async () => {
      console.log('🔍 getEnvelopeStatus called with envelopeId:', envelopeId);
      try {
        if (!this.makeStatusWebhookUrl) {
          console.error('❌ makeStatusWebhookUrl not configured');
          throw new Error('Make.com DocuSign status webhook URL not configured');
        }

        console.log('📡 Calling status webhook:', this.makeStatusWebhookUrl);
        
        const payload = {
          action: 'get_status',
          envelopeId
        };
        console.log('📡 Payload sent to status webhook:', payload);

        const response = await fetch(this.makeStatusWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Make.com status request failed: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('📨 Status service response:', responseText);
        
        // Si Make.com retourne "Accepted", c'est normal - le scénario traite en arrière-plan
        if (responseText === "Accepted" || responseText === '"Accepted"') {
          console.log('⏳ Make.com status scenario is processing...');
          return {
            success: false,
            error: 'Status check in progress, please try again in a moment...'
          };
        }
        
        try {
          // Clean the JSON by removing trailing commas
          const cleanedResponseText = responseText.replace(/,(\s*[}\]])/g, '$1');
          console.log('🧹 Cleaned JSON response:', cleanedResponseText);
          
          // Parser la réponse JSON
          const result = JSON.parse(cleanedResponseText);
          console.log('✅ Status response data (parsed):', result);
          console.log('🔍 Status response structure:', JSON.stringify(result, null, 2));
          console.log('🔍 Status response type:', typeof result);
          console.log('🔍 Status response is array?', Array.isArray(result));
          console.log('🔍 Status response keys:', result && typeof result === 'object' ? Object.keys(result) : 'N/A');
          
          // Vérifier si la réponse contient directement status, ou si c'est dans un objet
          let finalResult: any = result;
          
          // Si c'est un tableau, prendre le premier élément
          if (Array.isArray(result) && result.length > 0) {
            console.log('📦 Result is array, taking first element');
            finalResult = result[0];
          }
          // Si c'est un objet avec une propriété data
          else if (result && typeof result === 'object' && 'data' in result) {
            console.log('📦 Result has data property, using data');
            finalResult = result.data;
          }
          // Sinon utiliser directement le résultat
          else {
            console.log('📦 Using result directly');
            finalResult = result;
          }
          
          console.log('🔍 Final result:', finalResult);
          console.log('🔍 Final result keys:', finalResult && typeof finalResult === 'object' ? Object.keys(finalResult) : 'N/A');
          console.log('🔍 Status value:', finalResult?.status);
          console.log('🔍 EnvelopeId value:', finalResult?.envelopeId);
          console.log('🔍 isSigned value:', finalResult?.isSigned);
          
          // Mettre en cache le résultat final
          statusCache.set(envelopeId, finalResult, 'status');
          
          return finalResult;
        } catch (parseError) {
          console.error('❌ Could not parse status JSON response:', responseText);
          console.error('❌ Parse error details:', parseError);
          return {
            success: false,
            error: 'Invalid status response format from Make.com'
          };
        }
      } catch (error) {
        console.error('Error getting DocuSign status:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  /**
   * Obtenir l'URL de signature d'une enveloppe DocuSign via Make.com
   */
  async getSigningUrl(envelopeId: string, recipientEmail: string): Promise<DocuSignResponse> {
    try {
      if (!this.makeWebhookUrl) {
        throw new Error('Make.com DocuSign webhook URL not configured');
      }

      const response = await fetch(this.makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_signing_url',
          envelopeId,
          recipientEmail
        })
      });

      if (!response.ok) {
        throw new Error(`Make.com signing URL request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting DocuSign signing URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Charger une enveloppe existante via Make.com
   */
  async loadExistingEnvelope(envelopeId: string): Promise<DocuSignResponse> {
    try {
      if (!this.makeStatusWebhookUrl) {
        throw new Error('Make.com DocuSign status webhook URL not configured');
      }

      const response = await fetch(this.makeStatusWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load_existing',
          envelopeId
        })
      });

      if (!response.ok) {
        throw new Error(`Make.com load existing request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error loading existing DocuSign envelope:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const makeDocuSignService = new MakeDocuSignService();
export default makeDocuSignService;
