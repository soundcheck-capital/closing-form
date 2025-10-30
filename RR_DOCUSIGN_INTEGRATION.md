# Intégration DocuSign RR - Documentation

## Vue d'ensemble

Cette intégration permet de gérer les documents RR (Reporting and Remittance Letter) via DocuSign directement dans l'application de clôture. Les utilisateurs peuvent signer les documents RR sans quitter l'interface.

## Configuration

### Variables d'Environnement Requises

```env
# DocuSign API Configuration (partagées avec Contract)
REACT_APP_DOCUSIGN_CLIENT_ID=your_client_id
REACT_APP_DOCUSIGN_CLIENT_SECRET=your_client_secret
REACT_APP_DOCUSIGN_ACCOUNT_ID=your_account_id
REACT_APP_DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
REACT_APP_DOCUSIGN_REDIRECT_URI=http://localhost:3000/docusign-callback

# Templates DocuSign
REACT_APP_DOCUSIGN_TEMPLATE_ID=your_contract_template_id
REACT_APP_DOCUSIGN_RR_TEMPLATE_ID=your_rr_template_id
```

### Configuration DocuSign

1. **Créer un template RR** :
   - Aller sur [DocuSign Developer Center](https://developers.docusign.com/)
   - Créer un nouveau template spécifique pour RR
   - Configurer les champs de signature appropriés
   - Noter l'ID du template RR

2. **Configurer les redirections** :
   - Utiliser la même URL de callback que pour les contrats
   - `http://localhost:3000/docusign-callback` pour le développement

## Architecture

### Types TypeScript

#### `RRData`
```typescript
interface RRData {
  envelopeId?: string;
  signingUrl?: string;
  isCompleted: boolean;
  completedAt?: string;
  status?: string;
  rrNumber?: string;
  recipientEmail?: string;
  recipientName?: string;
  error?: string;
}
```

### Service DocuSign Adapté

Le service `docusignService.ts` a été étendu pour supporter les documents RR :

```typescript
// Création d'envelope avec type de document
async createEnvelope(
  templateId: string, 
  recipientEmail: string, 
  recipientName: string, 
  documentType: 'contract' | 'rr' = 'contract'
): Promise<string>
```

### Composant RRStep

#### Fonctionnalités
- ✅ Initialisation automatique du document RR DocuSign
- ✅ Affichage de l'iframe DocuSign pour signature
- ✅ Vérification périodique du statut de signature (toutes les 30s)
- ✅ Génération automatique d'un numéro RR unique
- ✅ Gestion des états (loading, error, success)
- ✅ Redirection automatique vers l'étape suivante après signature

#### Props
```typescript
interface RRStepProps {
  rrData?: RRData;
  onRRChange?: (data: RRData) => void;
  recipientEmail?: string;
  recipientName?: string;
}
```

## Flux d'Utilisation

### 1. Initialisation
```typescript
// L'utilisateur clique sur "Initialize RR"
const handleInitializeRR = async () => {
  // Créer l'envelope DocuSign pour RR
  const envelopeId = await docusignService.createEnvelope(
    rrTemplateId,
    recipientEmail,
    recipientName,
    'rr' // Type de document
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
// L'utilisateur clique sur "Sign RR"
const handleRRComplete = () => {
  // Ouvrir l'URL de signature dans un nouvel onglet
  window.open(rrData.signingUrl, '_blank');
};
```

### 3. Vérification du Statut
```typescript
// Vérification automatique toutes les 30 secondes
useEffect(() => {
  const checkStatus = async () => {
    const isCompleted = await docusignService.checkSignatureStatus(envelopeId);
    if (isCompleted) {
      onRRChange({
        ...rrData,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        rrNumber: `RR-${Date.now()}`
      });
    }
  };
  
  const interval = setInterval(checkStatus, 30000);
  return () => clearInterval(interval);
}, [envelopeId]);
```

## Différences avec ContractStep

### Template Spécifique
- Utilise `REACT_APP_DOCUSIGN_RR_TEMPLATE_ID`
- Email subject : "RR Document for Signature"
- Email blurb : "Please review and sign the RR document."

### Numéro RR
- Génération automatique d'un numéro RR unique
- Format : `RR-{timestamp}`
- Affiché dans l'interface après completion

### Interface Utilisateur
- Couleur verte pour les boutons et indicateurs
- Messages spécifiques au RR
- Notes importantes sur le processus RR

## Gestion des États

### États Visuels
1. **Non initialisé** : Bouton "Initialize RR"
2. **Initialisé** : Iframe DocuSign + bouton "Open in New Tab to Sign"
3. **En cours de vérification** : Indicateur de chargement
4. **Complété** : Message de succès + numéro RR + bouton "View RR Document"

### Gestion des Erreurs
- Erreurs d'initialisation
- Erreurs de réseau
- Erreurs de configuration (template manquant)
- Messages d'erreur utilisateur-friendly

## Intégration MultiStepForm

### État RR
```typescript
const [rrData, setRRData] = useState({
  envelopeId: '',
  signingUrl: '',
  isCompleted: false,
  completedAt: '',
  status: '',
  rrNumber: '',
  recipientEmail: '',
  recipientName: ''
});
```

### Passage des Props
```typescript
<RRStep 
  rrData={rrData}
  onRRChange={(data) => setRRData(data as typeof rrData)}
  recipientEmail={formData.formData.personalInfo.email}
  recipientName={`${formData.formData.personalInfo.firstname} ${formData.formData.personalInfo.lastname}`}
/>
```

## Sécurité

### Même niveau que ContractStep
- Authentification OAuth2
- Validation des données
- Gestion des tokens d'accès
- Redirection sécurisée

## Tests

### Tests Unitaires
```typescript
// Tester la création d'envelope RR
test('should create RR envelope successfully', async () => {
  const envelopeId = await docusignService.createEnvelope(
    'rr-template-123',
    'test@example.com',
    'Test User',
    'rr'
  );
  expect(envelopeId).toBeDefined();
});
```

### Tests d'Intégration
- Test du flux complet RR
- Test de la génération du numéro RR
- Test de la vérification du statut

## Déploiement

### Variables de Production
```env
REACT_APP_DOCUSIGN_RR_TEMPLATE_ID=your_production_rr_template_id
```

### Configuration du Template
- Créer le template RR en production
- Configurer les champs de signature
- Tester le flux complet

## Monitoring

### Logs Spécifiques
- Logs d'initialisation RR
- Logs de génération de numéro RR
- Logs de vérification de statut RR

### Métriques
- Taux de completion RR
- Temps de traitement RR
- Erreurs spécifiques RR

## Support

### Debug
- Vérifier la configuration du template RR
- Tester la génération du numéro RR
- Vérifier les logs de statut

### Documentation DocuSign
- Même ressources que ContractStep
- Focus sur les templates multiples
- Gestion des différents types de documents
