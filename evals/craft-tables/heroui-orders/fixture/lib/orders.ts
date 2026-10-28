export type Order = {
  id: string;
  code: string;
  status: 'open' | 'shipped' | 'cancelled';
  /** Total in cents. */
  total: number;
  /** ISO 8601 timestamp. */
  placedAt: string;
};
