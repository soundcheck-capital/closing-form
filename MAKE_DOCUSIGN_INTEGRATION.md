# Intégration DocuSign via Make.com - Documentation

## Vue d'ensemble

Cette approche utilise Make.com comme backend pour gérer toutes les opérations DocuSign, évitant ainsi les problèmes d'authentification côté frontend (erreur 403) et améliorant la sécurité.

## Architecture

### Frontend (React)
- **Service simplifié** : `makeDocuSignService.ts`
- **Composants** : `ContractStep.tsx`, `RRStep.tsx`
- **Communication** : Appels HTTP vers les webhooks Make.com

### Backend (Make.com)
- **Webhooks** : Endpoints pour les opérations DocuSign
- **Authentification** : Gestion sécurisée des tokens DocuSign
- **Logique métier** : Création d'enveloppes, vérification de statut, etc.

## Configuration

### Variables d'Environnement Frontend

```env
# DocuSign Configuration (pour référence)
REACT_APP_DOCUSIGN_CLIENT_ID=
REACT_APP_DOCUSIGN_CLIENT_SECRET=
REACT_APP_DOCUSIGN_ACCOUNT_ID=
REACT_APP_DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
REACT_APP_DOCUSIGN_REDIRECT_URI=
REACT_APP_DOCUSIGN_TEMPLATE_ID=
REACT_APP_DOCUSIGN_RR_TEMPLATE_ID=

# DocuSign Envelope IDs
REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID=

# Make.com Webhooks for DocuSign
REACT_APP_MAKE_DOCUSIGN_WEBHOOK_URL=
REACT_APP_MAKE_DOCUSIGN_STATUS_WEBHOOK_URL=
```

### Configuration Make.com

#### Webhook Principal (`REACT_APP_MAKE_DOCUSIGN_WEBHOOK_URL`)
**Actions supportées** :
- `create` : Créer une nouvelle enveloppe
- `get_signing_url` : Obtenir l'URL de signature

**Payload d'entrée** :
```json
{
  "action": "create",
  "templateId": "template_id",
  "recipientEmail": "user@example.com",
  "recipientName": "John Doe",
  "documentType": "contract" | "rr"
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "envelopeId": "envelope_id",
    "signingUrl": "https://demo.docusign.net/...",
    "status": "sent"
  }
}
```

#### Webhook de Statut (`REACT_APP_MAKE_DOCUSIGN_STATUS_WEBHOOK_URL`)
**Actions supportées** :
- `get_status` : Vérifier le statut d'une enveloppe
- `load_existing` : Charger une enveloppe existante

**Payload d'entrée** :
```json
{
  "action": "get_status",
  "envelopeId": "envelope_id"
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "envelopeId": "envelope_id",
    "status": "completed",
    "isSigned": true,
    "signedAt": "2024-01-01T12:00:00Z",
    "signingUrl": "https://demo.docusign.net/..." // si pas encore signé
  }
}
```

## Service Frontend

### makeDocuSignService.ts

```typescript
class MakeDocuSignService {
  // Créer une enveloppe
  async createEnvelope(request: DocuSignRequest): Promise<DocuSignResponse>
  
  // Obtenir le statut d'une enveloppe
  async getEnvelopeStatus(envelopeId: string): Promise<DocuSignResponse>
  
  // Obtenir l'URL de signature
  async getSigningUrl(envelopeId: string, recipientEmail: string): Promise<DocuSignResponse>
  
  // Charger une enveloppe existante
  async loadExistingEnvelope(envelopeId: string): Promise<DocuSignResponse>
}
```

### Avantages de cette approche

1. **Sécurité** : Les clés secrètes DocuSign restent côté backend
2. **Simplicité** : Pas de gestion d'authentification OAuth2 côté frontend
3. **Fiabilité** : Évite les erreurs 403 d'authentification
4. **Maintenance** : Centralisation de la logique DocuSign dans Make.com
5. **Scalabilité** : Make.com peut gérer plusieurs instances et la mise en cache

## Implémentation Make.com

### Scénario 1 : Création d'Enveloppe

```
1. Webhook → Parse JSON
2. Authentification DocuSign (OAuth2)
3. Création d'enveloppe depuis template
4. Génération URL de signature
5. Retour réponse JSON
```

### Scénario 2 : Vérification de Statut

```
1. Webhook → Parse JSON
2. Authentification DocuSign (OAuth2)
3. Récupération statut enveloppe
4. Retour réponse JSON avec statut
```

### Gestion des Erreurs

```json
{
  "success": false,
  "error": "Description de l'erreur",
  "data": null
}
```

