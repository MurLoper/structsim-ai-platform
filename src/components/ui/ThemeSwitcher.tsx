import { useTheme, type Theme } from '@/hooks/useTheme';
import { Sun, Moon, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const themeConfig: Record<
  Theme,
  {
    icon: typeof Sun;
    label: string;
    description: string;
  }
> = {
  light: {
    icon: Sun,
    label: '亮色',
    description: '亮色模式',
  },
  dark: {
    icon: Moon,
    label: '暗色',
    description: '暗色模式',
  },
  eyecare: {
    icon: Eye,
    label: '护眼',
    description: '护眼模式',
  },
};

interface ThemeSwitcherProps {
  /** 是否显示标签文字 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 主题切换组件
 *
 * 支持三种模式: 亮色 / 暗色 / 护眼
 * 点击循环切换，支持动画效果
 *
 * @example
 * ```tsx
 * // 仅图标
 * <ThemeSwitcher />
 *
 * // 带标签
 * <ThemeSwitcher showLabel />
 *
 * // 小尺寸
 * <ThemeSwitcher size="sm" />
 * ```
 */
export function ThemeSwitcher({ showLabel = false, className, size = 'md' }: ThemeSwitcherProps) {
  const { theme, toggleTheme, getThemeName } = useTheme();

  const config = themeConfig[theme];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'p-1.5 h-7 w-7',
    md: 'p-2 h-9 w-9',
    lg: 'p-2.5 h-11 w-11',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg',
        'bg-secondary text-secondary-foreground',
        'hover:bg-secondary/80 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        showLabel ? 'px-3' : sizeClasses[size],
        className
      )}
      title={getThemeName()}
      aria-label={`切换主题，当前: ${getThemeName()}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 180, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className={iconSizes[size]} />
      </motion.div>
      {showLabel && <span className="text-sm font-medium">{config.label}</span>}
    </motion.button>
  );
}

/**
 * 主题选择器下拉菜单
 * 显示所有主题选项，点击直接切换
 */
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(Object.keys(themeConfig) as Theme[]).map(t => {
        const config = themeConfig[t];
        const Icon = config.icon;
        const isActive = theme === t;

        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-left',
              'transition-colors hover:bg-accent',
              isActive && 'bg-accent text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <div className="flex-1">
              <div className="text-sm font-medium">{config.label}</div>
              <div className="text-xs text-muted-foreground">{config.description}</div>
            </div>
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
