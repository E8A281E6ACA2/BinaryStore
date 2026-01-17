import { getCurrentUser } from '@/lib/auth-server';
import RegisterForm from '@/components/admin/RegisterForm';
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getCurrentUser();
  if (user) redirect('/admin');

  return <RegisterForm />;
}
