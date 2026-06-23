import { cn } from '../src/lib/utils';

describe('cn', () => {
  it('merges conditional and conflicting Tailwind class names', () => {
    expect(cn('px-2 py-1', false && 'hidden', 'px-4')).toBe('py-1 px-4');
  });
});
