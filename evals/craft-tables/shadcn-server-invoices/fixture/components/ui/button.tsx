import * as React from 'react';

export function Button(props: React.ComponentProps<'button'>) {
  return <button data-slot="button" {...props} />;
}
