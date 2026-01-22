import { z } from 'zod';

/**
 * User/Authentication Schemas
 */

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .min(1, 'Password is required'),
});

export const UserRegisterSchema = UserLoginSchema.extend({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  role: z.enum(['admin', 'staff', 'clerk']).default('clerk'),
});

export const UserProfileSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'staff', 'clerk']),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'staff', 'clerk']).optional(),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserRegister = z.infer<typeof UserRegisterSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Validation functions
export const validateUserLogin = (data: unknown) => UserLoginSchema.safeParse(data);
export const validateUserRegister = (data: unknown) => UserRegisterSchema.safeParse(data);
export const validateUserProfile = (data: unknown) => UserProfileSchema.safeParse(data);
