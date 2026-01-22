# Zod Integration Checklist

## ✅ Setup Complete

- [x] Zod installed (`npm install zod`)
- [x] Schemas created in `src/schemas/`
- [x] Types inferred with `z.infer`
- [x] Validation hook created
- [x] Example form component created
- [x] Backend handler example created
- [x] Documentation written

---

## 📋 Integration Steps

### Step 1: Replace Old Type Definitions
- [ ] Find all manual `interface Case {}` definitions
- [ ] Replace with `import { type Case } from '../schemas/cases'`
- [ ] Delete old type files

Example:
```typescript
// ❌ OLD
interface Case {
  id: number;
  docketNo: string;
  // ...
}

// ✅ NEW
import { type Case } from '../schemas/cases';
```

### Step 2: Update API Service
- [ ] Update `src/services/api.ts` to use schemas
- [ ] Add schema validation to API responses
- [ ] Add type hints to API methods

Example:
```typescript
import { type Case, CaseCreateSchema } from '../schemas/cases';

export const createCase = async (data: CaseCreate): Promise<Case> => {
  return apiService.post('/api/cases', data);
};
```

### Step 3: Migrate Existing Forms
- [ ] Find all form components (AddCase, EditCase, etc.)
- [ ] Replace form validation logic with `useValidation` hook
- [ ] Use Zod schemas instead of manual validation

Example:
```typescript
// ❌ OLD: Manual validation
if (!formData.docketNo) setError('Docket No required');

// ✅ NEW: Zod validation
const { validate, errors } = useValidation(CaseCreateSchema);
```

### Step 4: Update ExcelSync Component
- [ ] Import `CaseCreateSchema` from schemas
- [ ] Use Zod for Excel column validation
- [ ] Validate each row against schema before import

### Step 5: Update Backend Routes
- [ ] Add Zod validation to all POST/PUT endpoints
- [ ] Replace manual validation with schema validation
- [ ] Use standard error responses

Example:
```typescript
// ❌ OLD
if (!req.body.docketNo) return res.status(400).send('Required');

// ✅ NEW
const result = CaseCreateSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json(ApiResponse.validationError(result.error.errors));
}
```

### Step 6: Update Tests
- [ ] Create test schemas
- [ ] Test valid and invalid data
- [ ] Test type inference

Example:
```typescript
import { CaseCreateSchema } from '../schemas/cases';

describe('Case Creation', () => {
  it('validates correct data', () => {
    const data = { /* valid case data */ };
    expect(CaseCreateSchema.safeParse(data).success).toBe(true);
  });
});
```

---

## 📂 File Organization After Integration

```
src/
├── schemas/                    ← Zod schemas (SINGLE SOURCE OF TRUTH)
│   ├── cases.ts              ← All case types/validation
│   ├── users.ts              ← All user types/validation
│   ├── responses.ts          ← API response types
│   └── index.ts
├── hooks/
│   └── useValidation.ts      ← Form validation hook
├── components/
│   ├── forms/
│   │   ├── CreateCaseForm.tsx
│   │   ├── EditCaseForm.tsx
│   │   └── LoginForm.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Alert.tsx
│   │   └── ...
│   └── ...
├── services/
│   ├── api.ts                ← Uses schemas for types
│   └── ...
└── pages/
    ├── ExcelSync.tsx         ← Uses Zod validation
    └── ...
```

---

## 🔄 Before and After Comparison

### Form Component

**BEFORE:**
```typescript
function CreateCaseForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const validate = () => {
    if (!formData.docketNo) setErrors({ ...errors, docketNo: 'Required' });
    // Manual validation for 20+ fields... 😫
  };
}
```

**AFTER:**
```typescript
function CreateCaseForm() {
  const [formData, setFormData] = useState<Partial<CaseCreate>>({});
  const { validate, errors } = useValidation(CaseCreateSchema);

  const handleSubmit = async () => {
    const result = await validate(formData);
    if (result.success) {
      const validatedData: CaseCreate = result.data;
      // Fully typed, validated data! ✨
    }
  };
}
```

