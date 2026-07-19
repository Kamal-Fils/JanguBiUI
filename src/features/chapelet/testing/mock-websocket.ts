/**
 * WebSocket contrôlable pour les tests du chapelet communautaire.
 *
 * Le `setup-tests.ts` global installe un WebSocket inerte (suffisant pour que
 * `new WebSocket(url)` ne casse pas). Ici on veut piloter le protocole du
 * `RosaryConsumer` : ouvrir, pousser une trame, couper avec un code précis.
 * À installer via `vi.stubGlobal('WebSocket', MockWebSocket)` dans un
 * `beforeEach` du fichier de test (il s'exécute après celui du setup global).
 */
/** Forme de la trame `session_state` telle que sérialisée par le consumer. */
export interface SessionStateFrame {
  type: 'session_state';
  participants: { user_email: string; joined_at: string }[];
  participant_count: number;
  current_decade: number;
  status: string;
  initiator_email: string | null;
  is_initiator: boolean;
}

export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  /** Toutes les instances créées, dans l'ordre — reflète les reconnexions. */
  static instances: MockWebSocket[] = [];

  static reset(): void {
    MockWebSocket.instances = [];
  }

  static get last(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }

  onmessage: ((event: { data: string }) => void) | null = null;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;

  readyState: number = MockWebSocket.OPEN;
  /** Trames client → serveur, brutes. */
  readonly sent: string[] = [];
  closeCalls = 0;

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closeCalls += 1;
    this.readyState = MockWebSocket.CLOSED;
  }

  // ── Pilotage depuis les tests ─────────────────────────────────────────────

  emitOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  /** Pousse une trame serveur → client (sérialisée comme le consumer). */
  emitMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  /** Pousse une trame illisible (doit être ignorée sans casser le hook). */
  emitRaw(data: string): void {
    this.onmessage?.({ data });
  }

  /**
   * Trame `session_state` — état initial adressé au seul socket qui se
   * connecte, AVANT le `participant_joined` qui annonce son arrivée au groupe.
   * Les valeurs par défaut correspondent à une session vide qu'on surcharge au
   * cas par cas, pour que chaque test ne déclare que ce qu'il éprouve.
   */
  emitSessionState(overrides: Partial<SessionStateFrame> = {}): void {
    this.emitMessage({
      type: 'session_state',
      participants: [],
      participant_count: 0,
      current_decade: 0,
      status: 'active',
      initiator_email: null,
      is_initiator: false,
      ...overrides,
    });
  }

  /** Trame `action_rejected` — refus adressé au seul socket concerné. */
  emitActionRejected(action: string, reason: string): void {
    this.emitMessage({ type: 'action_rejected', action, reason });
  }

  /** 1006 = coupure réseau, 4001 = auth, 4004 = session absente/close. */
  emitClose(code = 1006): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code });
  }

  /** Dernière trame client → serveur, désérialisée. */
  get lastSent(): Record<string, unknown> | undefined {
    const raw = this.sent[this.sent.length - 1];
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : undefined;
  }
}
