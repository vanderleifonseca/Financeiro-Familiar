"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BillDialog } from "@/components/bills/bill-dialog";
import { PayBillDialog } from "@/components/bills/pay-bill-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";

type Member = { id: string; name: string; color: string };
type Category = { id: string; name: string; type: "EXPENSE" | "INCOME"; color: string };
type PaymentMethod = { id: string; name: string };

type BillRecord = {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  isRecurring: boolean;
  memberId: string;
  categoryId: string;
  member: { name: string; color: string };
  category: { name: string; color: string };
};

const statusLabel: Record<BillRecord["status"], { label: string; variant: string }> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  OVERDUE: { label: "Atrasada", variant: "destructive" },
  PAID: { label: "Paga", variant: "outline" },
};

export function BillsClient({
  members,
  categories,
  paymentMethods,
}: {
  members: Member[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BillRecord | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  const loadBills = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bills");
    const data = await res.json();
    setBills(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  function handlePay(id: string) {
    setPayingBillId(id);
    setPayDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta conta a pagar?")) return;
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Conta excluída");
      loadBills();
    } else {
      toast.error("Não foi possível excluir a conta.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Nova conta a pagar
        </Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Membro</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma conta cadastrada.
                </TableCell>
              </TableRow>
            )}
            {bills.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{formatDate(b.dueDate)}</TableCell>
                <TableCell>
                  {b.description}
                  {b.isRecurring && (
                    <span className="ml-2 text-xs text-muted-foreground">(recorrente)</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: b.member.color, color: "#fff" }}>
                    {b.member.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" style={{ borderColor: b.category.color }}>
                    {b.category.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      statusLabel[b.status].variant as
                        | "secondary"
                        | "destructive"
                        | "outline"
                    }
                  >
                    {statusLabel[b.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(b.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {b.status !== "PAID" && (
                      <Button size="icon" variant="ghost" onClick={() => handlePay(b.id)}>
                        <Check className="size-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(b);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        categories={categories}
        bill={editing}
        onSaved={loadBills}
      />

      <PayBillDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        billId={payingBillId}
        paymentMethods={paymentMethods}
        onPaid={loadBills}
      />
    </div>
  );
}
