import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, EyeIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { ChevronDown } from 'lucide-react';
import { Dropdown } from '@/components/ui';
import type { User } from '@/types';

interface LayoutUserMenuProps {
  user: User | null;
  onLogout: () => void;
  compact?: boolean;
}

export function LayoutUserMenu({ user, onLogout, compact = false }: LayoutUserMenuProps) {
  const navigate = useNavigate();

  const displayName =
    user?.realName || user?.userName || user?.displayName || user?.domainAccount || '当前用户';
  const secondaryText = user?.domainAccount || user?.email || '';

  const items = useMemo(
    () => [
      {
        key: 'privacy',
        label: '查看隐私协议',
        icon: <EyeIcon className="h-4 w-4" />,
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <ArrowRightOnRectangleIcon className="h-4 w-4" />,
        danger: true,
      },
    ],
    []
  );

  return (
    <Dropdown
      items={items}
      placement="topRight"
      onSelect={key => {
        if (key === 'privacy') {
          navigate('/privacy');
          return;
        }
        if (key === 'logout') {
          onLogout();
        }
      }}
    >
      <button
        className={`flex w-full items-center rounded-xl text-left transition-colors hover:bg-muted ${
          compact ? 'justify-center p-2' : 'gap-3 px-2 py-1.5'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <UserCircleIcon className="h-6 w-6" />
        </div>
        {!compact && (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{secondaryText}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </>
        )}
      </button>
    </Dropdown>
  );
}
