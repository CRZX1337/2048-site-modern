export type Direction = 'up' | 'right' | 'down' | 'left';
export type GameStatus = 'playing' | 'won' | 'over';
export type Position = { row: number; col: number };
export type Tile = { id: number; value: number; position: Position };
export type Cell = Tile | null;

export type GameState = {
  cells: Cell[];
  score: number;
  status: GameStatus;
  continued: boolean;
  nextId: number;
};

export type TileMove = { id: number; from: Position; to: Position };
export type TileMerge = { sources: number[]; result: Tile; value: number };
export type MoveTransition = {
  changed: boolean;
  moves: TileMove[];
  merges: TileMerge[];
  spawned?: Tile;
  scoreDelta: number;
  won: boolean;
  over: boolean;
};
export type MoveResult = { state: GameState; transition: MoveTransition };
export type RandomSource = () => number;

const SIZE = 4;
const index = (row: number, col: number) => row * SIZE + col;
const clonePosition = (p: Position): Position => ({ ...p });
const emptyCells = (cells: Cell[]) => cells.flatMap((cell, i) => cell ? [] : [i]);

export function createGame(random: RandomSource = Math.random): GameState {
  let state: GameState = { cells: Array<Cell>(16).fill(null), score: 0, status: 'playing', continued: false, nextId: 1 };
  state = spawn(state, random).state;
  return spawn(state, random).state;
}

function spawn(state: GameState, random: RandomSource): { state: GameState; tile: Tile } {
  const available = emptyCells(state.cells);
  const cellIndex = available[Math.floor(random() * available.length)];
  const row = Math.floor(cellIndex / SIZE);
  const col = cellIndex % SIZE;
  const tile: Tile = { id: state.nextId, value: random() < 0.9 ? 2 : 4, position: { row, col } };
  const cells = state.cells.slice();
  cells[cellIndex] = tile;
  return { state: { ...state, cells, nextId: state.nextId + 1 }, tile };
}

const linePositions = (direction: Direction, line: number): Position[] => {
  const positions: Position[] = [];
  for (let step = 0; step < SIZE; step++) {
    if (direction === 'left') positions.push({ row: line, col: step });
    if (direction === 'right') positions.push({ row: line, col: SIZE - 1 - step });
    if (direction === 'up') positions.push({ row: step, col: line });
    if (direction === 'down') positions.push({ row: SIZE - 1 - step, col: line });
  }
  return positions;
};

export function move(game: GameState, direction: Direction, random: RandomSource = Math.random): MoveResult {
  if (game.status !== 'playing') return { state: game, transition: emptyTransition() };
  const cells = Array<Cell>(16).fill(null);
  const moves: TileMove[] = [];
  const merges: TileMerge[] = [];
  let scoreDelta = 0;

  for (let line = 0; line < SIZE; line++) {
    const positions = linePositions(direction, line);
    const tiles = positions.map(p => game.cells[index(p.row, p.col)]).filter((tile): tile is Tile => tile !== null);
    let destination = 0;
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const target = positions[destination];
      const next = tiles[i + 1];
      if (next && next.value === tile.value) {
        const result: Tile = { id: tile.id, value: tile.value * 2, position: clonePosition(target) };
        const fromNext = clonePosition(next.position);
        moves.push({ id: tile.id, from: clonePosition(tile.position), to: clonePosition(target) });
        moves.push({ id: next.id, from: fromNext, to: clonePosition(target) });
        merges.push({ sources: [tile.id, next.id], result, value: result.value });
        cells[index(target.row, target.col)] = result;
        scoreDelta += result.value;
        i++;
      } else {
        const placed: Tile = { ...tile, position: clonePosition(target) };
        moves.push({ id: tile.id, from: clonePosition(tile.position), to: clonePosition(target) });
        cells[index(target.row, target.col)] = placed;
      }
      destination++;
    }
  }

  const changed = moves.some(m => m.from.row !== m.to.row || m.from.col !== m.to.col) || merges.length > 0;
  if (!changed) {
    if (!hasMoves(game.cells)) {
      const overState = { ...game, status: 'over' as const };
      return { state: overState, transition: { ...emptyTransition(), over: true } };
    }
    return { state: game, transition: emptyTransition() };
  }
  let nextState: GameState = { ...game, cells, score: game.score + scoreDelta };
  let spawned: Tile | undefined;
  if (emptyCells(cells).length > 0) {
    const result = spawn(nextState, random);
    nextState = result.state;
    spawned = result.tile;
  }
  const won = !game.continued && cells.some(t => t?.value === 2048);
  if (won) nextState = { ...nextState, status: 'won' };
  const over = !won && !hasMoves(nextState.cells);
  if (over) nextState = { ...nextState, status: 'over' };
  return { state: nextState, transition: { changed: true, moves, merges, spawned, scoreDelta, won, over } };
}

export function continueGame(game: GameState): GameState {
  return game.status === 'won' ? { ...game, status: 'playing', continued: true } : game;
}

export function hasMoves(cells: Cell[]): boolean {
  if (cells.some(cell => cell === null)) return true;
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
    const value = cells[index(row, col)]?.value;
    if (col < 3 && value === cells[index(row, col + 1)]?.value) return true;
    if (row < 3 && value === cells[index(row + 1, col)]?.value) return true;
  }
  return false;
}

function emptyTransition(): MoveTransition { return { changed: false, moves: [], merges: [], scoreDelta: 0, won: false, over: false }; }

export function describe(game: GameState): string {
  const tiles = game.cells.filter((tile): tile is Tile => tile !== null).map(tile => `${tile.value} at row ${tile.position.row + 1}, column ${tile.position.col + 1}`);
  return tiles.length ? tiles.join(', ') : 'empty board';
}
