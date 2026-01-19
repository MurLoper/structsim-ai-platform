import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  loading?: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">{children}</div>
        <div className="flex justify-end gap-3 p-4 border-t dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={onSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// 表单输入组件
interface FormInputProps {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
    />
  </div>
);

// 表单选择组件
interface FormSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
