# Documentation des Étapes du Formulaire

## Vue d'ensemble

Le formulaire de clôture est divisé en 3 étapes principales, chacune ayant son propre composant dédié :

1. **ContractStep** - Révision et signature du contrat
2. **RRRStep** - Request for Release of Rights
3. **ACHDirectDebitStep** - Autorisation ACH Direct Debit

## ContractStep

### Fonctionnalités
- Affichage du contrat dans une iframe
- Gestion de la signature du contrat
- Indicateur de statut de signature
- Bouton d'action pour signer ou voir le contrat

### Props
```typescript
interface ContractStepProps {
  contractData?: {
    contractUrl?: string;
    isSigned?: boolean;
    signedAt?: string;
  };
  onContractChange?: (data: any) => void;
}
```

### Utilisation
```tsx
<ContractStep 
  contractData={contractData}
  onContractChange={setContractData}
/>
```

## RRRStep

### Fonctionnalités
- Affichage du document RRR dans une iframe
- Gestion de la completion du RRR
- Génération automatique d'un numéro RRR
- Indicateur de statut de completion
- Notes importantes sur le processus

### Props
```typescript
interface RRRStepProps {
  rrrData?: {
    rrrUrl?: string;
    isCompleted?: boolean;
    completedAt?: string;
    rrrNumber?: string;
  };
  onRRRChange?: (data: any) => void;
}
```

### Utilisation
```tsx
<RRRStep 
  rrrData={rrrData}
  onRRRChange={setRRRData}
/>
```

## ACHDirectDebitStep

### Fonctionnalités
- Formulaire de saisie des informations bancaires
- Validation des données (numéro de compte, routing number)
- Formatage automatique des champs
- Gestion de la vérification des informations
- Avis de sécurité
- Support des comptes checking et savings

### Props
```typescript
interface ACHDirectDebitStepProps {
  achData?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountType?: 'checking' | 'savings';
    isVerified?: boolean;
    verifiedAt?: string;
  };
  onACHChange?: (data: any) => void;
}
```

### Utilisation
```tsx
<ACHDirectDebitStep 
  achData={achData}
  onACHChange={setACHData}
/>
```

## Gestion des Données

### État Local
Chaque étape maintient son propre état local dans le composant parent :

```typescript
const [contractData, setContractData] = useState({
  contractUrl: '',
  isSigned: false,
  signedAt: ''
});

const [rrrData, setRRRData] = useState({
  rrrUrl: '',
  isCompleted: false,
  completedAt: '',
  rrrNumber: ''
});

const [achData, setACHData] = useState({
  bankName: '',
  accountNumber: '',
  routingNumber: '',
  accountType: 'checking' as 'checking' | 'savings',
  isVerified: false,
  verifiedAt: ''
});
```

### Validation
- **ContractStep** : Vérification de la signature
- **RRRStep** : Vérification de la completion
- **ACHDirectDebitStep** : Validation des formats de données bancaires

### Persistance
Les données peuvent être sauvegardées dans le store Redux ou localStorage selon les besoins.

## Styling

Tous les composants utilisent Tailwind CSS avec :
- Design responsive
- États visuels (succès, erreur, chargement)
- Animations et transitions
- Icônes SVG intégrées
- Couleurs cohérentes avec le thème

## Accessibilité

- Labels appropriés pour les champs de formulaire
- Messages d'erreur clairs
- Navigation au clavier
- Contraste de couleurs approprié
- Indicateurs visuels d'état

## Tests

Chaque composant peut être testé indépendamment :
- Tests unitaires pour la logique métier
- Tests d'intégration pour les interactions
- Tests de validation des formulaires
- Tests d'accessibilité
