# Zod Implementation Guide

## Overview

**Zod** is a TypeScript-first schema validation library that solves a critical problem:
- **TypeScript only protects at compile time** - doesn't validate actual data at runtime
- **Zod validates at runtime** - ensures data matches expected structure before processing
- **z.infer** - automatically generates TypeScript types from schemas

This means your frontend and backend **always agree** on what data looks like!

---

## Why Zod is Perfect for Your Project

### ✅ Problems Zod Solves

```typescript
// ❌ WITHOUT Zod - TypeScript only checks at compile time
const caseData: Case = fetchFromAPI(); // Type says it's a Case
console.log(caseData.docketNo); // But what if API sent wrong data?
// Runtime error! 😱

// ✅ WITH Zod - Runtime validation
const result = CaseCreateSchema.safeParse(data);
if (!result.success) {
  console.log('Validation failed:', result.error);
} else {
  const validatedData = result.data; // Guaranteed to be correct type
  console.log(validatedData.docketNo); // Safe! 🎉
}
```

### ✅ Benefits

1. **Type Safety** - TypeScript types generated from runtime schema
2. **Consistency** - Frontend and backend use same schema
3. **Error Messages** - User-friendly validation feedback
4. **Transforms** - Clean/format data during validation
5. **Single Source of Truth** - One schema, multiple uses

---

## Installation

```bash
npm install zod
```

Already installed! ✅

---

## File Structure

```
src/
├── schemas/                    # All Zod schemas
│   ├── cases.ts              # Case schemas + types
│   ├── users.ts              # User schemas + types
│   ├── responses.ts          # API response schemas
│   └── index.ts              # Centralized exports
├── hooks/
│   ├── useValidation.ts      # React hook for validation
│   └── index.ts
├── components/
│   └── forms/
│       └── CreateCaseForm.tsx # Example form using Zod
└── services/
    └── api.ts                # API client (uses schemas)
```

---

## Core Concepts

### 1. **Define a Schema**

```typescript
import { z } from 'zod';

export const CaseCreateSchema = z.object({
  docketNo: z
    .string()
    .min(1, 'Docket number is required')
    .max(100, 'Must be less than 100 characters'),
  complainant: z.string().min(1, 'Complainant is required'),
  respondent: z.string().min(1, 'Respondent is required'),
  // ... more fields
});
```

### 2. **Infer TypeScript Type**

```typescript
// Automatically generates TypeScript type from schema
// This type always matches the schema!
export type CaseCreate = z.infer<typeof CaseCreateSchema>;

// Now you can use it:
const createCase = (data: CaseCreate) => {
  // TypeScript knows exactly what fields are available
  console.log(data.docketNo); // ✅ TypeScript knows this exists
};
```

### 3. **Validate Data**

```typescript
// Safe validation - returns Result object
const result = CaseCreateSchema.safeParse(data);

if (result.success) {
  const validatedData = result.data; // Type is CaseCreate
  // Process valid data
} else {
  console.log(result.error); // ZodError with detailed info
}
```

```typescript
// Throw validation - raises if invalid
const validatedData = CaseCreateSchema.parse(data);
// If invalid, throws ZodError
// If valid, returns CaseCreate type
```

---

## Real-World Usage Examples

### Frontend: React Form Component

```typescript
import { useValidation } from '../hooks';
import { CaseCreateSchema, type CaseCreate } from '../schemas';

function MyForm() {
  const { validate, errors } = useValidation(CaseCreateSchema);

  const handleSubmit = async (formData) => {
    // Validate form data
    const result = await validate(formData);

    if (!result.success) {
      // Show validation errors to user
      console.log('Errors:', result.errors);
      return;
    }

    // Now formData is guaranteed to be valid CaseCreate
    const validatedData: CaseCreate = result.data;

    // Send to API with confidence
    await fetch('/api/cases', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
  };
}
```

### Backend: Express Route Handler

```typescript
import { CaseCreateSchema, validateCaseCreateOrThrow } from '../schemas/cases';

app.post('/api/cases', async (req, res) => {
  try {
    // Validate request body
    const validatedData = validateCaseCreateOrThrow(req.body);
    // Now validatedData is guaranteed to be CaseCreate type

    // Insert into database with validated data
    const query = `
      INSERT INTO cases (docket_no, complainant, respondent, ...)
      VALUES (?, ?, ?, ...)
    `;

    const result = await db.query(query, [
      validatedData.docketNo,
      validatedData.complainant,
      validatedData.respondent,
      // ... rest of fields
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Zod Features

### String Validation

```typescript
z.string()
  .min(1, 'Required')
  .max(100, 'Too long')
  .email('Invalid email')
  .regex(/pattern/, 'Invalid format')
  .trim() // Remove whitespace
  .toLowerCase() // Transform to lowercase
