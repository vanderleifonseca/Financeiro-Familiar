import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { memberCreateSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, color: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = memberCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.member.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing && !existing.deletedAt) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const member = await prisma.member.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      color: parsed.data.color || "#6366f1",
    },
    select: { id: true, name: true, email: true, color: true },
  });

  return NextResponse.json(member, { status: 201 });
}
