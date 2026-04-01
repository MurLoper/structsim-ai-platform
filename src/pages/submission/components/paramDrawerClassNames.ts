export const drawerSelectClass =
  'w-full p-3 border rounded-lg bg-background text-foreground border-input';

export const drawerCompactSelectClass =
  'flex-1 p-2.5 border rounded-lg bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring text-sm';

export const drawerActionLinkClass =
  'flex items-center gap-1 text-xs text-primary hover:text-primary/80';

export const drawerDangerIconButtonClass = 'p-1 text-destructive hover:bg-destructive/10 rounded';

export const drawerDangerIconButtonDisabledClass = `${drawerDangerIconButtonClass} disabled:opacity-30 disabled:cursor-not-allowed`;

export const drawerSegmentButtonClass = (active: boolean) =>
  `flex-1 py-2 text-sm font-medium rounded-md transition-all ${
    active ? 'bg-card shadow text-primary' : 'text-muted-foreground'
  }`;

export const drawerOptionCardClass = (active: boolean) =>
  `p-3 rounded-lg border-2 transition-all ${
    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
  }`;

export const drawerUploadButtonClass =
  'w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors';

export const tableHeaderCellClass = 'px-2 py-2 border-r border-border text-center';
export const tableBodyCellClass = 'px-1 py-1 border-r border-border';
export const tableBodyActionCellClass = 'px-1 py-1 flex items-center justify-center';

export const verifyMessageClass = (success: boolean) =>
  `mt-2 text-xs px-3 py-2 rounded-lg ${
    success
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
  }`;
