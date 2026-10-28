import Link from 'next/link';
import { getOrders } from '@/lib/api';

export default async function OrdersPage() {
  const orders = await getOrders();
  return (
    <main>
      <h1>Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/orders/${order.id}`}>{order.number}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
