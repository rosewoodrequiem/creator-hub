import Dexie, { Table } from 'dexie';
export type CellRecord = {
    id: string;
    imageData?: string;
    caption?: string;
    marked: boolean;
};
export declare const defaultCells: CellRecord[];
declare class BingoDB extends Dexie {
    cells: Table<CellRecord, string>;
    constructor();
}
export declare const db: BingoDB;
export declare const ensureSeed: () => Promise<void>;
export declare const loadCells: () => Promise<CellRecord[]>;
export declare const saveCell: (cell: CellRecord) => Promise<void>;
export {};
//# sourceMappingURL=db.d.ts.map