"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentMethod = { id: string; name: string };

export function PayBillDialog({
  open,
  onOpenChange,
  billId,
  paymentMethods,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string | null;
  paymentMethods: PaymentMethod[];
  onPaid: () => void;
}) {
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setPaymentMethodId("");
  }, [open]);

  async function handleConfirm() {
    if (!billId || !paymentMethodId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });
      if (!res.ok) throw new Error("Falha ao registrar pagamento");

      toast.success("Conta marcada como paga");
      onOpenChange(false);
      onPaid();
    } catch {
      toast.error("Não foi possível marcar como paga.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar conta como paga</DialogTitle>
          <DialogDescription>
            Isso vai gerar uma transação de despesa. Selecione a forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Forma de pagamento</Label>
          <Select
            items={Object.fromEntries(paymentMethods.map((p) => [p.id, p.name]))}
            value={paymentMethodId}
            onValueChange={(v) => setPaymentMethodId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a forma de pagamento" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!paymentMethodId || submitting}>
            {submitting ? "Confirmando..." : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
