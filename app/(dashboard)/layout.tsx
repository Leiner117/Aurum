import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RealtimeSyncProvider } from "@/components/layout/RealtimeSyncProvider";
import { FloatingMenu } from "@/components/layout/FloatingMenu";
import { PushNotificationsBridge } from "@/components/layout/PushNotificationsBridge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RealtimeSyncProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:px-6">
            {children}
          </main>
        </div>
      </div>
      <FloatingMenu />
      <PushNotificationsBridge />
    </RealtimeSyncProvider>
  );
}
