import * as React from 'react';

export function RadioGroup(props: React.ComponentProps<'div'>) {
  return <div data-slot="radio-group" {...props} />;
}

export function RadioGroupItem(props: React.ComponentProps<'button'>) {
  return <button data-slot="radio-group-item" {...props} />;
}

