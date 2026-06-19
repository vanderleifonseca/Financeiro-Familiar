import { prisma } from "@/lib/prisma";
import { PaymentMethodsClient } from "@/components/payment-methods/payment-methods-client";

export default async function FormasDePagamentoPage() {
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return <PaymentMethodsClient initialPaymentMethods={paymentMethods} />;
}
