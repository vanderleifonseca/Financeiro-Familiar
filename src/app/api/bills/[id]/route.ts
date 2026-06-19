import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billSchema } from "@/lib/validation";
import { memberPublicSelect } from "@/lib/selects";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = billSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bill = await prisma.bill.update({
    where: { id },
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

  return NextResponse.json(bill);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.bill.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
