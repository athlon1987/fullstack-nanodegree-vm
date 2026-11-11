#!/usr/bin/env bash
# Encode the finished film: picture master (from tools/render.mjs --master) + the two audio mixes.
#   tools/package.sh [crf] [height]        e.g. tools/package.sh 21 1080   (defaults: crf 21, 1080p)
# Output: film/the-replacement.mp4 — H.264 + AAC, two audio tracks:
#   track 1 (default)  full mix: dialogue + music + effects
#   track 2            music and effects only (no voices) — the burned-in subtitles carry the dialogue
set -euo pipefail
cd "$(dirname "$0")/.."
CRF="${1:-21}"; HEIGHT="${2:-1080}"
MASTER=build/master.mkv; MIX=audio/out/mix.wav; ME=audio/out/mix_me.wav
OUT="film/the-replacement$([ "$HEIGHT" = 1080 ] || echo "-${HEIGHT}p").mp4"
for f in "$MASTER" "$MIX" "$ME"; do [ -f "$f" ] || { echo "missing $f" >&2; exit 1; }; done
mkdir -p film
ffmpeg -hide_banner -loglevel error -y -i "$MASTER" -i "$MIX" -i "$ME" \
  -map 0:v:0 -map 1:a:0 -map 2:a:0 \
  -vf "scale=-2:${HEIGHT}:flags=lanczos:in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -pix_fmt yuv420p -g 48 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a:0 192k -b:a:1 160k \
  -metadata title="The Replacement" -metadata:s:a:0 title="Full mix" -metadata:s:a:0 language=eng \
  -metadata:s:a:1 title="Music and effects (no voices)" -metadata:s:a:1 language=zxx \
  -disposition:a:0 default -disposition:a:1 0 -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=nw=1 "$OUT"
echo "wrote $OUT"
