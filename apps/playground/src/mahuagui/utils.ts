import { PREFIX } from './constants';

function _getComicUrl(id: string) {
  return `${PREFIX}/comic/${id}/`;
}

export function getUrl(id: string, chapterId?: string, pageNum?: number) {
  if (chapterId) {
    return `${_getComicUrl(id)}${chapterId}.html${pageNum ? `#p=${pageNum}` : ''}`
  }
  return _getComicUrl(id);
}

export function resolveUrl(url: string) {
  return `${PREFIX}${url}`;
}
