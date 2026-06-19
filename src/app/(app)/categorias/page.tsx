import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, type: true, color: true },
    orderBy: { name: "asc" },
  });

  return <CategoriesClient initialCategories={categories} />;
}
