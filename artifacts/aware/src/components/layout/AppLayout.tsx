import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PropertyStatusBar } from "./PropertyStatusBar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        <PropertyStatusBar />
      </div>
    </div>
  );
}
