import { useEffect, useMemo, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import type { AppManifestEntry } from './types'

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #050816;
    color: #f7f9fb;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    min-height: 100vh;
    background: radial-gradient(circle at 20% 20%, #1d1c48, transparent 30%),
      radial-gradient(circle at 80% 0%, #113b5c, transparent 32%),
      radial-gradient(circle at 90% 80%, #2d1b42, transparent 28%),
      #050816;
  }
`

const Page = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 24px 96px;
`

const Eyebrow = styled.p`
  display: inline-flex;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.03);
  color: #c5d2ff;
  margin: 0;
`

const Title = styled.h1`
  font-size: 42px;
  margin: 12px 0 12px;
  letter-spacing: -0.03em;
`

const Lede = styled.p`
  color: #ced8e8;
  margin: 0;
  line-height: 1.6;
  code {
    background: rgba(255, 255, 255, 0.08);
    padding: 3px 6px;
    border-radius: 6px;
    color: #e4e7f1;
  }
`

const Grid = styled.section`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  margin-top: 32px;
`

const CardBase = styled.div`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 20px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), transparent),
    rgba(255, 255, 255, 0.03);
  color: inherit;
  text-decoration: none;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 150ms ease, border-color 150ms ease,
    box-shadow 150ms ease;
`

const LaunchCard = styled(CardBase)`
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(99, 160, 255, 0.8);
    box-shadow: 0 18px 50px rgba(7, 13, 40, 0.6);
  }
`

const MutedCard = styled(CardBase)`
  opacity: 0.75;
  cursor: default;
  pointer-events: none;
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 22px;
`

const CardDescription = styled.p`
  margin: 0;
  color: #c8d5e6;
  line-height: 1.5;
`

const Pill = styled.div`
  display: inline-flex;
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 999px;
  background: #1f573f;
  color: #d7ffef;
  font-weight: 600;
  letter-spacing: 0.02em;
  font-size: 13px;
`

const MutedPill = styled(Pill)`
  background: rgba(255, 255, 255, 0.08);
  color: #e4e7f1;
`

const Cta = styled.span`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a8c4ff;
  font-weight: 600;
  letter-spacing: 0.01em;
`

const Footnote = styled.p`
  margin-top: 28px;
  color: #9fb2d5;
  font-size: 14px;
  line-height: 1.6;
`

const Status = styled.div`
  margin-top: 24px;
  color: #c8d5e6;
`

const AppLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const AppView = ({ app }: { app: AppManifestEntry }) => {
  if (app.status === 'available' && app.href) {
    return (
      <LaunchCard as="a" href={app.href} aria-label={`Open ${app.title}`}>
        <Pill>Available</Pill>
        <CardTitle>{app.title}</CardTitle>
        <CardDescription>{app.description}</CardDescription>
        <Cta>Open app →</Cta>
      </LaunchCard>
    )
  }

  return (
    <MutedCard aria-label={`${app.title} coming soon`}>
      <MutedPill>Coming soon</MutedPill>
      <CardTitle>{app.title}</CardTitle>
      <CardDescription>{app.description}</CardDescription>
      <Cta>In progress</Cta>
    </MutedCard>
  )
}

const App = () => {
  const [apps, setApps] = useState<AppManifestEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('./apps-manifest.json', {
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!response.ok) throw new Error('Manifest unavailable')

        const manifest = (await response.json()) as AppManifestEntry[]
        setApps(manifest)
      } catch (err) {
        setError('Unable to load apps manifest')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const hasApps = useMemo(() => apps.length > 0, [apps])

  return (
    <>
      <GlobalStyle />
      <Page>
        <AppLayout>
          <header>
            <Eyebrow>Creator Hub</Eyebrow>
            <Title>Pick an app to launch</Title>
            <Lede>
              Your tools, all in one place. Open what’s ready today and keep an
              eye on what’s coming next.
            </Lede>
          </header>

          {loading && <Status>Loading apps…</Status>}
          {!loading && error && <Status>{error}</Status>}

          {!loading && !error && hasApps && (
            <Grid>
              {apps.map(app => (
                <AppView key={app.name} app={app} />
              ))}
            </Grid>
          )}

          {!loading && !error && !hasApps && (
            <Status>
              No apps available yet. Check back soon for new tools.
            </Status>
          )}

          <Footnote>
            This hub will grow as new apps are added.
          </Footnote>
        </AppLayout>
      </Page>
    </>
  )
}

export default App
