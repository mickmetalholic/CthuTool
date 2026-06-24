import { loadBackendHealth } from '@/lib/backend-health';

export default async function Home() {
  const backendHealth = await loadBackendHealth();

  return (
    <main className="grid min-h-screen place-items-center p-8">
      <section className="max-w-xl text-center">
        <p className="text-sm font-medium text-muted-foreground">
          CthuTool Web
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal">
          Management console scaffold
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Backend status: {backendHealth.status}
        </p>
      </section>
    </main>
  );
}
