export type AppStatus = 'available' | 'coming-soon'

export type AppManifestEntry = {
  name: string
  title: string
  description: string
  status: AppStatus
  href?: string
}
