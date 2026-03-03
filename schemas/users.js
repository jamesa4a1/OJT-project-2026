const { z } = require('zod');

/**
 * Common passwords list - Add more from SecLists for production
 * @see https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/
 */
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', 'password1234',
  '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'qwertyuiop',
  'admin', 'admin123', 'administrator',
  'letmein', 'welcome', 'welcome1', 'welcome123',
  'monkey', 'dragon', 'master', 'login',
  'abc123', 'iloveyou', 'password!', 'p@ssw0rd',
  'Password1', 'Password123', 'Password1!', 'Admin123!',
  'changeme', 'changeme123', 'temp123', 'test123'
];

/**
 * Check if password is in common passwords list
 * Case-insensitive comparison
 */
const isNotCommonPassword = (password) => {
  const lowerPassword = password.toLowerCase();
  return !COMMON_PASSWORDS.some(common => 
    lowerPassword === common.toLowerCase() ||
    lowerPassword.includes(common.toLowerCase())
  );
};

/**
 * Strong password schema following NIST guidelines
 * Requirements:
 * - Minimum 12 characters (NIST recommends 8+, we use 12 for extra security)
 * - Maximum 128 characters (prevent DoS from hashing very long passwords)
 * - At least one uppercase letter
 * - At least one lowercase letter  
 * - At least one number
 * - At least one special character
 * - No more than 2 consecutive identical characters
 * - Not a common password
 */
const strongPasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)')
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'Password cannot contain more than 2 consecutive identical characters'
  )
  .refine(
    isNotCommonPassword,
    'This password is too common. Please choose a stronger password.'
  );

/**
 * Name validation schema
 * - 2-100 characters
 * - Only letters, spaces, hyphens, and apostrophes
 * - No leading/trailing whitespace
 */
const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )
  .transform(name => name.trim());

/**
 * Email validation schema
 * - Valid email format
 * - Maximum 255 characters (RFC 5321 limit)
 * - Converted to lowercase and trimmed
 */
const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

/**
 * Role validation schema
 */
const roleSchema = z.enum(['Admin', 'Staff', 'Clerk']);

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

/**
 * Login validation schema
 * Minimal validation - actual credential check is done server-side
 */
const UserLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Registration validation schema
 * Enforces strong password policy for new accounts
 */
const UserRegisterSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: strongPasswordSchema,
  role: roleSchema.optional().default('Clerk'),
});

/**
 * User profile update schema
 * Does not include password - use PasswordChangeSchema for that
 */
const UserUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: roleSchema.optional(),
  is_active: z.boolean().optional(),
});

/**
 * Password change schema
 * Requires current password and enforces strong new password
 */
const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { 
    message: 'Passwords do not match', 
    path: ['confirmPassword'] 
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  { 
    message: 'New password must be different from current password', 
    path: ['newPassword'] 
  }
);

/**
 * Admin password reset schema (for admins resetting other users' passwords)
 */
const AdminPasswordResetSchema = z.object({
  userId: z.number().int().positive('Invalid user ID'),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { 
    message: 'Passwords do not match', 
    path: ['confirmPassword'] 
  }
);

/**
 * User ID parameter schema (for route params)
 */
const UserIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number)
});

module.exports = {
  // Main schemas
  UserLoginSchema,
  UserRegisterSchema,
  UserUpdateSchema,
  PasswordChangeSchema,
  AdminPasswordResetSchema,
  UserIdParamSchema,
  
  // Building blocks (for custom compositions)
  strongPasswordSchema,
  nameSchema,
  emailSchema,
  roleSchema,
  
  // Utilities
  isNotCommonPassword,
  COMMON_PASSWORDS
};
