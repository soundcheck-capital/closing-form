// Configuration Google Drive API
const GOOGLE_DRIVE_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
  scope: 'https://www.googleapis.com/auth/drive.file',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};

interface UploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

class GoogleDriveService {
  private gapi: any = null;
  private isInitialized = false;

  // Initialiser l'API Google
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Charger l'API Google
      await this.loadGoogleAPI();
      
      // Initialiser l'API
      await new Promise((resolve, reject) => {
        (window as any).gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject
        });
      });

      // Initialiser le client
      await (window as any).gapi.client.init({
        apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
        clientId: GOOGLE_DRIVE_CONFIG.clientId,
        scope: GOOGLE_DRIVE_CONFIG.scope,
        discoveryDocs: GOOGLE_DRIVE_CONFIG.discoveryDocs
      });

      this.gapi = (window as any).gapi;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Google Drive:', error);
      return false;
    }
  }

  // Charger l'API Google
  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Impossible de charger l\'API Google'));
      document.head.appendChild(script);
    });
  }

  // Authentifier l'utilisateur (silencieusement)
  async authenticate(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      const isSignedIn = authInstance.isSignedIn.get();
      
      if (!isSignedIn) {
        // Authentification silencieuse sans popup visible
        await authInstance.signIn({ prompt: 'none' });
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      return false;
    }
  }

  // Uploader un fichier vers Google Drive
  async uploadFile(file: File, folderName: string = 'Closing Applications'): Promise<UploadResult> {
    try {
      // Authentifier l'utilisateur
      const isAuthenticated = await this.authenticate();
      if (!isAuthenticated) {
        return { success: false, error: 'Échec de l\'authentification' };
      }

      // Créer ou récupérer le dossier
      const folderId = await this.getOrCreateFolder(folderName);

      // Préparer les métadonnées du fichier
      const fileMetadata = {
        name: file.name,
        parents: [folderId]
      };

      // Créer le fichier
      const response = await this.gapi.client.drive.files.create({
        resource: fileMetadata,
        media: {
          mimeType: file.type,
          body: file
        }
      });

      const fileId = response.result.id;
      
      // Rendre le fichier accessible via le web
      await this.gapi.client.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Obtenir le lien de partage
      const fileResponse = await this.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink'
      });

      return {
        success: true,
        fileId: fileId,
        webViewLink: fileResponse.result.webViewLink
      };

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Uploader plusieurs fichiers
  async uploadFiles(files: File[], folderName: string = 'Closing Applications'): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, folderName);
      results.push(result);
    }
    
    return results;
  }

  // Créer ou récupérer un dossier
  private async getOrCreateFolder(folderName: string): Promise<string> {
    try {
      // Chercher le dossier existant
      const response = await this.gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
      }

      // Créer un nouveau dossier
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folderResponse = await this.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folderResponse.result.id;

    } catch (error) {
      console.error('Erreur lors de la création/récupération du dossier:', error);
      throw error;
    }
  }

  // Supprimer un fichier
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.gapi.client.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
export default googleDriveService; 