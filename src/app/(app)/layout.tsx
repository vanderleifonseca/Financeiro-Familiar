import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Wallet } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 flex-col border-r bg-background py-6 md:flex">
        <div className="mb-6 flex items-center gap-2 px-4">
          <Wallet className="size-6 text-primary" />
          <span className="text-lg font-semibold">Finanças da Família</span>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <span className="text-sm text-muted-foreground md:hidden font-semibold">
            Finanças da Família
          </span>
          <div />
          {session?.user && (
            <UserMenu
              name={session.user.name ?? ""}
              color={(session.user as { color?: string }).color}
            />
          )}
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
