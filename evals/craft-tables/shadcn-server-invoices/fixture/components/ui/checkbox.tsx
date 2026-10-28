import * as React from 'react';

export function Checkbox(props: React.ComponentProps<'input'>) {
  return <input type="checkbox" data-slot="checkbox" {...props} />;
}
