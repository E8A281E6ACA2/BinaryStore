import PasswordResetForm from '@/components/admin/PasswordResetForm';

type Props = { searchParams?: { token?: string } };

export default function Page({ searchParams }: Props) {
  const token = searchParams?.token || '';
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg">
        <PasswordResetForm token={token} />
      </div>
    </div>
  );
}
