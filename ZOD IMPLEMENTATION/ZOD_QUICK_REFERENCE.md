# Zod Quick Reference

## Installation ✅
```bash
npm install zod
# Already installed!
```

## Basic Setup

### 1. Define Schema
```typescript
import { z } from 'zod';

export const MySchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
  age: z.number().positive(),
});
```

### 2. Extract Type
```typescript
export type MyType = z.infer<typeof MySchema>;
// MyType = { name: string; email: string; age: number }
```

### 3. Validate Data
```typescript
const result = MySchema.safeParse(data);
if (result.success) {
  const validated = result.data; // Type: MyType
}
```

---

## Common Validators

| Validator | Example |
|-----------|---------|
| String | `z.string().min(1).max(100)` |
| Number | `z.number().int().positive()` |
| Date | `z.date().min(new Date('2020-01-01'))` |
| Boolean | `z.boolean()` |
| Email | `z.string().email()` |
| URL | `z.string().url()` |
| Enum | `z.enum(['a', 'b', 'c'])` |
| Array | `z.array(z.string()).min(1)` |
| Optional | `z.string().optional()` |
| Default | `z.string().default('value')` |
| Nullable | `z.string().nullable()` |

---

## Your Project Schemas

### Cases
```typescript
import { CaseCreateSchema, CaseUpdateSchema, type Case } from '../schemas/cases';

// Use in component
const result = CaseCreateSchema.safeParse(formData);

// Use in API
const data: Case = result.data;
```

### Users
```typescript
import { UserLoginSchema, type UserProfile } from '../schemas/users';

// Validate login
const loginResult = UserLoginSchema.safeParse(credentials);
```

### Validation Hook
```typescript
import { useValidation } from '../hooks';

const { validate, errors } = useValidation(MySchema);
const result = await validate(formData);
```

---

## Frontend Usage

```typescript
function MyForm() {
  const { validate, errors } = useValidation(CaseCreateSchema);

  const handleSubmit = async (formData) => {
    const result = await validate(formData);
    if (result.success) {
      // Use validated data
      await api.post('/cases', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="docketNo" />
      {errors.docketNo && <p>{errors.docketNo}</p>}
    </form>
  );
}
```

---

## Backend Usage

```typescript
import { validateCaseCreateOrThrow } from '../schemas/cases';

app.post('/api/cases', (req, res) => {
  try {
    const data = validateCaseCreateOrThrow(req.body);
    // Insert to DB
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## File Locations

```
src/schemas/
├── cases.ts         ← Case schemas (docketNo, complainant, etc.)
├── users.ts         ← User schemas (login, registration)
├── responses.ts     ← API response schemas
└── index.ts         ← Export everything

src/hooks/
└── useValidation.ts ← React validation hook

src/components/forms/
└── CreateCaseForm.tsx ← Example form

handlers/
└── caseHandler.js   ← Backend example
```

---

## Key Benefits for Your Project

✅ **Type Safety** - TypeScript + Zod = bulletproof types  
✅ **API Contract** - Frontend and backend agree on data shape  
✅ **Validation** - Runtime checks catch errors early  
✅ **Error Messages** - User-friendly feedback  
✅ **Single Source of Truth** - Define once, use everywhere  
✅ **Excel Sync** - Validate before importing  

---

## Next Steps

1. ✅ Schemas are defined
2. ✅ Hooks are ready
3. ✅ Example form created
4. ✅ Backend handler example ready

**Start using in your components:**
```typescript
import { CaseCreateSchema } from '../schemas/cases';
import { useValidation } from '../hooks';
```

---

## Documentation

Full guide: [ZOD_IMPLEMENTATION_GUIDE.md](./ZOD_IMPLEMENTATION_GUIDE.md)

Quick examples:
- React Form: [CreateCaseForm.tsx](./src/components/forms/CreateCaseForm.tsx)
- Validation Hook: [useValidation.ts](./src/hooks/useValidation.ts)
- Schemas: [cases.ts](./src/schemas/cases.ts)
- Backend: [caseHandler.js](./handlers/caseHandler.js)
