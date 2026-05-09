// 5x7 pixel font. Each character is an array of 7 rows, each row is a 5-bit number.
// Bit 4 is leftmost pixel, bit 0 is rightmost.
// Designed to look like the chunky LED matrix font in classic ticker displays.

const FONT_5x7 = {
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  'G': [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'I': [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  'N': [0b10001, 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'S': [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  'Y': [0b10001, 0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100],
  ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b01000],
  '+': [0b00000, 0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100],
  '-': [0b00000, 0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000],
  '%': [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  '$': [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  ':': [0b00000, 0b00100, 0b00100, 0b00000, 0b00100, 0b00100, 0b00000],
  '/': [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
};

export const CHAR_WIDTH = 5;
export const CHAR_HEIGHT = 7;
export const CHAR_SPACING = 1;

// 3×5 mini font — for compact secondary labels like percent change
const SMALL_FONT_3x5 = {
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b011, 0b010, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b011, 0b100, 0b111],
  '3': [0b111, 0b001, 0b011, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b110, 0b001, 0b110],
  '6': [0b011, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b110],
  '+': [0b000, 0b010, 0b111, 0b010, 0b000],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  '.': [0b000, 0b000, 0b000, 0b000, 0b010],
  '%': [0b101, 0b001, 0b010, 0b100, 0b101],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
};

export const SMALL_CHAR_WIDTH = 3;
export const SMALL_CHAR_HEIGHT = 5;
export const SMALL_CHAR_SPACING = 1;

export function smallTextWidth(str) {
  if (!str || str.length === 0) return 0;
  return str.length * SMALL_CHAR_WIDTH + (str.length - 1) * SMALL_CHAR_SPACING;
}

export function drawSmallText(buffer, str, x, y, color) {
  let cx = x;
  for (const c of str) {
    const glyph = SMALL_FONT_3x5[c] || SMALL_FONT_3x5[' '];
    for (let row = 0; row < SMALL_CHAR_HEIGHT; row++) {
      const bits = glyph[row];
      for (let col = 0; col < SMALL_CHAR_WIDTH; col++) {
        if (bits & (1 << (SMALL_CHAR_WIDTH - 1 - col))) {
          const py = y + row;
          const px = cx + col;
          if (buffer[py] && px >= 0 && px < buffer[py].length) {
            buffer[py][px] = color;
          }
        }
      }
    }
    cx += SMALL_CHAR_WIDTH + SMALL_CHAR_SPACING;
  }
}

export function getChar(c) {
  return FONT_5x7[c.toUpperCase()] || FONT_5x7[' '];
}

// Returns the pixel width of a string when rendered
export function textWidth(str) {
  if (!str || str.length === 0) return 0;
  return str.length * CHAR_WIDTH + (str.length - 1) * CHAR_SPACING;
}

// Draws a character into a 2D pixel buffer at (x, y) with a given color.
// buffer is a 2D array: buffer[y][x] = color or null
export function drawChar(buffer, c, x, y, color) {
  const glyph = getChar(c);
  for (let row = 0; row < CHAR_HEIGHT; row++) {
    const bits = glyph[row];
    for (let col = 0; col < CHAR_WIDTH; col++) {
      if (bits & (1 << (CHAR_WIDTH - 1 - col))) {
        const py = y + row;
        const px = x + col;
        if (buffer[py] && px >= 0 && px < buffer[py].length) {
          buffer[py][px] = color;
        }
      }
    }
  }
}

export function drawText(buffer, str, x, y, color) {
  let cx = x;
  for (const c of str) {
    drawChar(buffer, c, cx, y, color);
    cx += CHAR_WIDTH + CHAR_SPACING;
  }
}
