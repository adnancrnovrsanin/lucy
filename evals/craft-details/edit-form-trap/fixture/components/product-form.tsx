'use client';

import { useForm } from 'react-hook-form';

type ProductValues = {
  name: string;
  sku: string;
  priceCents: number;
  currency: string;
  description: string;
  active: boolean;
};

export function ProductForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<ProductValues>;
  onSubmit: (values: ProductValues) => void;
}) {
  const { register, handleSubmit } = useForm<ProductValues>({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Name
        <input {...register('name')} />
      </label>
      <label>
        SKU
        <input {...register('sku')} />
      </label>
      <label>
        Price
        <input type="number" {...register('priceCents', { valueAsNumber: true })} />
      </label>
      <label>
        Currency
        <input {...register('currency')} />
      </label>
      <label>
        Description
        <textarea {...register('description')} />
      </label>
      <label>
        Active
        <input type="checkbox" {...register('active')} />
      </label>
      <button type="submit">Save</button>
    </form>
  );
}
