import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useI18n } from '@/hooks';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave: () => void;
  loading?: boolean;
}

export const EditModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  loading,
}: EditModalProps) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">{children}</div>
        <div className="flex justify-end gap-3 border-t border-border p-4">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={onSave} disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface FormInputProps {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}

export const FormInput = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: FormInputProps) => {
  const displayValue = value === null || value === undefined ? '' : String(value);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={displayValue}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
};

interface FormSelectProps {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export const FormSelect = ({ label, value, onChange, options }: FormSelectProps) => {
  const displayValue = value === null || value === undefined ? '' : String(value);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <select
        value={displayValue}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-input bg-background p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
