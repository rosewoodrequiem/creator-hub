import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import { CellRecord, defaultCells, loadCells, saveCell } from './db'

type Mode = 'view' | 'edit'

const columns = ['B', 'I', 'N', 'G', 'O']
const FREE_CELL_ID = 'N3'
const cellOrder = columns.flatMap((letter) =>
  Array.from({ length: 5 }).map((_, index) => `${letter}${index + 1}`),
)

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: dark;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #050816;
    color: #f7f9fb;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    min-height: 100vh;
    overflow: hidden;
    background: radial-gradient(circle at 20% 20%, #1d1c48, transparent 30%),
      radial-gradient(circle at 80% 0%, #113b5c, transparent 32%),
      radial-gradient(circle at 90% 80%, #2d1b42, transparent 28%),
      #050816;
  }
`

const Page = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 16px 12px 12px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow: hidden;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 64px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const Title = styled.h1`
  margin: 0;
  font-size: 34px;
  letter-spacing: -0.02em;
`

const Subhead = styled.p`
  margin: 6px 0 0;
  color: #c7d3e9;
`

const Actions = styled.div`
  display: flex;
  gap: 10px;
`

const Button = styled.button<{ variant?: 'ghost' | 'solid' }>`
  border: 1px solid
    ${({ variant }) =>
      variant === 'ghost' ? 'rgba(255, 255, 255, 0.18)' : '#6fa8ff'};
  background: ${({ variant }) =>
    variant === 'ghost'
      ? 'transparent'
      : 'linear-gradient(135deg, #6fa8ff, #9dd3ff)'};
  color: ${({ variant }) => (variant === 'ghost' ? '#d9e5ff' : '#041024')};
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    opacity 120ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  }

  &:active {
    transform: translateY(0);
    opacity: 0.9;
  }
`

const Grid = styled.div`
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(5, 150px);
  grid-auto-rows: 150px;
  width: fit-content;
  max-width: 100%;
  align-items: stretch;
  align-content: start;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(255, 255, 255, 0.08),
      transparent 30%
    ),
    radial-gradient(circle at 80% 0%, rgba(140, 72, 255, 0.3), transparent 32%),
    rgba(255, 255, 255, 0.02);
  border-radius: 24px;
  padding: 12px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  height: 100%;
  max-height: calc(100vh - 150px);
`

const BoardArea = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  gap: 6px;
  padding-bottom: 6px;
`

const CellFrame = styled.div<{ isMarked: boolean; isFree?: boolean }>`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  border: ${({ isFree }) =>
    isFree ? 'none' : '1px solid rgba(255, 255, 255, 0.15)'};
  background: ${({ isFree }) =>
    isFree
      ? 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.12), rgba(255,255,255,0.02))'
      : 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))'};
  box-shadow: ${({ isFree }) =>
    isFree
      ? 'none'
      : `inset 0 0 0 1px rgba(255, 255, 255, 0.02),
    0 12px 32px rgba(0,0,0,0.3)`};
  transition:
    border-color 120ms ease,
    transform 120ms ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(111, 168, 255, 0.8);
  }

  ${({ isMarked }) =>
    isMarked
      ? `
    border-color: rgba(255, 255, 255, 0.45);
  `
      : ''}
`

const ImageLayer = styled.div<{ src?: string }>`
  position: absolute;
  inset: 0;
  background: ${({ src }) =>
    src
      ? `center / cover no-repeat url(${src})`
      : 'radial-gradient(circle, #1e2840 0%, #0d1626 100%)'};
  display: grid;
  place-items: center;
  color: #d8e3ff;
  text-align: center;
  padding: 16px;
`

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 70%;
    height: 12px;
    background: #ff4d6d;
    border-radius: 999px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
`

const Placeholder = styled.div`
  display: grid;
  gap: 4px;
  text-align: center;
  color: #b9c7e4;
  font-size: 14px;
  font-weight: 600;
`

const Status = styled.div`
  margin-top: 18px;
  color: #c7d3e9;
`

const ModeBadge = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-weight: 700;
  letter-spacing: 0.05em;
  font-size: 12px;
`

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const ColumnHeaderRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 150px);
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 4px;
  padding: 0;
  color: #dfe6ff;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-align: center;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
`

const Caption = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 18px;
  color: #e6eeff;
  font-weight: 700;
  line-height: 1.25;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
`

const emptyCell = (id: string): CellRecord => ({
  id,
  marked: false,
  caption: '',
})

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })

