# Architecture du Projet Closing Form

## Vue d'ensemble

Ce projet utilise la même architecture que le projet `origination-form` avec des principes d'authentification et de soumission robustes.

## Structure des Composants

### Guards et Protection

1. **PasswordProtection** - Protection par mot de passe
2. **ProtectedRoute** - Vérification de l'authentification
3. **FormSubmissionGuard** - Vérification du statut de soumission

### Services

1. **submissionService** - Gestion de la soumission via Make.com
2. **googleDriveService** - Upload des fichiers vers Google Drive

### Hooks

1. **useSubmissionStatus** - Hook pour vérifier le statut de soumission
2. **useGoogleDriveUpload** - Hook pour l'upload des fichiers

## Flux d'Authentification

```
1. PasswordProtection (mot de passe)
   ↓
2. ProtectedRoute (vérification auth)
   ↓
3. FormSubmissionGuard (vérification statut soumission)
   ↓
4. MultiStepForm (formulaire principal)
```

## Gestion de la Soumission

### Vérification du Statut
- Le `FormSubmissionGuard` vérifie via `submissionService` si le formulaire a déjà été soumis
- Utilise un webhook Make.com pour vérifier le statut
- Redirige vers `/submit-success` si déjà soumis

### Sauvegarde des Données
- Sauvegarde automatique dans `localStorage` à chaque modification
- Clé: `closingFormData`
- Inclut: `formData`, `diligenceInfo`, `currentStep`

### Soumission
- Marque le formulaire comme soumis localement
- Notifie le backend via `submissionService.markAsSubmitted()`
- Sauvegarde les données finales

## Configuration

### Variables d'Environnement Requises

```env
# Webhook URLs Make.com
REACT_APP_WEBHOOK_URL=
REACT_APP_WEBHOOK_URL_FILES=
REACT_APP_SUBMISSION_STATUS_WEBHOOK=

# HubSpot Configuration
REACT_APP_HUBSPOT_DEAL_ID=

# Google Drive API
REACT_APP_GOOGLE_CLIENT_ID=
REACT_APP_GOOGLE_API_KEY=

# Protection
REACT_APP_FORM_PASSWORD=

# Développement
REACT_APP_DISABLE_FORM_GUARD=false
```

## Redux Store

### Auth Slice
- Gestion de l'authentification utilisateur
- Token management
- Applications list

### Form Slice
- État du formulaire
- Sauvegarde automatique
- Gestion de la soumission
- Synchronisation avec le backend

## Développement

### Mode Debug
- Logs détaillés en mode développement
- Possibilité de contourner le guard avec `localStorage.setItem('DEV_ALLOW_FORM_ACCESS', 'true')`

### Tests
- Désactiver le guard avec `REACT_APP_DISABLE_FORM_GUARD=true`

## Sécurité

1. **Protection par mot de passe** - Accès initial
2. **Vérification backend** - Statut de soumission vérifié côté serveur
3. **Sauvegarde locale** - Données persistantes en cas de problème réseau
4. **Redirection automatique** - Empêche la soumission multiple

## Intégration Make.com

Le service `submissionService` communique avec Make.com pour :
- Vérifier si le formulaire a déjà été soumis
- Notifier la soumission du formulaire
- Synchroniser l'état entre frontend et backend
