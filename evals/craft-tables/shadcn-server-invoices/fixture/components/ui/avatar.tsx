import * as React from 'react';

export function Avatar(props: React.ComponentProps<'span'>) {
  return <span data-slot="avatar" {...props} />;
}
