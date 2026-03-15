/**
 * StructSim UI 组件库 — 统一导出
 *
 * 基于 shadcn/radix + Tailwind CSS 变量体系
 * 参考 Element UI / Ant Design 组件设计，构建自有风格组件库
 *
 * 所有页面应从 @/components/ui 导入组件，禁止直接写原生 HTML 表单元素
 *
 * 分层架构:
 * 1. 原子组件 (Primitives) — 基础表单控件
 * 2. 复合组件 (Compound)   — 由原子组件组合
 * 3. 数据展示 (Display)    — 表格/标签/徽章
 * 4. 导航组件 (Navigation) — 标签页/下拉/分页
 * 5. 反馈组件 (Feedback)   — 弹窗/提示/加载
 * 6. 布局组件 (Layout)     — 分割线/折叠面板
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
export { RadioGroup, type RadioGroupProps, type RadioOption } from './RadioGroup';

// ============================================================
// 🔗 复合组件 — 由原子组件组合而成
// ============================================================
export { FormItem, type FormItemProps } from './FormItem';
export { SearchBar, type SearchBarProps } from './SearchBar';
export { Alert, type AlertProps } from './Alert';
export { Empty, type EmptyProps } from './Empty';
export { Modal } from './Modal';
export { Drawer, type DrawerProps } from './Drawer';
export { Card, CardHeader } from './Card';
export { Tooltip, type TooltipProps } from './Tooltip';

// ============================================================
// 📊 数据展示
// ============================================================
export { Table } from './Table';
export { Tag, type TagProps } from './Tag';
export {
  Badge,
  StatusBadge,
  PRESET_LUCIDE_ICONS,
  EXTENDED_LUCIDE_ICONS,
  LUCIDE_ICON_MAP,
  getLucideIconByName,
} from './Badge';
export { Progress } from './progress';

// ============================================================
// 🧭 导航组件
// ============================================================
export { Tabs } from './Tabs';
export { Dropdown, type DropdownProps, type DropdownItem } from './Dropdown';
export { default as Pagination } from './Pagination';

// ============================================================
// 💬 反馈组件
// ============================================================
export { Spinner, LoadingOverlay, PageLoader } from './Loading';
export { ToastProvider, useToast } from './Toast';
export { ConfirmDialog, useConfirmDialog } from './ConfirmDialog';

// ============================================================
// 📐 布局组件
// ============================================================
export { Divider, type DividerProps } from './Divider';
export { Collapse, CollapseItem, type CollapseProps, type CollapseItemProps } from './Collapse';

// ============================================================
// 🎨 主题
// ============================================================
export { ThemeSwitcher, ThemeSelector } from './ThemeSwitcher';
