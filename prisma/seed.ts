import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const expenseCategories = [
  { name: "Moradia", color: "#f97316", icon: "home" },
  { name: "Saúde", color: "#ef4444", icon: "heart-pulse" },
  { name: "Transporte", color: "#3b82f6", icon: "car" },
  { name: "Alimentação", color: "#22c55e", icon: "utensils" },
  { name: "Lazer", color: "#a855f7", icon: "popcorn" },
  { name: "Investimentos", color: "#0ea5e9", icon: "trending-up" },
  { name: "Viagens", color: "#06b6d4", icon: "plane" },
  { name: "Empréstimos", color: "#dc2626", icon: "landmark" },
  { name: "Veículos", color: "#64748b", icon: "car-front" },
  { name: "Vestuário", color: "#ec4899", icon: "shirt" },
  { name: "Outros", color: "#71717a", icon: "ellipsis" },
];

const incomeCategories = [
  { name: "Salário", color: "#16a34a", icon: "wallet" },
  { name: "Renda Extra", color: "#22c55e", icon: "hand-coins" },
  { name: "Investimentos", color: "#0ea5e9", icon: "trending-up" },
  { name: "Outros", color: "#71717a", icon: "ellipsis" },
];

const paymentMethods = [
  { name: "Dinheiro", color: "#22c55e", icon: "banknote" },
  { name: "Banco", color: "#0ea5e9", icon: "landmark" },
  { name: "Cartão de Crédito", color: "#a855f7", icon: "credit-card" },
];

async function main() {
  for (const category of expenseCategories) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: "EXPENSE" } },
      update: {},
      create: { ...category, type: "EXPENSE" },
    });
  }

  for (const category of incomeCategories) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: "INCOME" } },
      update: {},
      create: { ...category, type: "INCOME" },
    });
  }

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: method.name },
      update: {},
      create: method,
    });
  }

  const passwordHash = await bcrypt.hash("familia123", 10);

  await prisma.member.upsert({
    where: { email: "admin@familia.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@familia.com",
      passwordHash,
      color: "#6366f1",
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
