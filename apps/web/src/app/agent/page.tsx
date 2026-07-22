import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AgentConsole } from './agent-console';

export const metadata: Metadata = {
  description:
    'Manage the local CthuTool Agent through a secure loopback bridge.',
  title: 'Local Agent · CthuTool',
};

export default async function AgentPage() {
  await connection();
  return (
    <AgentConsole
      deploymentEnvironment={
        process.env.NEXT_PUBLIC_CTHUTOOL_ENVIRONMENT_ID ?? 'local'
      }
    />
  );
}
