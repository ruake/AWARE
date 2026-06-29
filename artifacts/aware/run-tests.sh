#!/usr/bin/env bash
set -euo pipefail

U=()
for d in /nix/store/*glib*/lib; do if [ -f "$d/libglib-2.0.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*nspr*/lib; do if [ -f "$d/libnspr4.so" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*nss*/lib; do if [ -f "$d/libnss3.so" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*atk*/lib; do if [ -f "$d/libatk-1.0.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*at-spi2-atk*/lib; do if [ -f "$d/libatk-bridge-2.0.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*dbus*/lib; do if [ -f "$d/libdbus-1.so.3" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libX11*/lib; do if [ -f "$d/libX11.so.6" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libXcomposite*/lib; do if [ -f "$d/libXcomposite.so.1" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libXdamage*/lib; do if [ -f "$d/libXdamage.so.1" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libXext*/lib; do if [ -f "$d/libXext.so.6" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libXfixes*/lib; do if [ -f "$d/libXfixes.so.3" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libXrandr*/lib; do if [ -f "$d/libXrandr.so.2" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*mesa*/lib; do if [ -f "$d/libgbm.so.1" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libxcb*/lib; do if [ -f "$d/libxcb.so.1" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*libxkbcommon*/lib; do if [ -f "$d/libxkbcommon.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*alsa-lib*/lib; do if [ -f "$d/libasound.so.2" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*at-spi2-core*/lib; do if [ -f "$d/libatspi.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*cairo*/lib; do if [ -f "$d/libcairo.so.2" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*pango*/lib; do if [ -f "$d/libpango-1.0.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*gdk-pixbuf*/lib; do if [ -f "$d/libgdk_pixbuf-2.0.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*gtk3*/lib; do if [ -f "$d/libgtk-3.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*freetype*/lib; do if [ -f "$d/libfreetype.so.6" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*fontconfig*/lib; do if [ -f "$d/libfontconfig.so.1" ]; then U+=("$d"); break; fi; done 2>/dev/null
for d in /nix/store/*harfbuzz*/lib; do if [ -f "$d/libharfbuzz.so.0" ]; then U+=("$d"); break; fi; done 2>/dev/null

# nspr also in ~/.nix-profile/lib
if [ -f "$HOME/.nix-profile/lib/libnspr4.so" ]; then U+=("$HOME/.nix-profile/lib"); fi

IFS=:
export LD_LIBRARY_PATH="${U[*]}"
export PLAYWRIGHT_BASE_URL=http://localhost:25485

exec npx playwright test "$@"
