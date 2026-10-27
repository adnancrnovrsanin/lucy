import * as React from 'react';

export function Combobox(props: React.ComponentProps<'div'>) {
  return <div data-slot="combobox" {...props} />;
}

export function ComboboxInput(props: React.ComponentProps<'input'>) {
  return <input data-slot="combobox-input" {...props} />;
}

export function ComboboxContent(props: React.ComponentProps<'div'>) {
  return <div data-slot="combobox-content" {...props} />;
}

export function ComboboxItem(props: React.ComponentProps<'div'>) {
  return <div data-slot="combobox-item" {...props} />;
}

export function ComboboxEmpty(props: React.ComponentProps<'div'>) {
  return <div data-slot="combobox-empty" {...props} />;
}

export function ComboboxList(props: React.ComponentProps<'div'>) {
  return <div data-slot="combobox-list" {...props} />;
}

