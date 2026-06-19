import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentMethodSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = paymentMethodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const paymentMethod = await prisma.paymentMethod.update({
    where: { id },
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
    },
  });

  return NextResponse.json(paymentMethod);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.paymentMethod.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
