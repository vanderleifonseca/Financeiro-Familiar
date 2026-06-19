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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Member = { id: string; name: string; email: string; color: string };

const colors = [
  "#6366f1",
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#0ea5e9",
  "#a855f7",
  "#ec4899",
];

export function MembersClient({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/members");
    setMembers(await res.json());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreateDialog() {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setColor(colors[0]);
    setOpen(true);
  }

  function openEditDialog(member: Member) {
    setEditing(member);
    setName(member.name);
    setEmail(member.email);
    setPassword("");
    setColor(member.color);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `/api/members/${editing.id}` : "/api/members";
      const method = editing ? "PATCH" : "POST";
      const body = editing
        ? { name, email, color, ...(password ? { password } : {}) }
        : { name, email, password, color };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Erro");
      }
      toast.success(editing ? "Membro atualizado" : "Membro cadastrado");
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Excluir o membro "${member.name}"?`)) return;
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Membro excluído");
      reload();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Não foi possível excluir o membro.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Membros da Família</h1>
          <p className="text-muted-foreground">
            Cadastre quem vai usar o sistema e lançar transações.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Novo membro
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const initials = m.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <Card key={m.id}>
              <CardContent className="flex items-center gap-3 pt-6">
                <Avatar>
                  <AvatarFallback style={{ backgroundColor: m.color, color: "#fff" }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(m)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(m)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar membro" : "Novo membro"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Senha{editing && " (deixe em branco para manter a atual)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required={!editing}
              />
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
