import * as React from 'react';

export function Table(props: React.ComponentProps<'table'>) {
  return <table data-slot="table" {...props} />;
}
export function TableHeader(props: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" {...props} />;
}
export function TableBody(props: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" {...props} />;
}
export function TableRow(props: React.ComponentProps<'tr'>) {
  return <tr data-slot="table-row" {...props} />;
}
export function TableHead(props: React.ComponentProps<'th'>) {
  return <th data-slot="table-head" {...props} />;
}
export function TableCell(props: React.ComponentProps<'td'>) {
  return <td data-slot="table-cell" {...props} />;
}
