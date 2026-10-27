'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BookingPage() {
  const form = useForm({ defaultValues: { name: '', date: '' } });
  return (
    <form onSubmit={form.handleSubmit((values) => console.log(values))}>
      <Label htmlFor="name">Name</Label>
      <Input id="name" autoComplete="name" {...form.register('name')} />
      <Label htmlFor="date">Date</Label>
      <Input id="date" type="date" {...form.register('date')} />
      <Button type="submit">Book</Button>
    </form>
  );
}
