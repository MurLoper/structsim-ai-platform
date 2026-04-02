export const managementModalOverlayClass =
  'fixed inset-0 bg-black/50 flex items-center justify-center z-50';

export const managementModalPanelClass = 'rounded-xl border border-border bg-card shadow-2xl';

export const managementFieldClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground';

export const managementSearchInputClass = `${managementFieldClass} pl-10 pr-4`;

export const managementPrimaryButtonClass =
  'flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90';

export const managementPrimaryButtonDisabledClass = `${managementPrimaryButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`;

export const managementSecondaryButtonClass =
  'rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-muted';

export const managementInlineInputClass =
  'rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground';

export const managementTableInputClass =
  'w-full rounded border border-border bg-background px-1.5 py-1 text-xs text-foreground';
