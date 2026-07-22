---
title: CthuTool Docs
description: Start here for CthuTool homelab deployment, client installation, module usage, and architecture documentation.
---

<div class="cthu-home">
  <section class="cthu-hero" aria-labelledby="cthu-home-title">
    <div class="cthu-hero-copy">
      <p class="cthu-eyebrow">Homelab toolkit documentation</p>
      <h1 id="cthu-home-title">CthuTool Docs</h1>
      <p class="cthu-lede">
        Ship a personal automation stack from one clear map. These docs cover
        homelab services, the local Agent, the CLI, browser automation, and
        Codex-facing assets.
      </p>
      <div class="cthu-actions" aria-label="Primary documentation links">
        <a class="cthu-button cthu-button-primary" href="/quick-start/">Get started</a>
        <a class="cthu-button cthu-button-secondary" href="/what-runs-where/">View topology</a>
      </div>
    </div>
    <div class="cthu-command-panel" aria-label="Quick start command preview">
      <div class="cthu-window-bar" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <pre><code>kubectl apply -f gitops/namespaces/
kubectl apply -f gitops/apps/ --recursive

curl http://&lt;homelab-backend-url&gt;/health

curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
# Windows PowerShell: irm https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.ps1 | iex
chc --help</code></pre>
    </div>
  </section>

  <section class="cthu-link-grid" aria-label="Start paths">
    <a class="cthu-card cthu-card-featured" href="/quick-start/">
      <span class="cthu-card-kicker">01</span>
      <strong>Quick Start</strong>
      <span>Deploy services, install the CLI, and verify the first working path.</span>
    </a>
    <a class="cthu-card" href="/deployment/">
      <span class="cthu-card-kicker">02</span>
      <strong>Homelab Deployment</strong>
      <span>Bootstrap Kubernetes, ArgoCD, backend resources, and rollout checks.</span>
    </a>
    <a class="cthu-card" href="/client/">
      <span class="cthu-card-kicker">03</span>
      <strong>Client Installation</strong>
      <span>Install the tray-owned local Agent and <code>chc</code> on user machines.</span>
    </a>
  </section>

  <section class="cthu-section" aria-labelledby="cthu-platform-title">
    <div class="cthu-section-heading">
      <p class="cthu-eyebrow">Platform map</p>
      <h2 id="cthu-platform-title">Know which surface owns each job.</h2>
      <p>
        The docs are organized by operating context first, then by module, so
        setup and debugging follow the same boundaries as the runtime.
      </p>
    </div>
    <div class="cthu-path-grid">
      <a href="/modules/" class="cthu-path">
        <span>Modules</span>
        <strong>Browse the product areas and source boundaries.</strong>
      </a>
      <a href="/architecture/" class="cthu-path">
        <span>Architecture</span>
        <strong>Trace backend, Agent, CLI, browser auth, and package contracts.</strong>
      </a>
      <a href="/operations/" class="cthu-path">
        <span>Operations</span>
        <strong>Keep observability, GitOps rollouts, data, and logs understandable.</strong>
      </a>
      <a href="/reference/" class="cthu-path">
        <span>Reference</span>
        <strong>Jump into commands, configuration, APIs, repository maps, and specs.</strong>
      </a>
    </div>
  </section>

  <section class="cthu-workflow" aria-labelledby="cthu-workflow-title">
    <div>
      <p class="cthu-eyebrow">Recommended flow</p>
      <h2 id="cthu-workflow-title">Read in the order you operate.</h2>
    </div>
    <ol>
      <li>
        <span>Plan the topology</span>
        Start with where the cluster, client computers, browser sessions, and
        shared APIs live.
      </li>
      <li>
        <span>Install the surfaces</span>
        Bring up backend services first, then install the Agent and CLI on user
        machines.
      </li>
      <li>
        <span>Choose a module</span>
        Move into browser automation, Codex plugin assets, or the
        package-specific references.
      </li>
    </ol>
  </section>

  <section class="cthu-local-dev" aria-labelledby="cthu-local-dev-title">
    <div>
      <p class="cthu-eyebrow">Docs development</p>
      <h2 id="cthu-local-dev-title">Run the documentation site locally.</h2>
    </div>
    <pre><code>pnpm --filter @cthutool/docs dev
pnpm --filter @cthutool/docs build
pnpm --filter @cthutool/docs validate</code></pre>
  </section>
</div>
