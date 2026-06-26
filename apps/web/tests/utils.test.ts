import { cn } from '../src/lib/utils';

describe('cn', () => {
  it('merges conditional and conflicting Tailwind class names', () => {
    expect(cn('px-2 py-1', false && 'hidden', 'px-4')).toBe('py-1 px-4');
  });

  it('drops empty inputs and preserves non-conflicting classes', () => {
    expect(cn(undefined, null, '', 'grid', ['gap-2', false])).toBe(
      'grid gap-2',
    );
  });

  it('lets later Tailwind groups win across arrays and objects', () => {
    expect(
      cn(['text-sm', 'p-2'], { 'text-lg': true, hidden: false }, 'p-4'),
    ).toBe('text-lg p-4');
  });
});
