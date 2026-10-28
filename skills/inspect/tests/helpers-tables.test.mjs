import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSource } from '../scripts/lib/jsx.mjs';
import { isTableFile, classOf, innerSource, tableOptions, inCell } from '../scripts/lib/helpers.mjs';

const read = (code) => readSource(code);

test('isTableFile: table elements, engine imports, or a table hook', () => {
  assert.equal(isTableFile(read('const a = <Table aria-label="x"><TableBody /></Table>;')), true);
  assert.equal(isTableFile(read('import type { ColumnDef } from "@tanstack/react-table";\nexport const columns = [];')), true);
  assert.equal(isTableFile(read('const t = useReactTable({ data, columns });')), true);
  assert.equal(isTableFile(read('const a = <AgGridReact rowData={rows} />;')), true);
  assert.equal(isTableFile(read('const a = <form><Input name="a" /></form>;')), false);
});

test('classOf returns the written className', () => {
  const [el] = read('const a = <div className="text-right tabular-nums" />;').elements;
  assert.equal(classOf(el), 'text-right tabular-nums');
  const [b] = read('const a = <div className={cn("truncate", x)} />;').elements;
  assert.match(classOf(b), /truncate/);
});

test('innerSource is the source between the tags', () => {
  const source = read('const a = <TableCell>{row.amount}</TableCell>;');
  assert.equal(innerSource(source, source.elements[0]), '{row.amount}');
  const self = read('const a = <Checkbox />;');
  assert.equal(innerSource(self, self.elements[0]), '');
});

test('tableOptions finds the options object of each table hook', () => {
  const source = read('const t = useTable({ features, data, manualPagination: true });\nconst u = useReactTable(useMemo(() => ({ data, columns }), [data]));');
  const blocks = tableOptions(source);
  assert.equal(blocks.length, 2);
  assert.match(blocks[0].body, /manualPagination/);
  assert.match(blocks[1].body, /columns/);
});

test('inCell: under a cell element or inside a column cell renderer', () => {
  const cellTree = read('const a = <TableCell><span className="truncate">{name}</span></TableCell>;');
  assert.equal(inCell(cellTree, cellTree.elements[1]), true);
  const columns = read('import type { ColumnDef } from "@tanstack/react-table";\nexport const columns = [{ accessorKey: "name", header: () => <span>Name</span>, cell: ({ row }) => <span>{row.original.name}</span> }];');
  const [header, cell] = columns.elements;
  assert.equal(inCell(columns, header), false);
  assert.equal(inCell(columns, cell), true);
});
