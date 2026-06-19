import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validation";
import { memberPublicSelect } from "@/lib/selects";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const transaction = await prisma.transaction.update({
    where: { id },
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

  return NextResponse.json(transaction);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
