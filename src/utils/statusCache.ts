/**
 * Cache global pour éviter les appels répétés aux endpoints
 */
class StatusCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 secondes

  /**
   * Génère une clé de cache pour un envelope
   */
  private getCacheKey(envelopeId: string, action: string = 'status'): string {
    return `${action}_${envelopeId}`;
  }

  /**
   * Vérifie si le cache est valide
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Récupère les données du cache
   */
  get(envelopeId: string, action: string = 'status'): any | null {
    const key = this.getCacheKey(envelopeId, action);
    const cached = this.cache.get(key);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`📋 Using cached data for ${key}`);
      return cached.data;
    }
    
    return null;
  }

  /**
   * Met en cache les données
   */
  set(envelopeId: string, data: any, action: string = 'status'): void {
    const key = this.getCacheKey(envelopeId, action);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`📋 Cached data for ${key}`);
  }

  /**
   * Invalide le cache pour un envelope
   */
  invalidate(envelopeId: string, action: string = 'status'): void {
    const key = this.getCacheKey(envelopeId, action);
    this.cache.delete(key);
    console.log(`📋 Invalidated cache for ${key}`);
  }

  /**
   * Nettoie le cache expiré
   */
  cleanup(): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (!this.isCacheValid(value.timestamp)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`📋 Cleaned up expired cache for ${key}`);
    });
  }
}

export const statusCache = new StatusCache();
export default statusCache;
