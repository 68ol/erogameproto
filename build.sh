#!/usr/bin/env bash
# 빌드: src/ → dist/index.html
# Tweego가 없으면 tools/ 에 받아온다. 스토리 포맷(SugarCube)은 storyformats/ 에 고정돼 있다.
set -euo pipefail
cd "$(dirname "$0")"

TWEEGO_VERSION=2.1.1
TWEEGO="tools/tweego"

if [[ ! -x "$TWEEGO" ]]; then
	case "$(uname -s)-$(uname -m)" in
		Linux-x86_64) ARCH=linux-x64 ;;
		Darwin-*) ARCH=macos-x64 ;;
		MINGW*|MSYS*|CYGWIN*) ARCH=windows-x64; TWEEGO="tools/tweego.exe" ;;
		*) echo "지원하지 않는 플랫폼: $(uname -s)-$(uname -m). tools/ 에 tweego를 직접 넣어주세요." >&2; exit 1 ;;
	esac
	if [[ ! -x "$TWEEGO" ]]; then
		mkdir -p tools
		curl -sSL -o tools/tweego.zip \
			"https://github.com/tmedwards/tweego/releases/download/v${TWEEGO_VERSION}/tweego-${TWEEGO_VERSION}-${ARCH}.zip"
		unzip -qo tools/tweego.zip -d tools/tweego-dist
		cp tools/tweego-dist/tweego* tools/
		chmod +x "$TWEEGO"
		rm -rf tools/tweego.zip tools/tweego-dist
	fi
fi

mkdir -p dist
TWEEGO_PATH="$PWD/storyformats" "$TWEEGO" -o dist/index.html src "$@"
echo "빌드 완료: dist/index.html"
