// Service pour vérifier l'état de soumission du formulaire via Make.com

class SubmissionService {
  private readonly webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.REACT_APP_IS_CLOSING_FORM_SUBMITTED_WEBHOOK || '';
  }

  /**
   * Vérifie si le formulaire a déjà été soumis
   * @returns Promise<boolean>
   */
  async checkSubmissionStatus(): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('⚠️ REACT_APP_IS_CLOSING_FORM_SUBMITTED_WEBHOOK not configured');
      return false;
    }

    try {
      console.log('🔍 Vérification du statut de soumission...');
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            hubspotDealId: process.env.REACT_APP_HUBSPOT_DEAL_ID,
        })
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📨 Submission service response:', responseText);
      
      // Si Make.com retourne "Accepted", c'est valide (code 200)
      if (responseText === "Accepted" || responseText === '"Accepted"') {
        console.log('✅ Make.com returned "Accepted" - treating as valid response');
        return false; // "Accepted" signifie que le scénario traite, pas encore soumis
      }
      
      try {
        const data = JSON.parse(responseText);
        // Utiliser la clé correcte retournée par Make.com
        const isSubmitted = data.isFormSubmitted === true || data.submitted === true;
        console.log(`📊 Form submission status: ${isSubmitted}`);
        return isSubmitted;
      } catch (parseError) {
        console.warn('⚠️ Could not parse JSON response, treating as not submitted:', responseText);
        return false; // Si on ne peut pas parser, assumer non soumis
      }

    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error);
      
      // En cas d'erreur, assumer que le formulaire n'est pas soumis
      // pour ne pas bloquer l'utilisateur par erreur
      return false;
    }
  }

  /**
   * Marquer le formulaire comme soumis (optionnel - si votre webhook le supporte)
   * @returns Promise<boolean>
   */
  async markAsSubmitted(): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('⚠️ REACT_APP_IS_CLOSING_FORM_SUBMITTED_WEBHOOK not configured');
      return true;
    }

    try {
      console.log('📝 Marquage du formulaire comme soumis...');
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_submitted',
          timestamp: new Date().toISOString()
        })
      });

      const success = response.ok;
      console.log(`📊 Mark as submitted result: ${success}`);
      return success;
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme soumis:', error);
      return false;
    }
  }
}

export const submissionService = new SubmissionService();
export default submissionService;
