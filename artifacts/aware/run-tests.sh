#!/usr/bin/env bash
set -euo pipefail

U=()
add64() { local d="$1" s="$2"; local f="$d/$s"; local t="$f"; [ -L "$t" ] && t="$(readlink "$t")" && t="$d/$t"; if file "$t" 2>/dev/null | grep -q "64-bit"; then U+=("$d"); return 0; fi; return 1; }

for d in /nix/store/*glib*/lib; do if [ -f "$d/libglib-2.0.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*nspr*/lib; do if [ -f "$d/libnspr4.so" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*nss*/lib; do if [ -f "$d/libnss3.so" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*atk*/lib; do add64 "$d" "libatk-1.0.so.0" && break; done 2>/dev/null
for d in /nix/store/*at-spi2-atk*/lib; do add64 "$d" "libatk-bridge-2.0.so.0" && break; done 2>/dev/null
for d in /nix/store/*dbus*/lib; do add64 "$d" "libdbus-1.so.3" && break; done 2>/dev/null
for d in /nix/store/*libX11*/lib; do add64 "$d" "libX11.so.6" && break; done 2>/dev/null
for d in /nix/store/*libXcomposite*/lib; do add64 "$d" "libXcomposite.so.1" && break; done 2>/dev/null
for d in /nix/store/*libXdamage*/lib; do add64 "$d" "libXdamage.so.1" && break; done 2>/dev/null
for d in /nix/store/*libXext*/lib; do add64 "$d" "libXext.so.6" && break; done 2>/dev/null
for d in /nix/store/*libXfixes*/lib; do add64 "$d" "libXfixes.so.3" && break; done 2>/dev/null
for d in /nix/store/*libXrandr*/lib; do add64 "$d" "libXrandr.so.2" && break; done 2>/dev/null
for d in /nix/store/*mesa*/lib; do add64 "$d" "libgbm.so.1" && break; done 2>/dev/null
for d in /nix/store/*libxcb*/lib; do add64 "$d" "libxcb.so.1" && break; done 2>/dev/null
for d in /nix/store/*libxkbcommon*/lib; do add64 "$d" "libxkbcommon.so.0" && break; done 2>/dev/null
for d in /nix/store/*alsa-lib*/lib; do add64 "$d" "libasound.so.2" && break; done 2>/dev/null
for d in /nix/store/*at-spi2-core*/lib; do add64 "$d" "libatspi.so.0" && break; done 2>/dev/null
for d in /nix/store/*cairo*/lib; do add64 "$d" "libcairo.so.2" && break; done 2>/dev/null
for d in /nix/store/*pango*/lib; do add64 "$d" "libpango-1.0.so.0" && break; done 2>/dev/null
for d in /nix/store/*gdk-pixbuf*/lib; do add64 "$d" "libgdk_pixbuf-2.0.so.0" && break; done 2>/dev/null
for d in /nix/store/*gtk3*/lib; do add64 "$d" "libgtk-3.so.0" && break; done 2>/dev/null
for d in /nix/store/*freetype*/lib; do add64 "$d" "libfreetype.so.6" && break; done 2>/dev/null
for d in /nix/store/*fontconfig*/lib; do add64 "$d" "libfontconfig.so.1" && break; done 2>/dev/null
for d in /nix/store/*harfbuzz*/lib; do add64 "$d" "libharfbuzz.so.0" && break; done 2>/dev/null

# nspr also in ~/.nix-profile/lib
if [ -f "$HOME/.nix-profile/lib/libnspr4.so" ]; then U+=("$HOME/.nix-profile/lib"); fi

IFS=:
export LD_LIBRARY_PATH="${U[*]}"
export PLAYWRIGHT_BASE_URL=http://localhost:25485

exec npx playwright test "$@"
