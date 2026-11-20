"use client";

interface Props {
  percent: number;
  stage: string;
  onCancel: () => void;
}

export function ProcessingProgress({ percent, stage, onCancel }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{stage}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
      >
        Cancel
      </button>
    </div>
  );
}
