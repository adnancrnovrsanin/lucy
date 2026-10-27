import * as React from 'react';

export function Field(props: React.ComponentProps<'div'>) {
  return <div data-slot="field" {...props} />;
}

export function FieldLabel(props: React.ComponentProps<'label'>) {
  return <label data-slot="field-label" {...props} />;
}

export function FieldDescription(props: React.ComponentProps<'p'>) {
  return <p data-slot="field-description" {...props} />;
}

export function FieldError(props: React.ComponentProps<'p'>) {
  return <p data-slot="field-error" {...props} />;
}

export function FieldGroup(props: React.ComponentProps<'div'>) {
  return <div data-slot="field-group" {...props} />;
}

export function FieldSet(props: React.ComponentProps<'fieldset'>) {
  return <fieldset data-slot="field-set" {...props} />;
}

export function FieldLegend(props: React.ComponentProps<'legend'>) {
  return <legend data-slot="field-legend" {...props} />;
}

