import { getPageBlocksTree } from './src/logseq';

async function run() {
  const data = await getPageBlocksTree('66994a4c-d4b4-4548-89b9-ff7843fdefff');
  console.log(data);
}

run();
