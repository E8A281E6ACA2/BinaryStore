import ProductForm from '@/components/admin/ProductForm';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">新建产品</h1>
      <div className="mt-4">
        <ProductForm />
      </div>
    </div>
  );
}
