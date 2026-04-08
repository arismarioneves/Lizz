#!/usr/bin/env bash
# Lizz - Linux/macOS Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/arismarioneves/Lizz/main/install.sh | bash

set -euo pipefail
export LANG=en_US.UTF-8 2>/dev/null || true

REPO="https://github.com/arismarioneves/Lizz.git"
INSTALL_DIR="$HOME/.lizz"
OS="$(uname -s)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m'

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
printf "${RED}  ██  ██  ${NC}\n"
printf "${RED}  ██  ██  ${NC}  ${BOLD}Lizz${NC}\n"
printf "${RED}  ██  ██  ${NC}\n"
printf "${RED}██  ██  ██${NC}\n"
printf "${RED}██████████${NC}\n"
echo ""
printf "${GRAY}  Personal AI Assistant  —  Installer${NC}\n"
printf "${GRAY}  ──────────────────────────────────────────────────${NC}\n"
echo ""

# ── [1/5] Node.js ──────────────────────────────────────────────────────────────
NODE_OK=false
if command -v node &>/dev/null; then
    NODE_MAJ=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJ" -ge 20 ]; then
        printf "${GREEN}  [1/5] Node.js OK  $(node --version)${NC}\n"
        NODE_OK=true
    fi
fi

if ! $NODE_OK; then
    printf "${YELLOW}  [1/5] Installing Node.js via nvm...${NC}\n"
    export NVM_DIR="$HOME/.nvm"
    if [ ! -d "$NVM_DIR" ]; then
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install --lts
    nvm use --lts
    printf "${GREEN}  [1/5] Node.js OK  $(node --version)${NC}\n"
fi

# ── [2/5] Git ─────────────────────────────────────────────────────────────────
if command -v git &>/dev/null; then
    printf "${GREEN}  [2/5] Git OK  $(git --version)${NC}\n"
else
    printf "${YELLOW}  [2/5] Installing Git...${NC}\n"
    if [ "$OS" = "Darwin" ]; then
        brew install git
    elif command -v apt-get &>/dev/null; then
        sudo apt-get install -y git
    elif command -v dnf &>/dev/null; then
        sudo dnf install -y git
    elif command -v pacman &>/dev/null; then
        sudo pacman -S --noconfirm git
    else
        printf "${RED}  Git not found and no known package manager. Install git and retry.${NC}\n"
        exit 1
    fi
    printf "${GREEN}  [2/5] Git OK${NC}\n"
fi

# ── [3/5] Download / Update ────────────────────────────────────────────────────
if [ -d "$INSTALL_DIR/.git" ]; then
    printf "${YELLOW}  [3/5] Updating Lizz...${NC}\n"
    git -C "$INSTALL_DIR" pull --quiet
else
    printf "${YELLOW}  [3/5] Downloading Lizz...${NC}\n"
    git clone --quiet "$REPO" "$INSTALL_DIR"
fi
printf "${GREEN}  [3/5] Download OK${NC}\n"

# ── [4/5] Build ───────────────────────────────────────────────────────────────
printf "${YELLOW}  [4/5] Building...${NC}\n"
cd "$INSTALL_DIR"
npm install --silent
npm run build --silent
printf "${GREEN}  [4/5] Build OK${NC}\n"

# ── [5/5] Launcher + PATH ─────────────────────────────────────────────────────
printf "${YELLOW}  [5/5] Creating launcher...${NC}\n"

cat > "$INSTALL_DIR/lizz" <<'LAUNCHER'
#!/usr/bin/env bash
LIZZ_HOME="$(cd "$(dirname "$0")" && pwd)"
exec node "$LIZZ_HOME/dist/cli.js" "$@"
LAUNCHER
chmod +x "$INSTALL_DIR/lizz"

SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_RC="$HOME/.bash_profile"
fi

if [ -n "$SHELL_RC" ] && ! grep -q '\.lizz' "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo 'export PATH="$HOME/.lizz:$PATH"' >> "$SHELL_RC"
    printf "${GRAY}        Added to PATH in $SHELL_RC${NC}\n"
fi
export PATH="$INSTALL_DIR:$PATH"
printf "${GREEN}  [5/5] Launcher created${NC}\n"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
printf "${GRAY}  ──────────────────────────────────────────────────${NC}\n"
printf "${GREEN}  ✓ Installation complete!${NC}\n"
echo ""
printf "${WHITE}  Starting setup wizard...${NC}\n"
echo ""

"$INSTALL_DIR/lizz" setup
