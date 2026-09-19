import type { GameState } from '../core/game';
import type { ThemeName } from '../themes/types';

export type AppState = { game: GameState; best: number; theme: ThemeName; dark: boolean; reducedMotion: boolean; standalone: boolean; sessionMoves: number; sessionMerges: number };
