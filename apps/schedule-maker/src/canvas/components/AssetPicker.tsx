import { useId } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'

type AssetPickerProps = {
  selectedId?: number | null
  onSelect: (id?: number | null) => void
  label?: string
  allowClear?: boolean
}

export function AssetPicker({
  selectedId,
  onSelect,
  label = 'Assets',
  allowClear = true,
}: AssetPickerProps) {
  const inputId = useId()
  const assets = useLiveQuery(() => db.images.toArray()) ?? []

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const id = await db.uploadImage(file)
    onSelect(id)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          {allowClear && selectedId != null && (
            <button
              type="button"
              className="text-[11px] font-medium text-pink-500 hover:underline"
              onClick={() => onSelect(undefined)}
            >
              Clear
            </button>
          )}
          <label
            htmlFor={inputId}
            className="cursor-pointer rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
          >
            Upload
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
          No images yet. Upload to get started.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset) => {
            const active = asset.id === selectedId
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelect(asset.id)}
                className="relative h-20 overflow-hidden rounded-lg border text-left"
                style={{
                  borderColor: active ? '#ec4899' : '#e2e8f0',
                  boxShadow: active ? '0 0 0 2px rgba(236,72,153,0.3)' : 'none',
                }}
              >
                <img
                  src={asset.data}
                  alt={asset.name ?? 'Asset'}
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
