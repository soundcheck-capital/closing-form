# Intégration DocuSign - Documentation

## Vue d'ensemble

Cette intégration permet de gérer les contrats via DocuSign directement dans l'application de clôture. Les utilisateurs peuvent signer des documents sans quitter l'interface.

## Configuration

### Variables d'Environnement Requises

```env
# DocuSign API Configuration
REACT_APP_DOCUSIGN_CLIENT_ID=your_client_id
REACT_APP_DOCUSIGN_CLIENT_SECRET=your_client_secret
REACT_APP_DOCUSIGN_ACCOUNT_ID=your_account_id
REACT_APP_DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
REACT_APP_DOCUSIGN_REDIRECT_URI=http://localhost:3000/docusign-callback
REACT_APP_DOCUSIGN_TEMPLATE_ID=your_template_id
```

### Configuration DocuSign

1. **Créer une application DocuSign** :
   - Aller sur [DocuSign Developer Center](https://developers.docusign.com/)
   - Créer une nouvelle application
   - Noter le Client ID et Client Secret

2. **Configurer les redirections** :
   - Ajouter `http://localhost:3000/docusign-callback` pour le développement
   - Ajouter votre URL de production pour la production

3. **Créer un template** :
   - Créer un template dans DocuSign
   - Noter l'ID du template
   - Configurer les champs de signature

## Architecture

### Services

#### `docusignService.ts`
Service principal pour l'interaction avec l'API DocuSign :
- Authentification OAuth2
- Création d'envelopes
- Génération d'URLs de signature
- Vérification du statut de signature

#### `useDocuSignAuth.ts`
Hook personnalisé pour gérer l'authentification :
- État d'authentification
- Initialisation du processus d'auth
- Gestion des erreurs

### Composants

#### `ContractStep.tsx`
Composant principal pour la signature de contrat :
- Initialisation du processus DocuSign
- Affichage de l'iframe DocuSign
- Vérification périodique du statut
- Gestion des états (loading, error, success)

#### `DocuSignCallback.tsx`
Page de callback pour l'authentification OAuth2 :
- Traitement du code d'autorisation
- Redirection vers le formulaire
- Gestion des erreurs d'authentification

## Flux d'Utilisation

### 1. Initialisation
```typescript
// L'utilisateur clique sur "Initialize Contract"
const handleInitializeContract = async () => {
  // Créer l'envelope DocuSign
  const envelopeId = await docusignService.createEnvelope(
    templateId,
    recipientEmail,
    recipientName
  );
  
  // Obtenir l'URL de signature
  const signingUrl = await docusignService.getSigningUrl(
    envelopeId, 
    recipientEmail
  );
};
```

### 2. Signature
```typescript
// L'utilisateur clique sur "Sign Contract"
const handleContractSign = () => {
  // Ouvrir l'URL de signature dans un nouvel onglet
  window.open(contractData.signingUrl, '_blank');
};
```

### 3. Vérification du Statut
```typescript
// Vérification automatique toutes les 30 secondes
useEffect(() => {
  const checkStatus = async () => {
    const isSigned = await docusignService.checkSignatureStatus(envelopeId);
    if (isSigned) {
      // Mettre à jour l'état local
      onContractChange({ isSigned: true, signedAt: new Date().toISOString() });
    }
  };
  
  const interval = setInterval(checkStatus, 30000);
  return () => clearInterval(interval);
}, [envelopeId]);
```

## Types TypeScript

### `ContractData`
```typescript
interface ContractData {
  envelopeId?: string;
  signingUrl?: string;
  isSigned: boolean;
  signedAt?: string;
  status?: string;
  recipientEmail?: string;
  recipientName?: string;
  error?: string;
}
```

### `EnvelopeInfo`
```typescript
interface EnvelopeInfo {
  envelopeId: string;
  status: 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  statusChangedDateTime: string;
  documentsUri: string;
  recipientsUri: string;
}
```

## Gestion des Erreurs

### Erreurs d'Authentification
- Token expiré : Renouvellement automatique
- Code d'autorisation invalide : Redirection vers l'auth
- Erreurs réseau : Affichage d'un message d'erreur

### Erreurs de Signature
- Template non trouvé : Vérification de la configuration
- Destinataire invalide : Validation des données
- Erreurs DocuSign : Affichage du message d'erreur

## Sécurité

### OAuth2 Flow
- Utilisation du flow Authorization Code
- Tokens d'accès avec expiration
- Redirection sécurisée

### Validation des Données
- Vérification des emails
- Validation des noms
- Sanitisation des entrées

## Tests

### Tests Unitaires
```typescript
// Tester la création d'envelope
test('should create envelope successfully', async () => {
  const envelopeId = await docusignService.createEnvelope(
    'template-123',
    'test@example.com',
    'Test User'
  );
  expect(envelopeId).toBeDefined();
});
```

### Tests d'Intégration
- Test du flux complet d'authentification
- Test de la création et signature d'envelope
- Test de la vérification du statut

## Déploiement

### Variables d'Environnement de Production
```env
REACT_APP_DOCUSIGN_BASE_URL=https://www.docusign.net/restapi
REACT_APP_DOCUSIGN_REDIRECT_URI=https://yourdomain.com/docusign-callback
```

### Configuration du Serveur
- HTTPS obligatoire pour la production
- Configuration CORS appropriée
- Gestion des redirections

## Monitoring

### Logs
- Logs d'authentification
- Logs de création d'envelope
- Logs de vérification de statut

### Métriques
- Taux de succès des signatures
- Temps de traitement
- Erreurs par type

## Support

### Debug
- Mode développement avec logs détaillés
- Vérification des tokens d'accès
- Test des URLs de signature

### Documentation DocuSign
- [DocuSign API Reference](https://developers.docusign.com/docs/esign-rest-api/)
- [OAuth2 Authentication](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/oauth/)
- [Embedded Signing](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/embedded/)
