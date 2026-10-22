import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="p-6">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-ink hover:text-accent transition-colors"
        >
          Karyora
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
