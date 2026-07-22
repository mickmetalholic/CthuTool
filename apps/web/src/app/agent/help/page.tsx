import type { Metadata } from 'next';
import { connection } from 'next/server';

export const metadata: Metadata = {
  description: 'Restore browser access to the CthuTool loopback Agent bridge.',
  title: 'Agent local network access · CthuTool',
};

export default async function AgentHelpPage() {
  await connection();
  return <AgentPermissionHelp />;
}

export function AgentPermissionHelp() {
  return (
    <main className="agent-shell agent-help">
      <header className="agent-hero">
        <div>
          <p className="eyebrow">Local network access</p>
          <h1>恢复浏览器到本机 Agent 的连接</h1>
          <p className="hero-copy">
            CthuTool Web 只访问托盘临时提供的 loopback
            地址。浏览器可能会把它作为“本地网络访问”单独询问。
          </p>
        </div>
      </header>

      <section
        className="agent-card help-steps"
        aria-labelledby="permission-steps"
      >
        <h2 id="permission-steps">处理步骤</h2>
        <ol>
          <li>确认 CthuTool Agent 与托盘仍在运行。</li>
          <li>在当前站点的浏览器权限中允许“本地网络访问”或“本地设备访问”。</li>
          <li>回到托盘，重新选择“打开设置页面”，生成新的一次性票据。</li>
          <li>如果仍失败，确认托盘当前环境和 Web 部署环境一致。</li>
        </ol>
      </section>

      <section className="agent-card">
        <p className="eyebrow">Security boundary</p>
        <h2>页面不会做什么</h2>
        <p className="card-note">
          页面不会扫描 localhost 端口，不使用 WebSocket，不保存 bearer
          token，也不会从 Web 修改 Agent 的受信环境。
        </p>
        <a className="secondary-button inline-link" href="/agent">
          返回 Agent 页面
        </a>
      </section>
    </main>
  );
}
