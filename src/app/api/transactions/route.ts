import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validation";
import { memberPublicSelect } from "@/lib/selects";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const type = searchParams.get("type") || undefined;
  const kind = searchParams.get("kind") || undefined;
  const paymentMethodId = searchParams.get("paymentMethodId") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      ...(memberId ? { memberId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(type ? { type: type as "EXPENSE" | "INCOME" } : {}),
      ...(kind ? { kind: kind as "INVESTMENT" | "MAINTENANCE" } : {}),
      ...(paymentMethodId ? { paymentMethodId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
              // Use end-of-day so transactions created on the "to" date
              // (which carry a real time-of-day, not just midnight) are
              // still included in the range.
              ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    },
    include: {
      member: { select: memberPublicSelect },
      category: true,
      paymentMethod: true,
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: parsed.data.type,
      kind: parsed.data.kind,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      memberId: parsed.data.memberId,
      categoryId: parsed.data.categoryId,
      paymentMethodId: parsed.data.paymentMethodId,
    },
    include: {
      member: { select: memberPublicSelect },
      category: true,
      paymentMethod: true,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
