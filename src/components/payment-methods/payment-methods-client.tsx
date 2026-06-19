"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";

type PaymentMethod = { id: string; name: string; color: string };

const colors = [
  "#6366f1",
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#0ea5e9",
  "#a855f7",
  "#ec4899",
  "#71717a",
];

export function PaymentMethodsClient({
  initialPaymentMethods,
}: {
  initialPaymentMethods: PaymentMethod[];
}) {
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/payment-methods");
    setPaymentMethods(await res.json());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreateDialog() {
    setEditing(null);
    setName("");
    setColor(colors[0]);
    setOpen(true);
  }

  function openEditDialog(paymentMethod: PaymentMethod) {
    setEditing(paymentMethod);
    setName(paymentMethod.name);
    setColor(paymentMethod.color);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing
        ? `/api/payment-methods/${editing.id}`
        : "/api/payment-methods";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Erro");
      }
      toast.success(editing ? "Forma de pagamento atualizada" : "Forma de pagamento criada");
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(paymentMethod: PaymentMethod) {
    if (!confirm(`Excluir a forma de pagamento "${paymentMethod.name}"?`)) return;
    const res = await fetch(`/api/payment-methods/${paymentMethod.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Forma de pagamento excluída");
      reload();
    } else {
      toast.error("Não foi possível excluir a forma de pagamento.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Formas de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie como os pagamentos da família são registrados.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Nova forma de pagamento
        </Button>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentMethods.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  Nenhuma forma de pagamento cadastrada.
                </TableCell>
              </TableRow>
            )}
            {paymentMethods.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Badge variant="outline" style={{ borderColor: p.color }}>
                    {p.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(p)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar forma de pagamento" : "Nova forma de pagamento"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="size-7 rounded-full ring-offset-2 transition-shadow"
                    style={{
                      backgroundColor: c,
                      boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
