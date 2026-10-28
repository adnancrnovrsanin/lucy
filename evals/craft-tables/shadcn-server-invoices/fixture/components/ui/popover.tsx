import * as React from 'react';

export function Popover(props: React.ComponentProps<'div'>) {
  return <div data-slot="popover" {...props} />;
}
