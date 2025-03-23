export interface GridConfig {
  playingField: {
    cols: number
    rows: number
  }
  extraSpace: {
    cols: number  // Additional columns (1 for row numbers, 1 for empty column)
    rows: number  // Additional rows (1 for column labels, 1 for empty row, 1 for goals)
  }
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  playingField: {
    cols: 10,
    rows: 16
  },
  extraSpace: {
    cols: 2,  // 1 for row numbers + 1 empty column
    rows: 3   // 1 for column labels + 1 empty row + 1 for goals
  }
}

// Computed dimensions
export const getTotalDimensions = (config: GridConfig) => ({
  totalCols: config.playingField.cols + config.extraSpace.cols,
  totalRows: config.playingField.rows + config.extraSpace.rows
}) 