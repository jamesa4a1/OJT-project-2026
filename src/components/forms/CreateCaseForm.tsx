import React, { useState } from 'react';
import { useValidation } from '../../hooks/useValidation';
import { CaseCreateSchema, type CaseCreate } from '../../schemas/cases';
import { Button, Alert } from '../ui';

interface FormInputProps {
  label: string;
  name: keyof CaseCreate;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
}

/**
 * Form Input Component with Zod validation
 */
const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
}) => {
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2 text-slate-700">
        {label}
        {[
          'docketNo',
          'complainant',
          'respondent',
          'addressOfRespondent',
          'offense',
          'dateOfCommission',
          'branch',
        ].includes(name as string) && <span className="text-red-500">*</span>}
      </label>
      <InputComponent
        type={type}
        name={name as string}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

/**
 * Create Case Form with Zod Validation
 * Demonstrates real-world usage of Zod schemas
 */
const CreateCaseForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<CaseCreate>>({
    isActive: true,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use validation hook with Zod schema
  const { validate, errors, clearError } = useValidation(CaseCreateSchema);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev: Partial<CaseCreate>) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      clearError(name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    // Validate entire form using Zod
    const validationResult = await validate(formData);

    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.errors);
      return;
    }

    // If validation passes, we have type-safe data
    const validatedData = validationResult.data as CaseCreate;

    setIsSubmitting(true);

    try {
      // Send to API with type-safe data
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        setSuccessMessage('Case created successfully!');
        setFormData({ isActive: true });

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Case</h1>

      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Docket No"
            name="docketNo"
            placeholder="Enter docket number"
            value={formData.docketNo || ''}
            onChange={handleChange}
            error={errors.docketNo}
          />

          <FormInput
            label="Date Filed"
            name="dateFiled"
            type="date"
            value={
              formData.dateFiled ? new Date(formData.dateFiled).toISOString().split('T')[0] : ''
            }
            onChange={handleChange}
            error={errors.dateFiled}
          />

          <FormInput
            label="Complainant"
            name="complainant"
            placeholder="Enter complainant name"
            value={formData.complainant || ''}
            onChange={handleChange}
            error={errors.complainant}
          />

          <FormInput
            label="Respondent"
            name="respondent"
            placeholder="Enter respondent name"
            value={formData.respondent || ''}
            onChange={handleChange}
            error={errors.respondent}
          />

          <FormInput
            label="Address of Respondent"
            name="addressOfRespondent"
            placeholder="Enter address"
            value={formData.addressOfRespondent || ''}
            onChange={handleChange}
            error={errors.addressOfRespondent}
          />

          <FormInput
            label="Offense"
            name="offense"
            placeholder="Enter offense type"
            value={formData.offense || ''}
            onChange={handleChange}
            error={errors.offense}
          />

          <FormInput
            label="Date of Commission"
            name="dateOfCommission"
            type="date"
            value={
              formData.dateOfCommission
                ? new Date(formData.dateOfCommission).toISOString().split('T')[0]
                : ''
            }
            onChange={handleChange}
            error={errors.dateOfCommission}
          />

          <FormInput
            label="Branch"
            name="branch"
            placeholder="Enter branch"
            value={formData.branch || ''}
            onChange={handleChange}
            error={errors.branch}
          />
        </div>

        <div className="mt-4">
          <FormInput
            label="Remarks/Decision"
            name="remarksDecision"
            type="textarea"
            placeholder="Enter remarks or decision"
            value={formData.remarksDecision || ''}
            onChange={handleChange}
            error={errors.remarksDecision}
          />
        </div>

        <div className="mt-6 flex gap-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
          >
            Create Case
          </Button>
          <Button
            type="reset"
            variant="secondary"
            size="lg"
            onClick={() => {
              setFormData({ isActive: true });
            }}
          >
            Reset
          </Button>
        </div>
      </form>

      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="font-bold text-red-700 mb-2">Validation Errors:</p>
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="text-red-600 text-sm">
                <strong>{field}:</strong> {String(error)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreateCaseForm;
