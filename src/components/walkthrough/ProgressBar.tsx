type Props = {
  /** Position in the flow; `null` shows a full bar with no number (the normal end screen). */
  progress: { step: number; total: number } | null
}

function ProgressBar({ progress }: Props) {
  const percent = progress ? (progress.step / progress.total) * 100 : 100
  return (
    <div className="space-y-2">
      {progress && (
        <p className="text-sm font-semibold">
          Trin {progress.step} af {progress.total}
        </p>
      )}
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-gray-light">
        <div
          className="h-full rounded-full bg-brand-gray-dark transition-[width] duration-400 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