### Backend Route

**BEFORE:**
```typescript
app.post('/api/cases', (req, res) => {
  if (!req.body.docketNo) return res.status(400).send('docketNo required');
  if (!req.body.complainant) return res.status(400).send('complainant required');
  if (!req.body.respondent) return res.status(400).send('respondent required');
  // ... 20+ more manual checks 😫

  // No type safety! What fields does req.body have?
  db.query('INSERT INTO cases ...', req.body);
});
```

**AFTER:**
```typescript
app.post('/api/cases', (req, res) => {
  const result = CaseCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.json(ApiResponse.validationError(result.error.errors));
  }

  const data: CaseCreate = result.data; // Fully typed!
  db.query('INSERT INTO cases ...', data);
});
```

---

## 🧪 Validation Examples

### Valid Case Data
```typescript
const validCase = {
  docketNo: 'DOC-2024-001',
  dateFiled: new Date('2024-01-01'),
  complainant: 'John Doe',
  respondent: 'Jane Smith',
  addressOfRespondent: '123 Main St',
  offense: 'Theft',
  dateOfCommission: new Date('2024-01-01'),
  branch: 'Main Branch',
};

const result = CaseCreateSchema.safeParse(validCase);
console.log(result.success); // true
console.log(result.data.docketNo); // 'DOC-2024-001'
```

### Invalid Case Data
```typescript
const invalidCase = {
  docketNo: '', // ❌ Empty string
  complainant: 'John Doe',
  // ❌ Missing required fields
};

const result = CaseCreateSchema.safeParse(invalidCase);
console.log(result.success); // false
console.log(result.error?.issues);
// [
//   { path: ['docketNo'], message: 'String must contain at least 1 character' },
//   { path: ['respondent'], message: 'Required' },
//   { path: ['addressOfRespondent'], message: 'Required' },
//   ...
// ]
```

---

## 🚀 Quick Start Command

After integration, your form component looks like:

```typescript
import { useValidation } from '../hooks';
import { CaseCreateSchema, type CaseCreate } from '../schemas/cases';

function MyForm() {
  const { validate, errors } = useValidation(CaseCreateSchema);

  const handleSubmit = async (formData: unknown) => {
    const result = await validate(formData);
    if (result.success) {
      // formData is now guaranteed to be CaseCreate type
      console.log('Valid data:', result.data);
    } else {
      // Show errors to user
      console.log('Validation errors:', errors);
    }
  };

  return (
    // Your form JSX with error display
  );
}
```

---

## 📊 Impact Summary

| Aspect | Before | After |
|--------|--------|-------|
| Type Safety | TypeScript compile-time only | TypeScript + Zod runtime |
| Validation | Manual in each component | Centralized in schemas |
| Type Definition | Duplicated across files | Single source of truth |
| Error Messages | Generic | User-friendly |
| Frontend-Backend Sync | Manual | Automatic with z.infer |
| Lines of Code | Many manual checks | Few lines with Zod |
| Maintainability | Hard to change types | Change once, everywhere |
| Error Catching | Runtime bugs | Caught early |

---

## 🎯 Final Checklist

- [ ] All schemas defined
- [ ] All types inferred with z.infer
- [ ] Forms updated to use useValidation
- [ ] API service uses schemas
- [ ] Backend routes validate with schemas
- [ ] ExcelSync validates with schemas
- [ ] Tests updated
- [ ] Old type definitions removed
- [ ] Documentation reviewed
- [ ] Team trained on Zod usage

---

## 📚 Resources

- Full Guide: [ZOD_IMPLEMENTATION_GUIDE.md](./ZOD_IMPLEMENTATION_GUIDE.md)
- Quick Ref: [ZOD_QUICK_REFERENCE.md](./ZOD_QUICK_REFERENCE.md)
- Zod Docs: https://zod.dev
- GitHub: https://github.com/colinhacks/zod

---

**Status: ✅ Zod Implementation Complete and Ready to Use!**

Start by updating your form components to use the new `useValidation` hook and Zod schemas.
