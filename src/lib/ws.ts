import {
  decodeJwtExpMs,
  getAccessToken,
  tryRefreshAccess,
} from '@/lib/api-client';

/**
 * Base WebSocket : NEXT_PUBLIC_WS_URL explicite en priorité (OBLIGATOIRE en
 * prod si l'API n'est pas sur le même hôte que le front), sinon dérivée de
 * NEXT_PUBLIC_API_URL (même hôte, chemin /ws/ servi à la racine).
 */
export function resolveWsBase(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${u.host}`;
    } catch {
      // URL invalide — on retombe sur le défaut local
    }
  }
  return 'ws://localhost:8001';
}

const EXPIRY_MARGIN_MS = 30_000;

/**
 * Access token garanti « frais » pour ouvrir un WebSocket : si le token courant
 * est absent OU expire dans moins de 30 s, on force un refresh d'abord.
 * Un token périmé passé en query param → close 4001 → boucle de reconnexion.
 */
export async function getFreshWsToken(): Promise<string | null> {
  let token = getAccessToken();
  const expMs = token ? decodeJwtExpMs(token) : null;
  const expiresSoon = expMs !== null && expMs - Date.now() <= EXPIRY_MARGIN_MS;

  if (!token || expiresSoon) {
    try {
      await tryRefreshAccess();
      token = getAccessToken();
    } catch {
      return null;
    }
  }
  return token;
}