const App = () => {
  const [cells, setCells] = useState<CellRecord[]>(defaultCells)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>(
    window.location.pathname.includes('/config') ? 'edit' : 'view',
  )

  useEffect(() => {
    const handlePop = () => {
      setMode(window.location.pathname.includes('/config') ? 'edit' : 'view')
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  useEffect(() => {
    const hydrate = async () => {
      const rows = await loadCells()
      setCells(rows)
      setLoading(false)
    }
    hydrate()
  }, [])

  const orderedCells = useMemo(
    () =>
      cellOrder.map(
        (id) => cells.find((cell) => cell.id === id) ?? emptyCell(id),
      ),
    [cells],
  )

  const setRoute = (next: Mode) => {
    const nextPath = next === 'edit' ? './config' : './'
    window.history.pushState({}, '', nextPath)
    setMode(next)
  }

  const updateCell = async (id: string, updates: Partial<CellRecord>) => {
    const existing = cells.find((cell) => cell.id === id) ?? emptyCell(id)
    const nextCell: CellRecord = { ...existing, ...updates }
    await saveCell(nextCell)
    setCells((current) =>
      current.map((cell) => (cell.id === id ? nextCell : cell)),
    )
  }

  const handleFile = async (id: string, file: File) => {
    const dataUrl = await toDataUrl(file)
    updateCell(id, { imageData: dataUrl })
  }

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    id: string,
  ) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    handleFile(id, file)
  }

  const handleUploadClick = (input: HTMLInputElement | null) => input?.click()

  const toggleMark = (id: string) => {
    const current = cells.find((cell) => cell.id === id) ?? emptyCell(id)
    updateCell(id, { marked: !current.marked })
  }

  return (
    <>
      <GlobalStyle />
      <Page>
        <Header>
          <div>
            <Title>Game Awards Bingo</Title>
            <Subhead></Subhead>
          </div>
          <ToggleRow>
            <ModeBadge>{mode === 'edit' ? 'Edit mode' : 'Live mode'}</ModeBadge>
            <Actions>
              <Button variant="ghost" onClick={() => setRoute('view')}>
                View board
              </Button>
              <Button onClick={() => setRoute('edit')}>Configure</Button>
            </Actions>
          </ToggleRow>
        </Header>

        <BoardArea>
          <ColumnHeaderRow>
            {columns.map((letter) => (
              <span key={letter}>{letter}</span>
            ))}
          </ColumnHeaderRow>

          {loading && <Status>Loading your board…</Status>}

          {!loading && (
            <Grid>
            {orderedCells.map((cell) =>
              mode === 'edit' ? (
                <EditCell
                  key={cell.id}
                  cell={cell}
                  onDrop={handleDrop}
                  onFile={handleFile}
                  onUploadClick={handleUploadClick}
                />
              ) : (
                <ViewCell
                  key={cell.id}
                  cell={cell}
                    onToggle={() => toggleMark(cell.id)}
                  />
                ),
              )}
            </Grid>
          )}
        </BoardArea>
      </Page>
    </>
  )
}

const EditCell = ({
  cell,
  onDrop,
  onFile,
  onUploadClick,
}: {
  cell: CellRecord
  onDrop: (event: React.DragEvent<HTMLDivElement>, id: string) => void
  onFile: (id: string, file: File) => void
  onUploadClick: (input: HTMLInputElement | null) => void
}) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isFree = cell.id === FREE_CELL_ID

  return (
    <CellFrame
      isMarked={false}
      isFree={isFree}
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        setDragOver(false)
        onDrop(event, cell.id)
      }}
      onClick={() => onUploadClick(fileInputRef.current)}
    >
      <ImageLayer src={cell.imageData}>
        {!cell.imageData && (
          <Placeholder>
            <span>Click or drop an image</span>
          </Placeholder>
        )}
        {!cell.imageData && <Caption>{isFree ? 'Free Space' : cell.id}</Caption>}
      </ImageLayer>
      {dragOver && <Overlay>Drop to set</Overlay>}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(cell.id, file)
          event.target.value = ''
        }}
        ref={fileInputRef}
      />
    </CellFrame>
  )
}

const ViewCell = ({
  cell,
  onToggle,
}: {
  cell: CellRecord
  onToggle: () => void
}) => {
  const isFree = cell.id === FREE_CELL_ID

  return (
    <CellFrame isMarked={cell.marked} isFree={isFree} onClick={onToggle}>
      <ImageLayer src={cell.imageData}>
        {!cell.imageData && <Caption>{isFree ? 'Free Space' : cell.id}</Caption>}
      </ImageLayer>
      {/* Hide cell badges in view mode */}
      {cell.marked && <Overlay>×</Overlay>}
    </CellFrame>
  )
}

export default App
