import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      title: 'CthuTool Docs',
      description: 'Documentation for the CthuTool monorepo.',
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Overview', slug: '' },
            { label: 'Quick Start', slug: 'quick-start' },
            { label: 'What Runs Where', slug: 'what-runs-where' },
          ],
        },
        {
          label: 'Homelab Deployment',
          items: [
            { label: 'Deployment Overview', slug: 'deployment' },
            { label: 'Homelab Setup', slug: 'deployment/homelab-setup' },
            { label: 'Configuration', slug: 'deployment/configuration' },
            {
              label: 'Upgrade and Troubleshooting',
              slug: 'deployment/upgrade-troubleshooting',
            },
          ],
        },
        {
          label: 'Client Installation',
          items: [
            { label: 'Client Overview', slug: 'client' },
            { label: 'Local Agent', slug: 'client/desktop' },
            { label: 'CLI Tool', slug: 'client/cli' },
          ],
        },
        {
          label: 'Modules',
          items: [
            { label: 'Modules Overview', slug: 'modules' },
            { label: 'CLI', slug: 'modules/cli' },
            { label: 'Local Agent', slug: 'modules/desktop' },
            { label: 'Web Console', slug: 'modules/web-console' },
            { label: 'Browser Auth', slug: 'modules/browser-auth' },
            { label: 'Browser Automation', slug: 'modules/browser-automation' },
            { label: 'Browser Client SDK', slug: 'modules/browser-client-sdk' },
            { label: 'Codex Plugin', slug: 'modules/codex-plugin' },
            { label: 'Douban Movie Info', slug: 'modules/douban-movie-info' },
            { label: 'Obsidian Enhancer', slug: 'modules/obsidian-enhancer' },
          ],
        },
        {
          label: 'Operations',
          items: [
            { label: 'Operations Overview', slug: 'operations' },
            { label: 'Observability', slug: 'operations/observability' },
            { label: 'GitOps Rollouts', slug: 'operations/gitops-rollouts' },
            { label: 'Health and Logs', slug: 'operations/health-logs' },
            { label: 'Data and Security', slug: 'operations/data-security' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'System Overview', slug: 'architecture' },
            { label: 'Topology', slug: 'architecture/topology' },
            { label: 'Backend and Web', slug: 'architecture/backend-web' },
            {
              label: 'Local Agent Runtime',
              slug: 'architecture/desktop-runtime',
            },
            { label: 'CLI Architecture', slug: 'architecture/cli' },
            { label: 'Browser Auth Model', slug: 'architecture/browser-auth' },
            { label: 'Agent Protocol', slug: 'architecture/agent-protocol' },
            { label: 'Package Map', slug: 'architecture/package-map' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Reference Overview', slug: 'reference' },
            { label: 'CLI Commands', slug: 'reference/cli' },
            { label: 'Configuration', slug: 'reference/configuration' },
            { label: 'GitOps', slug: 'reference/gitops' },
            {
              label: 'Engineering Config',
              slug: 'reference/engineering-config',
            },
            { label: 'Backend APIs', slug: 'reference/backend-apis' },
            { label: 'Repository Map', slug: 'repo/overview' },
            { label: 'Source Boundaries', slug: 'repo/source-boundaries' },
            { label: 'OpenSpec Index', slug: 'capability-specs' },
          ],
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/mickmetalholic/CthuTool',
        },
      ],
    }),
  ],
});
