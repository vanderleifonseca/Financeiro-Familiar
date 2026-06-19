import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  kind: z.enum(["INVESTMENT", "MAINTENANCE"]),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  date: z.string().min(1, "Informe a data"),
  description: z.string().optional(),
  memberId: z.string().min(1, "Selecione o membro"),
  categoryId: z.string().min(1, "Selecione a categoria"),
  paymentMethodId: z.string().min(1, "Selecione a forma de pagamento"),
});

export type TransactionInput = z.input<typeof transactionSchema>;
export type TransactionOutput = z.output<typeof transactionSchema>;

export const billSchema = z.object({
  description: z.string().min(1, "Informe a descrição"),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  dueDate: z.string().min(1, "Informe o vencimento"),
  memberId: z.string().min(1, "Selecione o membro"),
  categoryId: z.string().min(1, "Selecione a categoria"),
  isRecurring: z.boolean().optional().default(false),
});

export type BillInput = z.input<typeof billSchema>;
export type BillOutput = z.output<typeof billSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  type: z.enum(["EXPENSE", "INCOME"]),
  color: z.string().min(1).default("#6366f1"),
  icon: z.string().optional(),
});

export type CategoryInput = z.input<typeof categorySchema>;
export type CategoryOutput = z.output<typeof categorySchema>;

export const paymentMethodSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  color: z.string().min(1).default("#6366f1"),
  icon: z.string().optional(),
});

export type PaymentMethodInput = z.input<typeof paymentMethodSchema>;
export type PaymentMethodOutput = z.output<typeof paymentMethodSchema>;

export const payBillSchema = z.object({
  paymentMethodId: z.string().min(1, "Selecione a forma de pagamento"),
});

export const memberCreateSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um email válido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  color: z.string().optional(),
});

export const memberUpdateSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um email válido"),
  password: z
    .string()
    .min(6, "A senha deve ter ao menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  color: z.string().optional(),
});

export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
