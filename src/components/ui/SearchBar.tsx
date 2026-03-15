/**
 * 统一搜索栏组件
 *
 * 包含搜索图标、输入框、清除按钮和可选的搜索按钮
 * 自动跟随主题切换，使用语义化 CSS 变量
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={keyword}
 *   onChange={setKeyword}
 *   onSearch={handleSearch}
 *   placeholder="搜索参数名称或Key..."
 * />
 * ```
 */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** 当前搜索值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 点击搜索按钮或按 Enter 回调 */
  onSearch?: (value: string) => void;
  /** 是否显示搜索按钮 */
  showButton?: boolean;
  /** 搜索按钮文字 */
  buttonText?: string;
  /** 是否显示清除按钮 */
  clearable?: boolean;
  /** 外层容器类名 */
  wrapperClassName?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onSearch,
      showButton = true,
      buttonText = '搜索',
      clearable = true,
      placeholder = '搜索...',
      wrapperClassName,
      className,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(value);
      }
    };

    const handleClear = () => {
      onChange('');
      onSearch?.('');
    };

    return (
      <div className={cn('flex gap-2', wrapperClassName)}>
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'border border-input bg-background text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              'transition-colors',
              clearable && value && 'pr-9',
              className
            )}
            {...props}
          />
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {showButton && (
          <button
            type="button"
            onClick={() => onSearch?.(value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-muted text-foreground',
              'hover:bg-muted/80',
              'transition-colors'
            )}
          >
            {buttonText}
          </button>
        )}
      </div>
    );
  }
);
SearchBar.displayName = 'SearchBar';
