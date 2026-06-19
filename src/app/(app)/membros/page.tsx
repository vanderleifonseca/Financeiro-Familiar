import { prisma } from "@/lib/prisma";
import { MembersClient } from "@/components/members/members-client";

export default async function MembrosPage() {
  const members = await prisma.member.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, color: true },
    orderBy: { name: "asc" },
  });

  return <MembersClient initialMembers={members} />;
}
