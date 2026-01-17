import { getCurrentUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import ProductEditForm from '@/components/admin/ProductEditForm';

export default async function EditProductPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });

  if (!product) notFound();

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">编辑产品</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          修改产品基本信息
        </p>
      </div>

      <ProductEditForm product={product} />
    </AdminShell>
  );
}