```

### Number Validation

```typescript
z.number()
  .int() // Must be integer
  .positive() // > 0
  .nonnegative() // >= 0
  .multipleOf(5) // Multiple of 5
```

### Date Validation

```typescript
z.date()
  .min(new Date('2020-01-01'))
  .max(new Date())

// Or parse strings:
z.string()
  .datetime()
  .pipe(z.coerce.date()) // Converts to Date
```

### Optional & Default Values

```typescript
z.object({
  required: z.string(), // Must be provided
  optional: z.string().optional(), // Can be undefined
  withDefault: z.string().default('default'), // Has default
  nullable: z.string().nullable(), // Can be null
})
```

### Enum Validation

```typescript
const roleSchema = z.enum(['admin', 'staff', 'clerk']);

type Role = z.infer<typeof roleSchema>; // 'admin' | 'staff' | 'clerk'
```

### Array Validation

```typescript
z.array(z.string())
  .min(1, 'At least one item')
  .max(10, 'Max 10 items')
```

### Nested Objects

```typescript
z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  cases: z.array(CaseSchema),
})
```

### Custom Validation

```typescript
const passwordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    }
  );
```

---

## Advanced Patterns

### Partial Schema (For Updates)

```typescript
const CaseUpdateSchema = CaseCreateSchema.partial();
// All fields become optional for updates
```

### Extending Schemas

```typescript
const CaseWithIdSchema = CaseCreateSchema.extend({
  id: z.number().int().positive(),
});
```

### Transformations

```typescript
const CaseSchema = z.object({
  dateFiled: z
    .string()
    .datetime()
    .pipe(z.coerce.date()) // Transforms string to Date
    .transform((d) => d.toISOString()), // Further transform
});
```

### Discriminated Unions

```typescript
const resultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), data: z.any() }),
  z.object({ status: z.literal('error'), error: z.string() }),
]);
```

---

## Integration with Your Project

### 1. Update API Service

```typescript
import { apiService } from '../services/api';
import { CaseCreateSchema, type CaseCreate } from '../schemas/cases';

export const createCase = async (data: CaseCreate) => {
  const result = await apiService.post('/api/cases', data);
  return result;
};
```

### 2. Validate API Responses

```typescript
import { CasesArraySchema } from '../schemas/cases';

const getCases = async () => {
  const response = await fetch('/api/cases');
  const data = await response.json();

  // Validate API response structure
  const validatedCases = CasesArraySchema.parse(data);
  return validatedCases;
};
```

### 3. Backend Route Protection

```typescript
app.post('/api/cases', (req, res) => {
  // Middleware to validate request
  const { validateCaseCreateOrThrow } = require('../schemas');

  try {
    const validatedData = validateCaseCreateOrThrow(req.body);
    // Proceed with validated data
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## Testing with Zod

```typescript
import { CaseCreateSchema } from '../schemas/cases';

describe('Case Validation', () => {
  it('validates correct case data', () => {
    const validData = {
      docketNo: '123',
      complainant: 'John',
      respondent: 'Jane',
      // ... all required fields
    };

    const result = CaseCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      complainant: 'John',
      // Missing docketNo, respondent, etc.
    };

    const result = CaseCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(3);
  });
});
```

---

## Best Practices

✅ **DO:**
- Keep schemas in `src/schemas/` folder
- Use `z.infer` for all types
- Validate at API boundaries
- Share schemas between frontend and backend
- Use descriptive error messages
- Validate user input on both client and server

❌ **DON'T:**
- Mix manual type definitions with schemas
- Assume API data is valid without validation
- Create duplicate types - use z.infer
- Store unvalidated data in state
- Skip server-side validation

---

## Summary

| Feature | Benefit |
|---------|---------|
| Schema Definition | Single source of truth |
| Type Inference | Types always match schema |
| Runtime Validation | Catch errors before bugs |
| Error Messages | User-friendly feedback |
| Transformations | Clean data automatically |
| Reusability | Frontend + Backend use same |

Your project now has:
- ✅ Type-safe frontend forms
- ✅ Type-safe backend APIs
- ✅ Runtime validation everywhere
- ✅ Shared schemas between client/server
- ✅ Better error messages
- ✅ Production-ready data validation

**You're all set to handle data safely!** 🎉
