import { z } from 'zod';

export const Customer = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

export const Order = z.object({
  id: z.string(),
  customerId: z.string(),
  number: z.string(),
  totalCents: z.number(),
  currency: z.string(),
  placedAt: z.string(),
});

export const Invoice = z.object({
  id: z.string(),
  customerId: z.string(),
  number: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'void']),
  dueOn: z.string(),
});

export const Contact = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
});

export const Ticket = z.object({
  id: z.string(),
  customerId: z.string(),
  subject: z.string(),
  status: z.enum(['open', 'pending', 'closed']),
  openedAt: z.string(),
});

export type Customer = z.infer<typeof Customer>;
export type Order = z.infer<typeof Order>;
export type Invoice = z.infer<typeof Invoice>;
export type Contact = z.infer<typeof Contact>;
export type Ticket = z.infer<typeof Ticket>;
