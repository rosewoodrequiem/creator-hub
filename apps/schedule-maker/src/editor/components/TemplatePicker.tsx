import { ColorPalette } from '@creator-hub/ui-kit'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import type { TemplateId } from '../../types/Template'

export default function TemplatePicker() {
  const template = useLiveQuery(() => db.currentTemplate)
  const themes = useLiveQuery(() => db.themes.toArray())
  const activeTemplate = template ?? themes?.[0]?.slug ?? 'ElegantBlue'
  const activeTheme =
    themes?.find((theme) => theme.slug === activeTemplate) ?? themes?.[0]

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Theme</span>
        <select
          className="rounded-xl border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
          value={activeTemplate}
          onChange={async (e) => {
            await db.setCurrentTemplate(e.target.value as TemplateId)
          }}
        >
          {themes?.map((theme) => (
            <option key={theme.id} value={theme.slug}>
              {theme.name}
            </option>
          )) ?? <option value={activeTemplate}>{activeTemplate}</option>}
        </select>
      </label>

      {activeTheme && (
        <ColorPalette
          title="Palette"
          colors={activeTheme.colors.map((color) => ({
            label: color.label,
            value: color.value,
          }))}
        />
      )}
    </div>
  )
}
