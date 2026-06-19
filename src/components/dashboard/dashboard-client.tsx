"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, Wallet } from "lucide-react";

type Member = { id: string; name: string };

type DashboardData = {
  totals: { income: number; expense: number; balance: number };
  expensesByCategory: { name: string; value: number; color: string }[];
  monthlySeries: { month: string; income: number; expense: number }[];
  upcomingBills: {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: "PENDING" | "OVERDUE" | "PAID";
    category: string;
    member: string;
  }[];
};

function monthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(d);
    options.push({ value, label });
  }
  return options;
}

export function DashboardClient({ members }: { members: Member[] }) {
  const [memberFilter, setMemberFilter] = useState("all");
  const [month, setMonth] = useState(monthOptions()[0].value);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (memberFilter !== "all") params.set("memberId", memberFilter);

    fetch(`/api/dashboard?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, [memberFilter, month]);

  const options = monthOptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das finanças da família.</p>
        </div>
        <div className="flex gap-2">
          <Select
            items={{
              all: "Todos os membros",
              ...Object.fromEntries(members.map((m) => [m.id, m.name])),
            }}
            value={memberFilter}
            onValueChange={(v) => setMemberFilter(v ?? "all")}
          >
            <SelectTrigger className="w-44">
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
            items={Object.fromEntries(options.map((o) => [o.value, o.label]))}
            value={month}
            onValueChange={(v) => setMonth(v ?? options[0].value)}
          >
            <SelectTrigger className="w-44">
              <SelectValue className="capitalize" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value} className="capitalize">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do mês
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (data?.totals.balance ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {loading ? "..." : formatCurrency(data?.totals.balance ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do mês
            </CardTitle>
            <ArrowUpCircle className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? "..." : formatCurrency(data?.totals.income ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do mês
            </CardTitle>
            <ArrowDownCircle className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatCurrency(data?.totals.expense ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas a pagar
            </CardTitle>
            <CalendarClock className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loading
                ? "..."
                : formatCurrency(
                    data?.upcomingBills.reduce((sum, b) => sum + b.amount, 0) ?? 0
                  )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensePieChart data={data?.expensesByCategory ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas vs Despesas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={data?.monthlySeries ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximas contas a pagar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.upcomingBills.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma conta pendente.</p>
          )}
          {data?.upcomingBills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{bill.description}</p>
                <p className="text-xs text-muted-foreground">
                  {bill.member} • {bill.category} • vence {formatDate(bill.dueDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {bill.status === "OVERDUE" && (
                  <Badge variant="destructive">Atrasada</Badge>
                )}
                <span className="font-semibold">{formatCurrency(bill.amount)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
