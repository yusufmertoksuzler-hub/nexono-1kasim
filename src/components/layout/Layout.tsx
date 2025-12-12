import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-6 md:py-8">
        {children}
      </main>
      <footer className="border-t border-border py-4">
        <div className="container text-center text-sm text-muted-foreground">
          YusufMert Coach • Kişisel Gelişim Asistanın
        </div>
      </footer>
    </div>
  );
}
