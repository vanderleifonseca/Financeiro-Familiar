import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { memberPublicSelect } from "@/lib/selects";
import { payBillSchema } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = payBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill || bill.deletedAt) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }
  if (bill.status === "PAID") {
    return NextResponse.json({ error: "Conta já está paga" }, { status: 409 });
  }

  const [, updatedBill] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amount: bill.amount,
        date: new Date(),
        description: bill.description,
        memberId: bill.memberId,
        categoryId: bill.categoryId,
        paymentMethodId: parsed.data.paymentMethodId,
        billId: bill.id,
      },
    }),
    prisma.bill.update({
      where: { id },
      data: { status: "PAID" },
      include: { member: { select: memberPublicSelect }, category: true },
    }),
  ]);

  return NextResponse.json(updatedBill);
}
