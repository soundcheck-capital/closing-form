# Chargement Automatique du Contrat - Documentation

## Vue d'ensemble

Le ContractStep charge maintenant automatiquement l'enveloppe DocuSign existante au lieu de créer une nouvelle enveloppe. Cette fonctionnalité permet de récupérer un contrat pré-existant et de vérifier son statut de signature.

## Configuration

### Variable d'Environnement Requise

```env
# DocuSign Envelope ID
REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID=your_existing_envelope_id
```

### Prérequis

1. **Enveloppe DocuSign existante** : L'enveloppe doit déjà exister dans DocuSign
2. **Configuration DocuSign** : Les variables d'environnement DocuSign doivent être configurées
3. **Permissions** : L'application doit avoir accès à l'enveloppe spécifiée

## Fonctionnement

### Chargement Automatique

Au montage du composant ContractStep :

1. **Récupération de l'ID** : L'application récupère l'ID de l'enveloppe depuis `REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID`
2. **Appel DocuSign** : Récupération des informations complètes de l'enveloppe
3. **Analyse des données** : Détermination du statut de signature et des informations du destinataire
4. **Mise à jour de l'état** : Mise à jour des données du contrat avec les informations récupérées

### Informations Récupérées

```typescript
interface ContractData {
  envelopeId: string;           // ID de l'enveloppe DocuSign
  signingUrl?: string;          // URL de signature (si pas encore signé)
  isSigned: boolean;            // Statut de signature
  signedAt?: string;            // Date et heure de signature
  status: string;               // Statut DocuSign (sent, delivered, signed, completed)
  recipientEmail?: string;      // Email du destinataire
  recipientName?: string;       // Nom du destinataire
}
```

## Service DocuSign

### Nouvelle Méthode

```typescript
async getExistingEnvelopeInfo(envelopeId: string): Promise<{
  envelopeInfo: EnvelopeInfo;
  recipients: RecipientInfo[];
  signingUrl?: string;
}>
```

Cette méthode :
- Récupère les informations de l'enveloppe
- Récupère les informations des destinataires
- Génère l'URL de signature si nécessaire

## Interface Utilisateur

### États Visuels

1. **Chargement initial** :
   ```
   [Spinner] Loading Contract
   Retrieving contract information from DocuSign...
   ```

2. **Contrat chargé** :
   - Si signé : Message de succès avec date/heure de signature
   - Si non signé : Iframe DocuSign pour signature
   - Informations du contrat affichées

3. **Erreur de chargement** :
   - Message d'erreur explicite
   - Bouton de fallback pour initialisation manuelle

### Informations Affichées

- **Statut de signature** : Date et heure de signature
- **Informations du contrat** :
  - Envelope ID
  - Statut DocuSign
  - Email du destinataire
- **Actions disponibles** :
  - Signature (si non signé)
  - Visualisation (si signé)

## Gestion des Erreurs

### Types d'Erreurs

1. **Configuration manquante** :
   ```
   Error: Future Purchase Agreement DocuSign ID not configured
   ```

2. **Enveloppe non trouvée** :
   ```
   Error: Envelope not found or access denied
   ```

3. **Erreur réseau** :
   ```
   Error: Failed to load existing envelope
   ```

### Fallback

En cas d'erreur, l'utilisateur peut :
- Voir le message d'erreur explicite
- Utiliser le bouton "Try Manual Initialization"
- Contacter le support technique

## Vérification Périodique

### Statut de Signature

- **Vérification immédiate** : Au chargement du contrat
- **Vérification périodique** : Toutes les 30 secondes si non signé
- **Arrêt automatique** : Quand le contrat est signé

### Mise à Jour Automatique

```typescript
useEffect(() => {
  if (contractData?.envelopeId && !contractData.isSigned) {
    const checkStatus = async () => {
      const isSigned = await docusignService.checkSignatureStatus(envelopeId);
      if (isSigned) {
        // Mise à jour automatique de l'état
        onContractChange({ ...contractData, isSigned: true });
      }
    };
    
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }
}, [contractData?.envelopeId, contractData?.isSigned]);
```

## Sécurité

### Authentification

- Utilise le même système OAuth2 que les autres fonctionnalités DocuSign
- Vérification des permissions d'accès à l'enveloppe
- Gestion sécurisée des tokens d'accès

### Validation

- Validation de l'ID d'enveloppe
- Vérification de l'existence de l'enveloppe
- Contrôle des permissions d'accès

## Tests

### Tests Unitaires

```typescript
test('should load existing envelope successfully', async () => {
  const envelopeId = 'test-envelope-id';
  const result = await docusignService.getExistingEnvelopeInfo(envelopeId);
  
  expect(result.envelopeInfo.envelopeId).toBe(envelopeId);
  expect(result.recipients).toBeDefined();
});
```

### Tests d'Intégration

- Test du chargement automatique
- Test de la vérification périodique
- Test de la gestion des erreurs
- Test de l'interface utilisateur

## Déploiement

### Variables de Production

```env
REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID=production_envelope_id
```

### Configuration DocuSign

- S'assurer que l'enveloppe existe en production
- Vérifier les permissions d'accès
- Tester le chargement automatique

## Monitoring

### Logs

- Logs de chargement d'enveloppe
- Logs de vérification de statut
- Logs d'erreurs de chargement

### Métriques

- Temps de chargement d'enveloppe
- Taux de succès de chargement
- Erreurs par type

## Support

### Debug

- Vérifier la configuration de l'ID d'enveloppe
- Tester l'accès à l'enveloppe DocuSign
- Vérifier les logs de chargement

### Dépannage

1. **Contrat ne se charge pas** :
   - Vérifier `REACT_APP_FUTURE_PURCHASE_AGREEMENT_DOCUSIGN_ID`
   - Vérifier les permissions DocuSign
   - Vérifier la connectivité réseau

2. **Erreur d'authentification** :
   - Vérifier la configuration OAuth2
   - Vérifier les tokens d'accès
   - Vérifier les permissions de l'application

3. **Statut incorrect** :
   - Vérifier l'état de l'enveloppe dans DocuSign
   - Vérifier la logique de vérification
   - Vérifier les logs de statut
