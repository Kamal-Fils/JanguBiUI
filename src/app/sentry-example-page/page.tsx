"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Sentry — Page de test</h1>

      <button
        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        onClick={() => {
          throw new Error("Test Sentry — erreur client intentionnelle");
        }}
      >
        Déclencher une erreur client
      </button>

      <button
        className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
        onClick={async () => {
          await fetch("/api/sentry-example-api");
        }}
      >
        Déclencher une erreur serveur
      </button>

      <button
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        onClick={() => {
          Sentry.captureMessage("Test Sentry — message manuel");
          alert("Message envoyé à Sentry !");
        }}
      >
        Envoyer un message de test
      </button>
    </main>
  );
}
