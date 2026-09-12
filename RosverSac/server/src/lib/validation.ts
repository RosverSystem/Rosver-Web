import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-ZÁÉÍÓÚÑ]/, 'Falta una mayúscula')
  .regex(/[a-záéíóúñ]/, 'Falta una minúscula')
  .regex(/\d/, 'Falta un número')
  .regex(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]/, 'Falta un carácter especial')

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre es obligatorio'),
  email: z.string().trim().email('Correo no válido').transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .min(9, 'Teléfono obligatorio (mín. 9 dígitos)')
    .refine((v) => v.replace(/\D/g, '').length >= 9, 'Teléfono no válido'),
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  /** Vacío / omitido = login sin contraseña (OTP o autenticador). */
  password: z.string().optional(),
  passwordless: z.boolean().optional(),
})

export const otpSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  code: z
    .string()
    .transform((v) => v.replace(/[\s\-_.]/g, ''))
    .pipe(z.string().min(4).max(8)),
})

export const resetPasswordSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  code: z
    .string()
    .transform((v) => v.replace(/[\s\-_.]/g, ''))
    .pipe(z.string().min(4).max(8)),
  newPassword: passwordSchema,
})

export const resetPasswordStartSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
})

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z
    .string()
    .trim()
    .min(9)
    .refine((v) => v.replace(/\D/g, '').length >= 9)
    .optional(),
  companyName: z.string().trim().max(120).nullable().optional(),
  documentType: z.enum(['DNI', 'RUC', 'CE', 'PAS']).nullable().optional(),
  documentNumber: z.string().trim().max(32).nullable().optional(),
  avatarUrl: z.string().trim().max(1000).optional(),
})
