import { prisma } from "@/lib/prisma";
import { TransactionsClient } from "@/components/transactions/transactions-client";

export default async function TransacoesPage() {
  const [members, categories, paymentMethods] = await Promise.all([
    prisma.member.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.paymentMethod.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transações</h1>
        <p className="text-muted-foreground">
          Lance despesas e receitas e acompanhe quem é responsável por cada uma.
        </p>
      </div>
      <TransactionsClient
        members={members}
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
