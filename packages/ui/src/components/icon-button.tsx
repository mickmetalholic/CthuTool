import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';

type IconButtonProps = Omit<ButtonProps, 'size'> & {
  size?: 'icon' | 'sm';
};

function IconButton({
  'aria-label': ariaLabel,
  className,
  size = 'icon',
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={ariaLabel}
      className={cn(
        'rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        className,
      )}
      data-slot="icon-button"
      size={size}
      type="button"
      variant={variant}
      {...props}
    />
  );
}

export type { IconButtonProps };
export { IconButton };
