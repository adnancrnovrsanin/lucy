import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const Product = pgTable('Product', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  value: integer('value').notNull(),
  stock: integer('stock').notNull(),
});
