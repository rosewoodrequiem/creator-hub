import type { FC } from 'react'
import ElegantBlue from './elegant-blue/ElegantBlue'
import type { TemplateId } from '../types/Template'

export type PreviewProps = {
  captureId?: string
}

export type PreviewEntry = {
  id: TemplateId
  component: FC<PreviewProps>
}

export const PREVIEWS: Record<TemplateId, PreviewEntry> = {
  ElegantBlue: { id: 'ElegantBlue', component: ElegantBlue },
}
