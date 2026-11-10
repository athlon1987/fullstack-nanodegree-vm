// A stand-in figure for checking scale and staging before the real character rig exists.
// dummy(ctx, x, floorY, {h, facing, color, sit}) draws a plain profile mannequin whose feet are at (x, floorY).
export function dummy(ctx, x, floorY, o = {}) {
  const { h = 430, facing = 1, color = '#07090e', sit = false } = o;
  const u = h / 7;                     // one head
  ctx.save(); ctx.translate(x, floorY); ctx.scale(facing, 1); ctx.fillStyle = color;
  const hip = sit ? -110 * (h / 430) : -u * 3.5;
  // legs
  if (sit) { ctx.fillRect(-u * 0.25, hip - u * 0.3, u * 1.9, u * 0.6); ctx.fillRect(u * 1.3, hip, u * 0.55, -hip); }
  else { ctx.fillRect(-u * 0.32, hip, u * 0.62, -hip); }
  ctx.fillRect(sit ? u * 1.3 : -u * 0.3, -u * 0.22, u * 1.05, u * 0.22);   // foot
  // torso + head
  ctx.beginPath(); ctx.roundRect(-u * 0.5, hip - u * 2.6, u * 1.0, u * 2.75, u * 0.35); ctx.fill();
  ctx.beginPath(); ctx.ellipse(u * 0.08, hip - u * 3.1, u * 0.42, u * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(u * 0.4, hip - u * 3.1, u * 0.14, u * 0.12);                // nose hint → shows facing
  ctx.fillRect(-u * 0.2, hip - u * 2.4, u * 0.42, u * 1.9);                // arm
  ctx.restore();
}
