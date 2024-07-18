import axios from 'axios';

const service = axios.create({
  baseURL: 'http://127.0.0.1:12315',
  headers: {
    'Authorization': 'Bearer test'
  }
});

export async function getAllPages() {
  const { data } = await service.post('/api', {
    method: 'logseq.Editor.getAllPages',
    args: []
  });
  return data;
}

export async function getPage(uuid: string) {
  const { data } = await service.post('/api', {
    method: 'logseq.Editor.getPage',
    args: [
      uuid
    ]
  });
  return data;
}

export async function getPageBlocksTree(uuid: string) {
  const { data } = await service.post('/api', {
    method: 'logseq.Editor.getPageBlocksTree',
    args: [
      uuid
    ]
  });
  return data;
}
