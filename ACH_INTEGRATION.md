# Intégration ACH Direct Debit avec Stripe Financial Connections - Documentation

## Vue d'ensemble

Le composant `ACHDirectDebitStep` utilise maintenant Stripe Financial Connections pour permettre aux utilisateurs de connecter leur compte bancaire de manière sécurisée. Cette intégration utilise l'API Stripe pour créer des mandats ACH.

## Configuration

### Variables d'Environnement Requises

```env
# ACH Direct Debit Configuration
REACT_APP_FC_SESSION_CLIENT_SECRET=your_fc_session_client_secret
REACT_APP_STRIPE_API_KEY=your_stripe_api_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Prérequis

1. **Clés API Stripe** : Les clés `FC_SESSION_CLIENT_SECRET`, `STRIPE_API_KEY` et `STRIPE_PUBLISHABLE_KEY` doivent être configurées
2. **Compte Stripe** : Un compte Stripe avec Financial Connections activé
3. **Permissions** : L'application doit avoir accès aux APIs Stripe

## Fonctionnement

### Chargement de Stripe

Le script Stripe est chargé dynamiquement :

```typescript
const loadStripe = async () => {
  const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  
  const script = document.createElement('script');
  script.src = 'https://js.stripe.com/v3/';
  script.onload = () => {
    stripeRef.current = window.Stripe(stripePublishableKey);
    setStripeLoaded(true);
  };
  document.head.appendChild(script);
};
```

### Financial Connections

L'intégration utilise `stripe.collectFinancialConnectionsAccounts()` :

```typescript
const result = await stripe.collectFinancialConnectionsAccounts({
  clientSecret: fcSessionClientSecret,
});
```

## Interface Utilisateur

### États Visuels

1. **Chargement** :
   ```
   [Spinner] Loading ACH mandate form...
   ```

2. **Iframe chargée** :
   - Formulaire ACH intégré dans l'iframe
   - Sandbox sécurisé activé

3. **Erreur de chargement** :
   - Message d'erreur explicite
   - Bouton de retry

4. **Autorisation complétée** :
   - Message de succès avec date
   - Affichage du Mandate ID
   - Bouton de reset

### Sécurité de l'Iframe

```html
<iframe
  src={iframeUrl}
  sandbox="allow-scripts allow-forms allow-same-origin allow-top-navigation"
  title="ACH Direct Debit Mandate"
/>
```

**Permissions sandbox** :
- `allow-scripts` : Permet l'exécution de JavaScript
- `allow-forms` : Permet la soumission de formulaires
- `allow-same-origin` : Permet l'accès au même domaine
- `allow-top-navigation` : Permet la navigation vers d'autres pages

## Gestion des Données

### Interface ACHData

```typescript
interface ACHData {
  isVerified?: boolean;        // Statut de vérification
  verifiedAt?: string;         // Date de vérification
  mandateId?: string;         // ID du mandat ACH
  status?: string;           // Statut du mandat
}
```

### Callback onACHChange

```typescript
onACHChange?: (data: ACHData) => void;
```

**Exemple d'utilisation** :
```typescript
onACHChange({
  isVerified: true,
  verifiedAt: new Date().toISOString(),
  mandateId: 'mandate_1234567890',
  status: 'completed'
});
```

## Gestion des Erreurs

### Types d'Erreurs

1. **Configuration manquante** :
   ```
   Error: ACH configuration is missing. Please check environment variables.
   ```

2. **Échec de chargement** :
   ```
   Error: Failed to load ACH mandate form. Please try again.
   ```

3. **Iframe non disponible** :
   - Affichage d'un message d'erreur
   - Bouton de retry pour recharger la page

### Fallback

En cas d'erreur, l'utilisateur peut :
- Voir le message d'erreur explicite
- Utiliser le bouton "Retry Loading"
- Contacter le support technique

## Actions Utilisateur

### Boutons d'Action

1. **Mark as Completed** :
   - Marque l'autorisation ACH comme complétée
   - Génère un Mandate ID unique
   - Met à jour le statut

2. **Reset Authorization** :
   - Remet l'autorisation à zéro
   - Permet de recommencer le processus

3. **Retry Loading** :
   - Recharge la page en cas d'erreur
   - Tente de recharger l'iframe

## Sécurité

### Mesures de Sécurité

1. **Sandbox iframe** : Limite les permissions de l'iframe
2. **Variables d'environnement** : Stockage sécurisé des clés API
3. **Validation** : Vérification de la présence des clés requises
4. **HTTPS** : Communication sécurisée avec le service ACH

### Bonnes Pratiques

- Ne jamais exposer les clés API dans le code client
- Utiliser des variables d'environnement pour la configuration
- Implémenter des logs de sécurité
- Valider toutes les entrées utilisateur

## Tests

### Tests Unitaires

```typescript
test('should build iframe URL with environment variables', () => {
  process.env.REACT_APP_FC_SESSION_CLIENT_SECRET = 'test_secret';
  process.env.REACT_APP_STRIPE_API_KEY = 'test_key';
  
  const component = render(<ACHDirectDebitStep />);
  // Vérifier que l'URL est construite correctement
});
```

### Tests d'Intégration

- Test du chargement de l'iframe
- Test de la gestion des erreurs
- Test des callbacks
- Test de la sécurité sandbox

## Déploiement

### Variables de Production

```env
REACT_APP_FC_SESSION_CLIENT_SECRET=production_fc_session_client_secret
REACT_APP_STRIPE_API_KEY=production_stripe_api_key
```

### Configuration du Service

- S'assurer que le service ACH est déployé
- Vérifier l'accessibilité de l'URL
- Tester l'intégration complète

## Monitoring

### Logs

- Logs de chargement d'iframe
- Logs d'erreurs de configuration
- Logs de callbacks utilisateur

### Métriques

- Temps de chargement de l'iframe
- Taux de succès de chargement
- Erreurs par type

## Support

### Debug

- Vérifier la configuration des variables d'environnement
- Tester l'accessibilité du service ACH
- Vérifier les logs de chargement

### Dépannage

1. **Iframe ne se charge pas** :
   - Vérifier `REACT_APP_FC_SESSION_CLIENT_SECRET`
   - Vérifier `REACT_APP_STRIPE_API_KEY`
   - Vérifier la connectivité réseau

2. **Erreur de configuration** :
   - Vérifier la présence des variables d'environnement
   - Vérifier la validité des clés API
   - Vérifier les permissions

3. **Problèmes de sécurité** :
   - Vérifier les permissions sandbox
   - Vérifier la configuration HTTPS
   - Vérifier les logs de sécurité

## Évolutions Futures

### Améliorations Possibles

1. **Communication bidirectionnelle** : PostMessage entre iframe et parent
2. **Validation en temps réel** : Vérification du statut du mandat
3. **Retry automatique** : Nouvelle tentative en cas d'échec
4. **Analytics** : Suivi des conversions et des erreurs

### Intégrations Supplémentaires

- Webhooks pour les notifications de statut
- API REST pour la validation des mandats
- Dashboard de monitoring des autorisations ACH
