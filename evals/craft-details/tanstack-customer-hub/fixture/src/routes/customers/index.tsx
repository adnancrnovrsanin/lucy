import { Link, createFileRoute } from '@tanstack/react-router';
import type { Customer } from '../../api/schema';

async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch('/api/customers');
  if (!res.ok) throw new Error('Could not load customers');
  return res.json();
}

export const Route = createFileRoute('/customers/')({
  loader: fetchCustomers,
  component: CustomersPage,
});

function CustomersPage() {
  const customers = Route.useLoaderData();
  return (
    <main>
      <h1>Customers</h1>
      <ul>
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link to="/customers/$customerId" params={{ customerId: customer.id }}>
              {customer.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
