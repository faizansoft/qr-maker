
import { StylePreset, DotType, CornerSquareType, CornerDotType } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  { id: 'classic', name: 'Classic Black', fgColor: '#000000', bgColor: '#FFFFFF', className: 'bg-white border-slate-200' },
  { id: 'ocean', name: 'Deep Ocean', fgColor: '#0f172a', bgColor: '#e0f2fe', className: 'bg-sky-50 border-sky-200' },
  { id: 'midnight', name: 'Midnight', fgColor: '#f8fafc', bgColor: '#020617', className: 'bg-slate-950 border-slate-800' },
  { id: 'sunset', name: 'Sunset Glow', fgColor: '#7c2d12', bgColor: '#fff7ed', className: 'bg-orange-50 border-orange-200' },
  { id: 'forest', name: 'Evergreen', fgColor: '#064e3b', bgColor: '#f0fdf4', className: 'bg-emerald-50 border-emerald-200' },
  { id: 'royal', name: 'Royal Purple', fgColor: '#4c1d95', bgColor: '#f5f3ff', className: 'bg-violet-50 border-violet-200' },
];

export const ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'Low (7%)' },
  { value: 'M', label: 'Medium (15%)' },
  { value: 'Q', label: 'Quartile (25%)' },
  { value: 'H', label: 'High (30%)' },
];

export const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'extra-rounded', label: 'Soft' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Elegant' },
];

export const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'extra-rounded', label: 'Rounded' },
  { value: 'dot', label: 'Dot' },
];

export const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
];
