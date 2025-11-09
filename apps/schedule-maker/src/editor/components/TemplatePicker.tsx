import { useLiveQuery } from 'dexie-react-hooks'

import { PREVIEWS } from '../../previews'
import { db } from '../../store/schedule-maker-db/ScheduleMakerDB'
import type { TemplateId } from '../../types/Template'

export default function TemplatePicker() {
  const template = useLiveQuery(() => db.currentTemplate)
  const activeTemplate = template ?? 'ElegantBlue'

  return (
    <label className="block text-xs">
      Preview style
      <select
        className="ml-2 rounded-lg border px-2 py-1"
        value={activeTemplate}
        onChange={async (e) => {
          await db.setCurrentTemplate(e.target.value as TemplateId)
        }}
      >
        {Object.values(PREVIEWS).map(({ id }) => (
          <option key={id} value={id}>
            {id.replace(/([A-Z])/g, ' $1').trim()}
          </option>
        ))}
      </select>
    </label>
  )
}
