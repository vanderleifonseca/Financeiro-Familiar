import { prisma } from "@/lib/prisma";
import { BillsClient } from "@/components/bills/bills-client";

export default async function ContasAPagarPage() {
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
        <h1 className="text-2xl font-semibold">Contas a Pagar</h1>
        <p className="text-muted-foreground">
          Acompanhe compromissos futuros e marque como pago quando liquidar.
        </p>
      </div>
      <BillsClient
        members={members}
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
