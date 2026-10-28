import * as React from 'react';

export function Tabs(props: React.ComponentProps<'div'>) {
  return <div data-slot="tabs" {...props} />;
}

export function TabsList(props: React.ComponentProps<'div'>) {
  return <div role="tablist" data-slot="tabs-list" {...props} />;
}

export function TabsTrigger(props: React.ComponentProps<'button'>) {
  return <button role="tab" data-slot="tabs-trigger" {...props} />;
}

export function TabsContent(props: React.ComponentProps<'div'>) {
  return <div role="tabpanel" data-slot="tabs-content" {...props} />;
}
