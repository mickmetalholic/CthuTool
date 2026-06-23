import { cn } from '../src/lib/utils';

describe('cn', () => {
  it('joins conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('rounded px-2', false && 'hidden', 'px-4')).toBe('rounded px-4');
  });
});
