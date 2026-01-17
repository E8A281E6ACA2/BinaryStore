export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} 软件下载中心. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
