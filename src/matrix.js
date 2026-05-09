// Renders a pixel buffer as a glowing LED matrix on a canvas.

export class LEDMatrix {
  constructor(canvas, cols, rows, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cols = cols;
    this.rows = rows;
    this.pixelSize = options.pixelSize || 12;
    this.dotRadius = options.dotRadius || 4;
    this.unlitColor = options.unlitColor || 'rgba(40, 40, 40, 0.55)';
    this.bgColor = options.bgColor || '#0a0a0a';

    this.canvas.width = cols * this.pixelSize;
    this.canvas.height = rows * this.pixelSize;

    // Empty buffer
    this.buffer = this._emptyBuffer();
  }

  _emptyBuffer() {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
  }

  clear() {
    this.buffer = this._emptyBuffer();
  }

  setPixel(x, y, color) {
    if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
      this.buffer[y][x] = color;
    }
  }

  getBuffer() {
    return this.buffer;
  }

  render() {
    const ctx = this.ctx;
    const ps = this.pixelSize;
    const r = this.dotRadius;

    // Background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // First pass: draw all unlit dots so the grid is visible
    ctx.fillStyle = this.unlitColor;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.buffer[y][x]) {
          ctx.beginPath();
          ctx.arc(
            x * ps + ps / 2,
            y * ps + ps / 2,
            r * 0.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Second pass: glow halos behind lit pixels
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const color = this.buffer[y][x];
        if (color) {
          const cx = x * ps + ps / 2;
          const cy = y * ps + ps / 2;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
          grad.addColorStop(0, this._withAlpha(color, 0.55));
          grad.addColorStop(1, this._withAlpha(color, 0));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    // Third pass: the bright lit dots themselves
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const color = this.buffer[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x * ps + ps / 2, y * ps + ps / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  _withAlpha(color, alpha) {
    // Accepts hex like #rrggbb or named known colors we use
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }
}
