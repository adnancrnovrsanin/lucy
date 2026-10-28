import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../lib/api';

export default function OrdersScreen() {
  const { data } = useQuery({ queryKey: ['orders'], queryFn: getOrders });
  return (
    <View>
      {data?.map((order) => (
        <Link key={order.id} href={{ pathname: '/orders/[id]', params: { id: order.id } }}>
          <Text>{order.number}</Text>
        </Link>
      ))}
    </View>
  );
}
