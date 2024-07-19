import type { Root } from "react-dom/client"

function Logseq() {
  return <div>Logseq</div>
}

export function renderLogseq(root: Root) {
  root.render(<Logseq />);
}
