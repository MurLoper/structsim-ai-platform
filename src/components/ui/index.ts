/**
 * UI 组件库统一导出
 *
 * 所有页面应该从这里 import 组件，而不是直接引用原始文件
 *
 * 分层架构:
 * 1. 原子组件 (Primitives) — Input, Select, Button, Textarea, Checkbox, Switch
 * 2. 复合组件 (Compound)  — FormItem, SearchBar, Alert, Empty, Modal, Card
 * 3. 数据展示 (Display)   — Table, Badge, Tabs, Pagination
 * 4. 反馈组件 (Feedback)  — Toast, ConfirmDialog, Loading
 */

// ============================================================
// 🧱 原子组件 — 基础表单控件（from forms/FormInputs, 唯一真实来源）
// ============================================================
export {
  Input,
  NumberInput,
  Select,
  Textarea,
  Checkbox,
  Switch,
  type InputProps,
  type NumberInputProps,
  type SelectProps,
  type TextareaProps,
  type CheckboxProps,
  type SwitchProps,
} from '../forms/FormInputs';

export { Button } from './Button';

// ============================================================
// 🔗 复合组件 — 由原子组件组合而成
// ============================================================
export { FormItem, type FormItemProps } from './FormItem';
export { SearchBar, type SearchBarProps } from './SearchBar';
export { Alert, type AlertProps } from './Alert';
export { Empty, type EmptyProps } from './Empty';
export { Modal } from './Modal';
export { Card, CardHeader } from './Card';

// ============================================================
// 📊 数据展示
// ============================================================
export { Table } from './Table';
export { Tabs } from './Tabs';
export {
  Badge,
  StatusBadge,
  PRESET_LUCIDE_ICONS,
  EXTENDED_LUCIDE_ICONS,
  LUCIDE_ICON_MAP,
  getLucideIconByName,
} from './Badge';
export { default as Pagination } from './Pagination';

// ============================================================
// 💬 反馈组件
// ============================================================
export { Spinner, LoadingOverlay, PageLoader } from './Loading';
export { ToastProvider, useToast } from './Toast';
export { ConfirmDialog, useConfirmDialog } from './ConfirmDialog';

// ============================================================
// 🎨 主题
// ============================================================
export { ThemeSwitcher, ThemeSelector } from './ThemeSwitcher';
