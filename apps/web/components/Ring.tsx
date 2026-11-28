/** Circular progress ring. value/max may exceed 1: the ring then turns the warning colour. */
export function Ring({ value, max, size = 132, stroke = 12, label, sub, color }: { value: number; max: number | null; size?: number; stroke?: number; label: string; sub: string; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = max ? Math.min(1, value / max) : 1;
  const over = max !== null && value > max;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--warn)" : (color ?? "var(--brand)")}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * frac} ${c}`}
          style={{ transition: "stroke-dasharray .4s ease" }}
        />
      </svg>
      <div className="center">
        <b>{label}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}

export function MacroBar({ name, cls, value, target, unit = "g" }: { name: string; cls: string; value: number; target?: number | null; unit?: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 100;
  const v = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return (
    <div className="macro">
      <span className="lbl">
        <i className={cls} />
        {name}
      </span>
      <span className="val">
        {v}
        {target ? <small> / {target} {unit}</small> : <small> {unit}</small>}
      </span>
      <div className="track">
        <i className={cls} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
