import * as React from 'react';

export function Select(props: React.ComponentProps<'div'>) {
  return <div data-slot="select" {...props} />;
}

export function SelectTrigger(props: React.ComponentProps<'button'>) {
  return <button data-slot="select-trigger" {...props} />;
}

export function SelectValue(props: React.ComponentProps<'span'>) {
  return <span data-slot="select-value" {...props} />;
}

export function SelectContent(props: React.ComponentProps<'div'>) {
  return <div data-slot="select-content" {...props} />;
}

export function SelectItem(props: React.ComponentProps<'div'>) {
  return <div data-slot="select-item" {...props} />;
}

export function SelectGroup(props: React.ComponentProps<'div'>) {
  return <div data-slot="select-group" {...props} />;
}

