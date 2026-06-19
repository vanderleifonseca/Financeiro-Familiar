import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { memberUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = memberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.member.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing && existing.id !== id && !existing.deletedAt) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
  }

  const member = await prisma.member.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      color: parsed.data.color || "#6366f1",
      ...(parsed.data.password
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
        : {}),
    },
    select: { id: true, name: true, email: true, color: true },
  });

  return NextResponse.json(member);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Você não pode excluir seu próprio usuário" },
      { status: 400 }
    );
  }

  await prisma.member.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
