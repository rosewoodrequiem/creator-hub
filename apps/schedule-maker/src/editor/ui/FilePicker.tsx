import React from "react";

type Props = {
  label: string;
  accept?: string;
  onFile: (file?: File) => void;
  buttonText?: string;
};

export default function FilePicker({
  label,
  accept = "image/*",
  onFile,
  buttonText = "Select file",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-sm font-semibold">{label}</div>

      {/* Clickable button-like label */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="
          inline-flex items-center justify-center
          px-4 py-2 rounded-lg
          bg-[--color-brand] text-black font-medium text-sm
          hover:brightness-105 active:brightness-95
          cursor-pointer transition shadow-sm border border-black/10
        "
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
  );
}
