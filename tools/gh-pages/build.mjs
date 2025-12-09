import { execSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const repoRoot = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  '..',
  '..',
)
const distRoot = path.join(repoRoot, 'dist')
const appsRoot = path.join(repoRoot, 'apps')
const run = (command, cwd = repoRoot) =>
  execSync(command, { stdio: 'inherit', cwd })

const loadAppConfig = () => {
  const configPath = path.join(repoRoot, 'tools', 'gh-pages', 'apps.config.json')
  if (!existsSync(configPath)) return {}

  try {
    const raw = readFileSync(configPath, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed ?? {}
  } catch (error) {
    console.warn('Could not parse apps.config.json', error)
    return {}
  }
}

const toTitleCase = value =>
  value
    .split(/[-_]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const discoverApps = appConfig =>
  readdirSync(appsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.endsWith('-e2e'))
    .map(entry => {
      const pkgPath = path.join(appsRoot, entry.name, 'package.json')
      const overrides = appConfig?.[entry.name] ?? {}
      let pkg = null

      if (existsSync(pkgPath)) {
        try {
          pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
        } catch (error) {
          console.warn(`Could not read package.json for ${entry.name}`, error)
        }
      }

      return {
        name: entry.name,
        title: overrides.title ?? pkg?.displayName ?? toTitleCase(entry.name),
        description:
          overrides.description ??
          pkg?.description ??
          `Launch ${toTitleCase(entry.name)}`,
        hasBuildScript: Boolean(pkg?.scripts?.build),
        statusOverride: overrides.status ?? null,
      }
    })

const prepareDistFolder = () => {
  rmSync(distRoot, { recursive: true, force: true })
  mkdirSync(path.join(distRoot, 'apps'), { recursive: true })
}

const buildPortal = () => {
  run('pnpm vite build --config tools/gh-pages/vite.config.ts', repoRoot)
}

const buildAndCopyApp = app => {
  if (app.statusOverride === 'coming-soon') {
    return { ...app, status: 'coming-soon' }
  }

  if (!app.hasBuildScript) {
    return { ...app, status: 'coming-soon' }
  }

  const prefixPath = path.join('apps', app.name).replace(/\\/g, '/')
  const appDist = path.join(appsRoot, app.name, 'dist')
  const appOutput = path.join(distRoot, 'apps', app.name)

  try {
    run(`pnpm --prefix "${prefixPath}" run build`, repoRoot)
  } catch (error) {
    console.warn(`Build failed for ${app.name}`, error)
    return { ...app, status: 'coming-soon' }
  }

  if (!existsSync(appDist)) {
    console.warn(`No dist folder found for ${app.name}`)
    return { ...app, status: 'coming-soon' }
  }

  cpSync(appDist, appOutput, { recursive: true })

  const result = {
    ...app,
    status: 'available',
    href: `./apps/${app.name}/`,
  }

  if (app.statusOverride === 'available') {
    return result
  }

  if (app.statusOverride === 'coming-soon') {
    return { ...result, status: 'coming-soon', href: undefined }
  }

  return result
}

const renderCard = app => {
  return {
    name: app.name,
    title: app.title,
    description: app.description,
    status: app.status,
    href: app.href,
  }
}

const writeManifest = apps =>
  writeFileSync(
    path.join(distRoot, 'apps-manifest.json'),
    JSON.stringify(apps.map(renderCard), null, 2),
    'utf8',
  )

const main = () => {
  prepareDistFolder()
  buildPortal()
  const config = loadAppConfig()
  const apps = discoverApps(config)
  const builtApps = apps.map(buildAndCopyApp)
  writeManifest(builtApps)
}

main()
