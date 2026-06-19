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
import { billSchema, type BillInput, type BillOutput } from "@/lib/validation";

type Member = { id: string; name: string };
type Category = { id: string; name: string; type: "EXPENSE" | "INCOME" };

type BillRecord = {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  memberId: string;
  categoryId: string;
  isRecurring: boolean;
};

export function BillDialog({
  open,
  onOpenChange,
  members,
  categories,
  bill,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  categories: Category[];
  bill?: BillRecord | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BillInput, unknown, BillOutput>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      description: "",
      amount: 0,
      dueDate: new Date().toISOString().slice(0, 10),
      memberId: "",
      categoryId: "",
      isRecurring: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        bill
          ? {
              description: bill.description,
              amount: bill.amount,
              dueDate: bill.dueDate.slice(0, 10),
              memberId: bill.memberId,
              categoryId: bill.categoryId,
              isRecurring: bill.isRecurring,
            }
          : {
              description: "",
              amount: 0,
              dueDate: new Date().toISOString().slice(0, 10),
              memberId: "",
              categoryId: "",
              isRecurring: false,
            }
      );
    }
  }, [open, bill, reset]);

  async function onSubmit(values: BillOutput) {
    setSubmitting(true);
    try {
      const url = bill ? `/api/bills/${bill.id}` : "/api/bills";
      const method = bill ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Falha ao salvar");

      toast.success(bill ? "Conta atualizada" : "Conta a pagar criada");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Não foi possível salvar a conta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bill ? "Editar conta a pagar" : "Nova conta a pagar"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
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
                    expenseCategories.map((c) => [c.id, c.name])
                  )}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => (
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

          <div className="flex items-center gap-2">
            <input
              id="isRecurring"
              type="checkbox"
              className="size-4"
              {...register("isRecurring")}
            />
            <Label htmlFor="isRecurring">Conta recorrente (mensal)</Label>
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
