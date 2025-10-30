// Types TypeScript pour l'intégration DocuSign

export interface DocuSignConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
  accountId: string;
  templateId: string;
}

export interface EnvelopeInfo {
  envelopeId: string;
  status: 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  statusChangedDateTime: string;
  documentsUri: string;
  recipientsUri: string;
  emailSubject?: string;
  emailBlurb?: string;
}

export interface RecipientInfo {
  recipientId: string;
  name: string;
  email: string;
  status: 'sent' | 'delivered' | 'signed' | 'declined' | 'completed';
  signedDateTime?: string;
  deliveryMethod?: string;
  clientUserId?: string;
  roleName?: string;
}

export interface SigningUrlRequest {
  authenticationMethod: 'none' | 'email' | 'sms';
  email: string;
  userName: string;
  returnUrl: string;
  clientUserId?: string;
}

export interface SigningUrlResponse {
  url: string;
  tokenExpiration: string;
}

export interface EnvelopeCreationRequest {
  templateId: string;
  status: 'sent' | 'created' | 'draft';
  templateRoles: TemplateRole[];
  emailSubject?: string;
  emailBlurb?: string;
}

export interface TemplateRole {
  email: string;
  name: string;
  roleName: string;
  clientUserId?: string;
  routingOrder?: number;
}

export interface DocuSignError {
  errorCode: string;
  message: string;
}

export interface ContractData {
  envelopeId?: string;
  signingUrl?: string;
  isSigned: boolean;
  signedAt?: string;
  status?: string;
  recipientEmail?: string;
  recipientId?: string;
  error?: string;
}

export interface RRData {
  envelopeId?: string;
  signingUrl?: string;
  isCompleted: boolean;
  completedAt?: string;
  status?: string;
  rrNumber?: string;
  recipientEmail?: string;
  recipientId?: string;
  error?: string;
}

export interface DocuSignAuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  tokenExpiry?: number;
  error?: string;
}
