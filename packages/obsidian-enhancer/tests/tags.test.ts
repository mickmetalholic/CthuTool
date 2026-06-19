import { parseExcludedRoots } from '../src/settings';
import {
  normalizeFolderSegment,
  normalizeTag,
  toTagSegments,
} from '../src/utils/tags';

describe('obsidian enhancer tag utilities', () => {
  it('normalizes tags and folder segments for comparisons', () => {
    expect(normalizeTag('#Japanese Vocabulary / N5_Words')).toBe(
      'japanese-vocabulary/n5-words',
    );
    expect(normalizeFolderSegment('$Inbox@mobile')).toBe('inbox');
  });

  it('parses configured roots while ignoring empty values', () => {
    expect([...parseExcludedRoots(' config, Notes, ,attachments ')]).toEqual([
      'config',
      'notes',
      'attachments',
    ]);
  });

  it('splits normalized tags into non-empty path segments', () => {
    expect(toTagSegments('#Vocabulary// Core Terms ')).toEqual([
      'vocabulary',
      'core-terms',
    ]);
  });
});
