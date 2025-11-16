import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="container mx-auto py-6 px-4">{children}</div>
      </main>
    </div>
  );
}

