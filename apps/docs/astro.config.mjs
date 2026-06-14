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
            { label: 'Repository Map', slug: 'repo/overview' },
            { label: 'Source Boundaries', slug: 'repo/source-boundaries' },
          ],
        },
        {
          label: 'Applications',
          items: [
            { label: 'Applications Overview', slug: 'applications' },
            { label: 'CLI', slug: 'applications/cli' },
            { label: 'Backend', slug: 'applications/backend' },
            { label: 'Desktop', slug: 'applications/desktop' },
            { label: 'Web', slug: 'applications/web' },
            { label: 'Browser Auth', slug: 'applications/browser-auth' },
          ],
        },
        {
          label: 'Codex',
          items: [{ label: 'CthuCodex Plugin', slug: 'codex/cthu-codex' }],
        },
        {
          label: 'Capability Specs',
          items: [{ label: 'OpenSpec Index', slug: 'capability-specs' }],
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
