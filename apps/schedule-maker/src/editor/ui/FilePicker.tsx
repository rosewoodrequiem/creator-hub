import React from "react"

type Props = {
  label: string
  accept?: string
  onFile: (file?: File) => void
  buttonText?: string
}

export default function FilePicker({
  label,
  accept = "image/*",
  onFile,
  buttonText = "Select file",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-sm font-semibold">{label}</div>

      {/* Clickable button-like label */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-black/10 bg-[--color-brand] px-4 py-2 text-sm font-medium text-black shadow-sm transition hover:brightness-105 active:brightness-95"
      >
        {buttonText}
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
      />
    </div>
  )
}
