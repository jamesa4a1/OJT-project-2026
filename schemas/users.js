const { z } = require('zod');

// Login validation schema
const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register validation schema
const UserRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'Staff', 'Clerk']).optional().default('Clerk'),
});

// Update user validation schema
const UserUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['Admin', 'Staff', 'Clerk']).optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  UserLoginSchema,
  UserRegisterSchema,
  UserUpdateSchema,
};
