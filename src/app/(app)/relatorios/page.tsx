import { prisma } from "@/lib/prisma";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function RelatoriosPage() {
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
    <ReportsClient
      members={members}
      categories={categories}
      paymentMethods={paymentMethods}
    />
  );
}
