import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-full max-w-6xl lg:gap-0">
      <DashboardNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
