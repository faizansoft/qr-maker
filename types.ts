
export type QRType = 'url' | 'text' | 'email' | 'phone' | 'vcard';

export type DotType = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
export type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
export type CornerDotType = 'square' | 'dot';

export interface QRConfig {
  value: string;
  fgColor: string;
  bgColor: string;
  level: 'L' | 'M' | 'Q' | 'H';
  size: number;
  includeMargin: boolean;
  // Styling Options
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  cornerSquareColor: string;
  cornerDotColor: string;
  image?: string;
}

export interface StylePreset {
  id: string;
  name: string;
  fgColor: string;
  bgColor: string;
  className: string;
}

export interface AIStyleSuggestion {
  primaryColor: string;
  secondaryColor: string;
  cornerSquareColor: string;
  cornerDotColor: string;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  mood: string;
  description: string;
}
