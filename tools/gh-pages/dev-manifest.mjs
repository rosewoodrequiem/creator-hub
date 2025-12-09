import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)))
const configPath = path.join(root, 'apps.config.json')
const manifestPath = path.join(root, 'apps-manifest.json')

const devPorts = {
  'bingo-maker': 4173,
}

const readConfig = () => {
  try {
    const raw = readFileSync(configPath, 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Could not read apps.config.json for dev manifest', error)
    return {}
  }
}

const toManifest = config =>
  Object.entries(config).map(([name, value]) => {
    const port = devPorts[name]
    const href =
      value.status === 'available' && port
        ? `http://localhost:${port}/`
        : undefined

    return {
      name,
      title: value.title ?? name,
      description: value.description ?? '',
      status: value.status ?? 'coming-soon',
      href,
    }
  })

const writeManifest = manifest => {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`Dev manifest written to ${manifestPath}`)
}

const main = () => {
  const config = readConfig()
  const manifest = toManifest(config)
  writeManifest(manifest)
}

main()
