import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billSchema } from "@/lib/validation";
import { memberPublicSelect } from "@/lib/selects";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId") || undefined;
  const status = searchParams.get("status") || undefined;

  const now = new Date();
  await prisma.bill.updateMany({
    where: { status: "PENDING", dueDate: { lt: now }, deletedAt: null },
    data: { status: "OVERDUE" },
  });

  const bills = await prisma.bill.findMany({
    where: {
      deletedAt: null,
      ...(memberId ? { memberId } : {}),
      ...(status ? { status: status as "PENDING" | "PAID" | "OVERDUE" } : {}),
    },
    include: { member: { select: memberPublicSelect }, category: true },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = billSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bill = await prisma.bill.create({
    data: {
      description: parsed.data.description,
      amount: parsed.data.amount,
      dueDate: new Date(parsed.data.dueDate),
      memberId: parsed.data.memberId,
      categoryId: parsed.data.categoryId,
      isRecurring: parsed.data.isRecurring,
      recurrenceDay: parsed.data.isRecurring
        ? new Date(parsed.data.dueDate).getUTCDate()
        : null,
    },
    include: { member: { select: memberPublicSelect }, category: true },
  });

  return NextResponse.json(bill, { status: 201 });
}
