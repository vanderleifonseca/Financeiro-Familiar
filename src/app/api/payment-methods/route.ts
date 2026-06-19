import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentMethodSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(paymentMethods);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = paymentMethodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.paymentMethod.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing && !existing.deletedAt) {
    return NextResponse.json(
      { error: "Já existe uma forma de pagamento com esse nome" },
      { status: 409 }
    );
  }

  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
    },
  });

  return NextResponse.json(paymentMethod, { status: 201 });
}
