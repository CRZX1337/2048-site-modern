import { appleTheme } from './apple';
import { glassTheme } from './glass';
import { materialTheme } from './material';
import { oldschoolTheme } from './oldschool';
import { modernTheme } from './modern';
import type { ThemeDefinition, ThemeName } from './types';

export const themeRegistry: Record<ThemeName, ThemeDefinition> = {
  apple: appleTheme,
  glass: glassTheme,
  material: materialTheme,
  oldschool: oldschoolTheme,
  modern: modernTheme
};
export const getTheme = (name: ThemeName): ThemeDefinition => themeRegistry[name];
export type { ThemeDefinition, ThemeName } from './types';
