import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import LoginForm from '@/components/admin/LoginForm';

export default async function Page() {
  const user = await getCurrentUser();
  if (user) redirect('/admin');

  return <LoginForm />;
}
