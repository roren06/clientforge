import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}