## Composants React

### ContractStep.tsx

**Fonctionnalités** :
- Chargement automatique de l'enveloppe existante
- Création d'enveloppe si nécessaire
- Vérification périodique du statut
- Affichage de l'iframe DocuSign

**Flux** :
1. Chargement de l'enveloppe existante via `loadExistingEnvelope()`
2. Si pas d'enveloppe, création via `createEnvelope()`
3. Vérification périodique via `getEnvelopeStatus()`

### RRStep.tsx

**Fonctionnalités** :
- Création d'enveloppe RR
- Vérification périodique du statut
- Génération du numéro RR unique
- Affichage de l'iframe DocuSign

**Flux** :
1. Création d'enveloppe RR via `createEnvelope()`
2. Vérification périodique via `getEnvelopeStatus()`
3. Génération du numéro RR à la completion

## Gestion des Erreurs

### Types d'Erreurs

1. **Configuration manquante** :
   ```json
   {
     "success": false,
     "error": "Make.com DocuSign webhook URL not configured"
   }
   ```

2. **Erreur réseau** :
   ```json
   {
     "success": false,
     "error": "Make.com request failed: 500"
   }
   ```

3. **Erreur DocuSign** :
   ```json
   {
     "success": false,
     "error": "DocuSign API error: Invalid template ID"
   }
   ```

### Gestion Frontend

```typescript
try {
  const result = await makeDocuSignService.createEnvelope(request);
  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }
  // Traitement du succès
} catch (error) {
  // Affichage de l'erreur à l'utilisateur
  setError(error.message);
}
```

## Tests

### Tests Unitaires

```typescript
test('should create envelope via Make.com', async () => {
  const request = {
    templateId: 'test_template',
    recipientEmail: 'test@example.com',
    recipientName: 'Test User',
    documentType: 'contract'
  };
  
  const result = await makeDocuSignService.createEnvelope(request);
  expect(result.success).toBe(true);
  expect(result.data?.envelopeId).toBeDefined();
});
```

### Tests d'Intégration

- Test de création d'enveloppe
- Test de vérification de statut
- Test de chargement d'enveloppe existante
- Test de gestion d'erreurs

## Déploiement

### Variables de Production

```env
REACT_APP_MAKE_DOCUSIGN_WEBHOOK_URL=https://hook.eu1.make.com/your_webhook_id
REACT_APP_MAKE_DOCUSIGN_STATUS_WEBHOOK_URL=https://hook.eu1.make.com/your_status_webhook_id
```

### Configuration Make.com

1. **Créer les webhooks** dans Make.com
2. **Configurer l'authentification DocuSign** dans Make.com
3. **Tester les scénarios** avec des données de test
4. **Configurer les variables d'environnement** en production

## Monitoring

### Logs Frontend

- Logs d'appels aux webhooks Make.com
- Logs d'erreurs de communication
- Logs de statut des enveloppes

### Logs Make.com

- Logs d'exécution des scénarios
- Logs d'erreurs DocuSign
- Métriques de performance

## Support

### Debug

1. **Vérifier les webhooks Make.com** :
   - URL correcte
   - Scénarios actifs
   - Logs d'exécution

2. **Vérifier la configuration** :
   - Variables d'environnement
   - Authentification DocuSign dans Make.com
   - Permissions des templates

3. **Tester les endpoints** :
   ```bash
   curl -X POST https://hook.eu1.make.com/your_webhook_id \
     -H "Content-Type: application/json" \
     -d '{"action": "create", "templateId": "test", "recipientEmail": "test@example.com"}'
   ```

### Dépannage

1. **Erreur 403 DocuSign** :
   - Vérifier l'authentification dans Make.com
   - Vérifier les permissions du compte DocuSign
   - Vérifier la validité des tokens

2. **Webhook non accessible** :
   - Vérifier l'URL du webhook
   - Vérifier la connectivité réseau
   - Vérifier les logs Make.com

3. **Enveloppe non créée** :
   - Vérifier les paramètres d'entrée
   - Vérifier la configuration du template
   - Vérifier les logs DocuSign dans Make.com

## Évolutions Futures

### Améliorations Possibles

1. **Cache** : Mise en cache des statuts d'enveloppes
2. **Retry** : Logique de retry automatique
3. **Webhooks** : Notifications en temps réel via webhooks DocuSign
4. **Analytics** : Suivi des métriques de signature

### Intégrations Supplémentaires

- Webhooks DocuSign pour les notifications
- API REST pour la gestion avancée
- Dashboard de monitoring des signatures
- Intégration avec d'autres services de signature
