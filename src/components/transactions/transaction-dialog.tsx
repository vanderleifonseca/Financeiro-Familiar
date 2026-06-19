"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  transactionSchema,
  type TransactionInput,
  type TransactionOutput,
} from "@/lib/validation";

type Member = { id: string; name: string };
type Category = { id: string; name: string; type: "EXPENSE" | "INCOME" };
type PaymentMethod = { id: string; name: string };

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
};

export function TransactionDialog({
  open,
  onOpenChange,
  members,
  categories,
  paymentMethods,
  defaultMemberId,
  transaction,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  defaultMemberId?: string;
  transaction?: TransactionRecord | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionInput, unknown, TransactionOutput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      kind: "MAINTENANCE",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: "",
      memberId: defaultMemberId ?? "",
      categoryId: "",
      paymentMethodId: "",
    },
  });

  const type = watch("type");

  useEffect(() => {
    if (open) {
      reset(
        transaction
          ? {
              type: transaction.type,
              kind: transaction.kind ?? "MAINTENANCE",
              amount: transaction.amount,
              date: transaction.date.slice(0, 10),
              description: transaction.description ?? "",
              memberId: transaction.memberId,
              categoryId: transaction.categoryId,
              paymentMethodId: transaction.paymentMethodId ?? "",
            }
          : {
              type: "EXPENSE",
              kind: "MAINTENANCE",
              amount: 0,
              date: new Date().toISOString().slice(0, 10),
              description: "",
              memberId: defaultMemberId ?? "",
              categoryId: "",
              paymentMethodId: "",
            }
      );
    }
  }, [open, transaction, defaultMemberId, reset]);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function onSubmit(values: TransactionOutput) {
    setSubmitting(true);
    try {
      const url = transaction
        ? `/api/transactions/${transaction.id}`
        : "/api/transactions";
      const method = transaction ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      toast.success(transaction ? "Transação atualizada" : "Transação criada");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Não foi possível salvar a transação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar transação" : "Nova transação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  items={{ EXPENSE: "Despesa", INCOME: "Receita" }}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "EXPENSE")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                    <SelectItem value="INCOME">Receita</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo (Investimento/Manutenção)</Label>
            <Controller
              name="kind"
              control={control}
              render={({ field }) => (
                <Select
                  items={{ INVESTMENT: "Investimento", MAINTENANCE: "Manutenção" }}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "MAINTENANCE")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVESTMENT">Investimento</SelectItem>
                    <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.kind && (
              <p className="text-sm text-destructive">{errors.kind.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Membro</Label>
            <Controller
              name="memberId"
              control={control}
              render={({ field }) => (
                <Select
                  items={Object.fromEntries(members.map((m) => [m.id, m.name]))}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o membro" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.memberId && (
              <p className="text-sm text-destructive">{errors.memberId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  items={Object.fromEntries(
                    filteredCategories.map((c) => [c.id, c.name])
                  )}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Controller
              name="paymentMethodId"
              control={control}
              render={({ field }) => (
                <Select
                  items={Object.fromEntries(paymentMethods.map((p) => [p.id, p.name]))}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
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
              )}
            />
            {errors.paymentMethodId && (
              <p className="text-sm text-destructive">{errors.paymentMethodId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input id="description" {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
