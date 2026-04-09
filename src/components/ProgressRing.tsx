type ProgressRingProps = {
  value: number
  total: number
}

export function ProgressRing({ value, total }: ProgressRingProps) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const ratio = total <= 0 ? 0 : Math.min(1, value / total)
  const strokeDashoffset = circumference * (1 - ratio)

  return (
    <div className="progress-ring" aria-label={`진행률 ${value}/${total}`}>
      <svg viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="72" y2="72">
            <stop offset="0%" stopColor="#8fd3ff" />
            <stop offset="100%" stopColor="#8fffd1" />
          </linearGradient>
        </defs>
      </svg>
      <span className="progress-ring__label">
        {value}/{total}
      </span>
    </div>
  )
}
