import { cn } from '../src/lib/utils';

describe('cn', () => {
  it('joins conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('rounded px-2', false && 'hidden', 'px-4')).toBe('rounded px-4');
  });

  it('handles arrays, objects, empty inputs, and later Tailwind overrides', () => {
    expect(
      cn(
        undefined,
        null,
        ['flex', ['items-start']],
        { hidden: false, 'text-sm': true },
        'text-lg',
      ),
    ).toBe('flex items-start text-lg');
  });
});
