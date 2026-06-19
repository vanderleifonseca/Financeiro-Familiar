"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Member = { id: string; name: string; color: string };
type Category = { id: string; name: string; type: "EXPENSE" | "INCOME"; color: string };
type PaymentMethod = { id: string; name: string; color: string };

type TransactionRecord = {
  id: string;
  type: "EXPENSE" | "INCOME";
  kind: "INVESTMENT" | "MAINTENANCE" | null;
  amount: number;
  date: string;
  description: string | null;
  memberId: string;
  categoryId: string;
  paymentMethodId: string | null;
  member: { name: string; color: string };
  category: { name: string; color: string };
  paymentMethod: { name: string; color: string } | null;
};

const kindLabel: Record<string, string> = {
  INVESTMENT: "Investimento",
  MAINTENANCE: "Manutenção",
};

export function TransactionsClient({
  members,
  categories,
  paymentMethods,
}: {
  members: Member[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRecord | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (memberFilter !== "all") params.set("memberId", memberFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (kindFilter !== "all") params.set("kind", kindFilter);
    if (paymentMethodFilter !== "all")
      params.set("paymentMethodId", paymentMethodFilter);

    const res = await fetch(`/api/transactions?${params.toString()}`);
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  }, [memberFilter, typeFilter, kindFilter, paymentMethodFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta transação?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transação excluída");
      loadTransactions();
    } else {
      toast.error("Não foi possível excluir a transação.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select
            items={{
              all: "Todos os membros",
              ...Object.fromEntries(members.map((m) => [m.id, m.name])),
            }}
            value={memberFilter}
            onValueChange={(v) => setMemberFilter(v ?? "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Membro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os membros</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={{ all: "Todos os tipos", EXPENSE: "Despesas", INCOME: "Receitas" }}
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v ?? "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="EXPENSE">Despesas</SelectItem>
              <SelectItem value="INCOME">Receitas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            items={{
              all: "Todos (Invest./Manut.)",
              INVESTMENT: "Investimento",
              MAINTENANCE: "Manutenção",
            }}
            value={kindFilter}
            onValueChange={(v) => setKindFilter(v ?? "all")}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo (Invest./Manut.)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (Invest./Manut.)</SelectItem>
              <SelectItem value="INVESTMENT">Investimento</SelectItem>
              <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
            </SelectContent>
          </Select>

          <Select
            items={{
              all: "Todas as formas",
              ...Object.fromEntries(paymentMethods.map((p) => [p.id, p.name])),
            }}
            value={paymentMethodFilter}
            onValueChange={(v) => setPaymentMethodFilter(v ?? "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Forma de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as formas</SelectItem>
              {paymentMethods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Nova transação
        </Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Membro</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Forma de pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            )}
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{formatDate(t.date)}</TableCell>
                <TableCell>{t.description || "-"}</TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: t.member.color, color: "#fff" }}>
                    {t.member.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" style={{ borderColor: t.category.color }}>
                    {t.category.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  {t.kind ? (
                    <Badge variant="secondary">{kindLabel[t.kind]}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {t.paymentMethod ? (
                    <Badge variant="outline" style={{ borderColor: t.paymentMethod.color }}>
                      {t.paymentMethod.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    t.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(t);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        categories={categories}
        paymentMethods={paymentMethods}
        transaction={editing}
        onSaved={loadTransactions}
      />
    </div>
  );
}
