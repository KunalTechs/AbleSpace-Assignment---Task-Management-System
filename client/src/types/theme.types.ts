export type ThemeMode = 'light' | 'dark';
export type ColorAccent = 'amber' | 'blue' | 'pink' | 'rose' | 'emerald' | 'black';

export interface ThemeContextType {
  theme: ThemeMode;
  color: ColorAccent;
  setTheme: (theme: ThemeMode) => void;
  setColor: (color: ColorAccent) => void;
}
