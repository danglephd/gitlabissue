export interface Movie {
    id: string;              // Unique identifier (generated)
    fileName: string;        // Film name from CSV
    path: string;           // File path
    size: number;           // File size in bytes
    allocated: number;      // Allocated space in bytes
    modified: Date;         // Last modified date
    attributes: number;     // File attributes
    files: number;          // Number of files
    folders: number;        // Number of folders
    year?: number;          // Production year (extracted from fileName)
    createdAt: Date;        // When added to database
    isProcessed: boolean;   // Whether it has been processed
    deleted?: boolean;      // Soft delete flag (true = deleted, false/undefined = active)
    tags?: string[];        // Optional tags for categorization
}

export enum MovieFilterType {
    ALL = 'all',
    PROCESSED = 'processed',
    NOT_PROCESSED = 'not_processed'
}
