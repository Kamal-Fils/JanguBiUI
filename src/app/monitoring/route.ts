import { NextResponse } from 'next/server';

/**
 * Tunnel Sentry (tunnelRoute '/monitoring', cf. next.config.mjs) : relaie les
 * envelopes du SDK navigateur vers Sentry (contourne les bloqueurs de pub).
 *
 * L'hôte d'ingestion ET l'ID de projet autorisés sont DÉRIVÉS du DSN
 * (NEXT_PUBLIC_SENTRY_DSN) — surtout PAS codés en dur : des constantes figées sur
 * un autre org/projet renvoyaient 400 (« Invalid host/project ») et faisaient
 * échouer toute capture client. Dériver du DSN garantit la même région/projet.
 */
function expectedTarget(): { host: string; projectId: string } | null {
  const raw = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const projectId = url.pathname.replace(/^\//, '');
    if (!url.hostname || !projectId) return null;
    return { host: url.hostname, projectId };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const target = expectedTarget();
  if (!target) {
    return NextResponse.json(
      { error: 'Sentry DSN not configured' },
      { status: 500 },
    );
  }

  try {
    const envelope = await request.text();
    const firstLine = envelope.split('\n')[0];
    const header = JSON.parse(firstLine) as { dsn?: string };

    if (!header.dsn) {
      return NextResponse.json({ error: 'Missing DSN' }, { status: 400 });
    }

    const dsn = new URL(header.dsn);
    if (dsn.hostname !== target.host) {
      return NextResponse.json({ error: 'Invalid host' }, { status: 400 });
    }

    const projectId = dsn.pathname.replace(/^\//, '');
    if (projectId !== target.projectId) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 });
    }

    const upstream = `https://${target.host}/api/${projectId}/envelope/`;
    const upstreamResponse = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: envelope,
    });

    return new NextResponse(null, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
