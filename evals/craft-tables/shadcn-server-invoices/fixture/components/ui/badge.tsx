import * as React from 'react';

export function Badge(props: React.ComponentProps<'span'>) {
  return <span data-slot="badge" {...props} />;
}
