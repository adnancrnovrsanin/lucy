export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type OrderDto = {
  id: string;
  number: string;
  status: 'draft' | 'paid' | 'shipped' | 'cancelled';
  totalCents: number;
  currency: string;
  customerId: string;
  createdAt: string;
  notes: string | null;
};

export async function getOrders(): Promise<OrderDto[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) throw new ApiError(res.status, 'Could not load orders');
  return res.json();
}

export async function getOrder(id: string): Promise<OrderDto> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new ApiError(res.status, 'Could not load the order');
  return res.json();
}
