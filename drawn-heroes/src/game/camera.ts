import { clamp, lerp } from '../core/math';

/** Side-scrolling camera. x is the world x at the centre of the screen (front-depth scale). */
export class Camera {
  x = 0;
  viewW = 960;
  lock: [number, number] | null = null;
  stageLen = 4000;

  get left(): number {
    return this.x - this.viewW / 2;
  }
  get right(): number {
    return this.x + this.viewW / 2;
  }

  onScreen(x: number, margin = 0): boolean {
    return x >= this.left + margin && x <= this.right - margin;
  }

  bounds(): [number, number] {
    let lo = this.viewW / 2;
    let hi = this.stageLen - this.viewW / 2;
    if (this.lock) {
      const [a, b] = this.lock;
      if (b - a <= this.viewW) {
        lo = hi = (a + b) / 2;
      } else {
        lo = Math.max(lo, a + this.viewW / 2);
        hi = Math.min(hi, b - this.viewW / 2);
      }
    }
    if (hi < lo) hi = lo = (lo + hi) / 2;
    return [lo, hi];
  }

  update(target: number, snap = false): void {
    const [lo, hi] = this.bounds();
    const t = clamp(target, lo, hi);
    this.x = snap ? t : lerp(this.x, t, 0.09);
    this.x = clamp(this.x, lo - 1, hi + 1);
  }
}
