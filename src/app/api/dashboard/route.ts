import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { memberPublicSelect } from "@/lib/selects";

// Month boundaries are computed in UTC (not local time) because dates are
// stored as UTC midnight; using local-time helpers would shift month
// boundaries for any server timezone behind UTC.
function startOfMonthUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonthUTC(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
}

function subMonthsUTC(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1));
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const memberId = searchParams.get("memberId") || undefined;

  const referenceDate = monthParam ? new Date(`${monthParam}-01`) : new Date();
  const monthStart = startOfMonthUTC(referenceDate);
  const monthEnd = endOfMonthUTC(referenceDate);

  const memberFilter = memberId
    ? { memberId, deletedAt: null }
    : { deletedAt: null };

  const [incomeAgg, expenseAgg, expensesByCategoryRaw, upcomingBills] =
    await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          ...memberFilter,
          type: "INCOME",
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          ...memberFilter,
          type: "EXPENSE",
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        _sum: { amount: true },
        where: {
          ...memberFilter,
          type: "EXPENSE",
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.bill.findMany({
        where: {
          ...memberFilter,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        orderBy: { dueDate: "asc" },
        take: 8,
        include: { category: true, member: { select: memberPublicSelect } },
      }),
    ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: expensesByCategoryRaw.map((c) => c.categoryId) } },
  });

  const expensesByCategory = expensesByCategoryRaw.map((row) => {
    const category = categories.find((c) => c.id === row.categoryId);
    return {
      name: category?.name ?? "Outros",
      color: category?.color ?? "#71717a",
      value: row._sum.amount ?? 0,
    };
  });

  const monthlySeries = [];
  for (let i = 5; i >= 0; i--) {
    const refDate = subMonthsUTC(referenceDate, i);
    const start = startOfMonthUTC(refDate);
    const end = endOfMonthUTC(refDate);

    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...memberFilter, type: "INCOME", date: { gte: start, lte: end } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...memberFilter, type: "EXPENSE", date: { gte: start, lte: end } },
      }),
    ]);

    monthlySeries.push({
      month: formatMonthLabel(start),
      income: income._sum.amount ?? 0,
      expense: expense._sum.amount ?? 0,
    });
  }

  const income = incomeAgg._sum.amount ?? 0;
  const expense = expenseAgg._sum.amount ?? 0;

  return NextResponse.json({
    totals: {
      income,
      expense,
      balance: income - expense,
    },
    expensesByCategory,
    monthlySeries,
    upcomingBills: upcomingBills.map((bill) => ({
      id: bill.id,
      description: bill.description,
      amount: bill.amount,
      dueDate: bill.dueDate,
      status: bill.status,
      category: bill.category.name,
      member: bill.member.name,
    })),
  });
}
