import * as React from 'react';

export function Command(props: React.ComponentProps<'div'>) {
  return <div data-slot="command" {...props} />;
}
