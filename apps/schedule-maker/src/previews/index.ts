import type { FC } from 'react'

import type { TemplateId } from '../types/Template'

import ElegantBlue from './elegant-blue/ElegantBlue'

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
