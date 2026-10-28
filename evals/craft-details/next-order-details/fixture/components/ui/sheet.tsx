import * as React from 'react';

export function Sheet(props: React.ComponentProps<'div'>) {
  return <div data-slot="sheet" {...props} />;
}

export function SheetContent(props: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-content" {...props} />;
}
