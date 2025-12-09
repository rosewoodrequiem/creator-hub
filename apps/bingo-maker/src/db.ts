import Dexie, { Table } from 'dexie'

export type CellRecord = {
  id: string
  imageData?: string
  caption?: string
  marked: boolean
}

const columns = ['B', 'I', 'N', 'G', 'O']
export const defaultCells: CellRecord[] = columns.flatMap(letter =>
  Array.from({ length: 5 }).map((_, index) => ({
    id: `${letter}${index + 1}`,
    marked: false,
    caption: '',
  })),
)

class BingoDB extends Dexie {
  cells!: Table<CellRecord, string>

  constructor() {
    super('bingo-maker')
    this.version(2).stores({
      cells: '&id',
    })
  }
}

export const db = new BingoDB()

export const ensureSeed = async () => {
  const count = await db.cells.count()
  if (count > 0) return
  await db.cells.bulkPut(defaultCells)
}

export const loadCells = async (): Promise<CellRecord[]> => {
  await ensureSeed()
  const rows = await db.cells.orderBy('id').toArray()
  return rows
}

export const saveCell = async (cell: CellRecord) => {
  await db.cells.put(cell)
}
