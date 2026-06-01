import { NextResponse } from 'next/server';

const SENTRY_HOST = 'o4511429080449024.ingest.de.sentry.io';
const SENTRY_PROJECT_IDS = ['4511431070253136'];

export async function POST(request: Request) {
  try {
    const envelope = await request.text();
    const firstLine = envelope.split('\n')[0];
    const header = JSON.parse(firstLine) as { dsn?: string };

    if (!header.dsn) {
      return NextResponse.json({ error: 'Missing DSN' }, { status: 400 });
    }

    const dsn = new URL(header.dsn);
    if (dsn.hostname !== SENTRY_HOST) {
      return NextResponse.json({ error: 'Invalid host' }, { status: 400 });
    }

    const projectId = dsn.pathname.replace('/', '');
    if (!SENTRY_PROJECT_IDS.includes(projectId)) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 });
    }

    const upstream = `https://${SENTRY_HOST}/api/${projectId}/envelope/`;
    const upstreamResponse = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: envelope,
    });

    return NextResponse.json({}, { status: upstreamResponse.status });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
