type SubmissionQuickActionMode = 'params' | 'output' | 'solver' | 'careDevices';

interface SubmissionQuickActionsProps {
  isVisible: boolean;
  isDrawerOpen: boolean;
  activeMode: string;
  t: (key: string) => string;
  onOpenMode: (mode: SubmissionQuickActionMode) => void;
}

const QUICK_ACTIONS: Array<{
  mode: SubmissionQuickActionMode;
  labelKey: string;
  icon: string;
}> = [
  { mode: 'params', labelKey: 'sub.params_config', icon: '参' },
  { mode: 'output', labelKey: 'sub.output_config', icon: '出' },
  { mode: 'solver', labelKey: 'sub.solver_config', icon: '解' },
  { mode: 'careDevices', labelKey: 'sub.care_devices', icon: '器' },
];

export const SubmissionQuickActions = ({
  isVisible,
  isDrawerOpen,
  activeMode,
  t,
  onOpenMode,
}: SubmissionQuickActionsProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      {QUICK_ACTIONS.map(action => (
        <button
          key={action.mode}
          title={t(action.labelKey)}
          onClick={() => onOpenMode(action.mode)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95 ${
            isDrawerOpen && activeMode === action.mode
              ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
              : 'bg-background border border-border hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};
