"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { Download } from "lucide-react";

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
  member: { name: string; color: string };
  category: { name: string; color: string };
  paymentMethod: { name: string; color: string } | null;
};

const kindLabel: Record<string, string> = {
  INVESTMENT: "Investimento",
  MAINTENANCE: "Manutenção",
};

function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsClient({
  members,
  categories,
  paymentMethods,
}: {
  members: Member[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [memberFilter, setMemberFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (memberFilter !== "all") params.set("memberId", memberFilter);
    if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (kindFilter !== "all") params.set("kind", kindFilter);
    if (paymentMethodFilter !== "all")
      params.set("paymentMethodId", paymentMethodFilter);

    const res = await fetch(`/api/transactions?${params.toString()}`);
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  }, [from, to, memberFilter, categoryFilter, typeFilter, kindFilter, paymentMethodFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  function exportCsv() {
    const header = [
      "Data",
      "Tipo",
      "Investimento/Manutenção",
      "Descrição",
      "Membro",
      "Categoria",
      "Forma de pagamento",
      "Valor",
    ];
    const rows = transactions.map((t) => [
      formatDate(t.date),
      t.type === "INCOME" ? "Receita" : "Despesa",
      t.kind ? kindLabel[t.kind] : "",
      t.description ?? "",
      t.member.name,
      t.category.name,
      t.paymentMethod?.name ?? "",
      t.amount.toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${from}-a-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-muted-foreground">
          Filtre por período, membro e categoria para analisar as finanças da família.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Membro</Label>
            <Select
              items={{
                all: "Todos",
                ...Object.fromEntries(members.map((m) => [m.id, m.name])),
              }}
              value={memberFilter}
              onValueChange={(v) => setMemberFilter(v ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              items={{
                all: "Todas",
                ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
              }}
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              items={{ all: "Todos", EXPENSE: "Despesas", INCOME: "Receitas" }}
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="EXPENSE">Despesas</SelectItem>
                <SelectItem value="INCOME">Receitas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Investimento/Manutenção</Label>
            <Select
              items={{
                all: "Todos",
                INVESTMENT: "Investimento",
                MAINTENANCE: "Manutenção",
              }}
              value={kindFilter}
              onValueChange={(v) => setKindFilter(v ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="INVESTMENT">Investimento</SelectItem>
                <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select
              items={{
                all: "Todas",
                ...Object.fromEntries(paymentMethods.map((p) => [p.id, p.name])),
              }}
              value={paymentMethodFilter}
              onValueChange={(v) => setPaymentMethodFilter(v ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {paymentMethods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de receitas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalIncome)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de despesas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpense)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do período
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`text-2xl font-bold ${
              totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCurrency(totalIncome - totalExpense)}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCsv} disabled={transactions.length === 0}>
          <Download className="mr-2 size-4" />
          Exportar CSV
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma transação no período selecionado.
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
