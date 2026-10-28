import * as React from 'react';

export function Tooltip(props: React.ComponentProps<'span'>) {
  return <span data-slot="tooltip" {...props} />;
}
