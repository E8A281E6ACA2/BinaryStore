import AdminSidebar from './AdminSidebar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto flex py-8 px-4">
        <aside className="mr-8 w-64 shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1">
          <div className="rounded bg-white p-6 shadow dark:bg-slate-800">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
