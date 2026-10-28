import * as React from 'react';

export function Popover(props: React.ComponentProps<'div'>) {
  return <div data-slot="popover" {...props} />;
}

export function PopoverTrigger(props: React.ComponentProps<'button'>) {
  return <button type="button" data-slot="popover-trigger" {...props} />;
}

export function PopoverContent(props: React.ComponentProps<'div'>) {
  return <div data-slot="popover-content" {...props} />;
}
