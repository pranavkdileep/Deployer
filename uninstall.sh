#!/bin/bash
set -e

# Check if the user is root
if [ "$(id -u)" != "0" ]; then
    echo "This script must be run as root. Please use sudo." >&2
    exit 1
fi

echo "Starting the uninstallation process for Deployer and its components..."

# Function to prompt user for yes/no
confirm() {
    while true; do
        read -r -p "$1 [y/N]: " response
        case "$response" in
            [yY][eE][sS]|[yY]) 
                return 0 # Yes
                ;;
            [nN][oO]|[nN]|"")
                return 1 # No or Enter
                ;;
            *)
                echo "Please answer yes or no."
                ;;
        esac
    done
}

# --- Service Removal ---
echo "--- Stopping and removing Deployer service ---"
if systemctl list-units --full -all | grep -q 'deployer.service'; then
    echo "Stopping deployer.service..."
    systemctl stop deployer.service || echo "Deployer service was not running or could not be stopped."
    
    echo "Disabling deployer.service..."
    systemctl disable deployer.service || echo "Deployer service could not be disabled (it might not exist or already be disabled)."
    
    SERVICE_FILE_PATH="/etc/systemd/system/deployer.service"
    if [ -f "$SERVICE_FILE_PATH" ]; then
        echo "Removing deployer.service file ($SERVICE_FILE_PATH)..."
        rm -f "$SERVICE_FILE_PATH"
    else
        echo "Deployer service file ($SERVICE_FILE_PATH) not found."
    fi
    
    echo "Reloading systemd daemon..."
    systemctl daemon-reload
    echo "Deployer service removed."
else
    echo "Deployer service (deployer.service) not found. Skipping removal."
fi
echo "--- Deployer service removal complete ---"

# --- PostgreSQL Cleanup ---
echo "--- Starting PostgreSQL cleanup ---"
# Check if Docker is installed/running before attempting Docker commands
if command -v docker &> /dev/null; then
    echo "Checking for PostgreSQL Docker container 'pg'..."
    if docker ps -a --format '{{.Names}}' | grep -q "^pg$"; then
        echo "Stopping PostgreSQL container 'pg'..."
        docker stop pg || echo "Failed to stop 'pg' container. It might already be stopped."
        
        echo "Removing PostgreSQL container 'pg'..."
        docker rm pg || echo "Failed to remove 'pg' container. It might have already been removed."
        
        if confirm "Do you want to remove the PostgreSQL data volume 'pgdata'? This will delete all data stored by the Deployer's PostgreSQL instance."; then
            echo "Removing Docker volume 'pgdata'..."
            docker volume rm pgdata || echo "Failed to remove 'pgdata' volume. It might not exist or there was an error."
            echo "'pgdata' volume removal attempted."
        else
            echo "Skipping 'pgdata' volume removal."
        fi
        echo "PostgreSQL container and (optionally) volume cleanup complete."
    else
        echo "PostgreSQL container 'pg' not found. Skipping Dockerized PostgreSQL cleanup."
    fi
else
    echo "Docker command not found. Skipping PostgreSQL Docker cleanup. Docker might not be installed."
fi
echo "--- PostgreSQL cleanup complete ---"

# --- Repository Removal ---
echo "--- Starting Deployer repository removal ---"
DEPLOYER_REPO_PATH="/root/Deployer" # Path used in install.sh context
if [ -d "$DEPLOYER_REPO_PATH" ]; then
    if confirm "Do you want to remove the Deployer application repository located at '$DEPLOYER_REPO_PATH'? This will delete the application code."; then
        echo "Removing Deployer repository ($DEPLOYER_REPO_PATH)..."
        rm -rf "$DEPLOYER_REPO_PATH"
        if [ -d "$DEPLOYER_REPO_PATH" ]; then # Check if removal failed
            echo "Failed to remove $DEPLOYER_REPO_PATH. Please check permissions or remove manually." >&2
        else
            echo "Deployer repository removed successfully."
        fi
    else
        echo "Skipping Deployer repository removal."
    fi
else
    echo "Deployer repository at '$DEPLOYER_REPO_PATH' not found. Skipping removal."
fi
echo "--- Deployer repository removal complete ---"

# --- Component Uninstallation ---
echo "--- Starting Component Uninstallation (Caddy, Tshark, Nixpacks, Docker) ---"

# Function to check distro (simplistic, assumes /etc/os-release is available and informative)
get_distro() {
    if [ -f /etc/os-release ]; then
        # freedesktop.org and systemd
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        if [ "$ID" = "debian" ] || [ "$ID_LIKE" = "debian" ]; then
            echo "debian"
        elif [ "$ID" = "centos" ] || [ "$ID_LIKE" = "rhel fedora" ] || [ "$ID_LIKE" = "fedora" ]; then
            echo "centos"
        else
            echo "unknown"
        fi
    elif type lsb_release >/dev/null 2>&1; then
        # linuxbase.org
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
        if [ "$OS" = "Debian" ] || [ "$OS" = "Ubuntu" ]; then # Add more Debian-likes if needed
             echo "debian"
        elif [ "$OS" = "CentOS" ]; then # Add more RHEL-likes if needed
             echo "centos"
        else
             echo "unknown"
        fi
    elif [ -f /etc/debian_version ]; then
        # Older Debian/Ubuntu/etc.
        echo "debian"
    elif [ -f /etc/redhat-release ]; then
        # Older Red Hat, CentOS, etc.
        echo "centos"
    else
        # Fall back to uname, e.g. "Linux <version>", also "MacOS"
        OS=$(uname -s)
        VER=$(uname -r)
        echo "unknown"
    fi
}

DISTRO=$(get_distro)
echo "Detected distribution: $DISTRO"

# --- Caddy Uninstallation ---
if confirm "Do you want to uninstall Caddy web server? This will remove Caddy and its configuration."; then
    echo "Uninstalling Caddy..."
    if command -v caddy &> /dev/null; then
        echo "Stopping Caddy service..."
        systemctl stop caddy || echo "Caddy service was not running or could not be stopped."
        
        if [ "$DISTRO" = "debian" ]; then
            echo "Purging Caddy package (Debian)..."
            apt-get -y purge caddy 
            apt-get -y autoremove --purge # Remove dependencies
            CADDY_REPO_FILE="/etc/apt/sources.list.d/caddy-stable.list"
            if [ -f "$CADDY_REPO_FILE" ]; then
                echo "Removing Caddy repository file ($CADDY_REPO_FILE)..."
                rm -f "$CADDY_REPO_FILE"
            fi
            echo "Updating package lists..."
            apt-get update
        elif [ "$DISTRO" = "centos" ]; then
            echo "Removing Caddy package (CentOS)..."
            yum -y remove caddy
            # Remove COPR repository if added by install script (specifics depend on how it was added)
            # Example: dnf copr remove @caddy/caddy or yum-config-manager --disable copr:copr.fedorainfracloud.org:group_caddy:caddy
            # For simplicity, we'll assume the user might need to manually remove the COPR repo or it's handled by `yum remove`.
            echo "Note: If Caddy was installed via COPR, you might need to manually remove/disable the COPR repository."
        else
            echo "Unsupported distribution for Caddy automatic removal. Please remove Caddy manually."
        fi
        # Common Caddy config/data directories - optional, as package removal might handle this.
        # rm -rf /etc/caddy
        # rm -rf /var/lib/caddy
        echo "Caddy uninstallation process attempted."
    else
        echo "Caddy command not found. Skipping Caddy uninstallation."
    fi
else
    echo "Skipping Caddy uninstallation."
fi
echo "--- Caddy uninstallation complete ---"

# --- Tshark Uninstallation ---
if confirm "Do you want to uninstall Tshark (command-line Wireshark)?"; then
    echo "Uninstalling Tshark..."
    if command -v tshark &> /dev/null; then
        if [ "$DISTRO" = "debian" ]; then
            echo "Purging Tshark package (Debian)..."
            apt-get -y purge tshark wireshark-common # wireshark-common is often a dependency
            apt-get -y autoremove --purge
        elif [ "$DISTRO" = "centos" ]; then
            echo "Removing Tshark package (CentOS)..."
            # Tshark package name might be 'wireshark-cli' or 'tshark' depending on repo (e.g. EPEL)
            # We'll try both, or the user might need to specify.
            # The install script uses 'tshark' for Debian, CentOS install wasn't specified there.
            # For now, assuming 'tshark' or 'wireshark-cli'.
            if yum list installed | grep -q 'tshark'; then
                 yum -y remove tshark
            elif yum list installed | grep -q 'wireshark-cli'; then
                 yum -y remove wireshark-cli
            else
                 echo "Tshark package (tshark or wireshark-cli) not found installed via yum. Skipping."
            fi
        else
            echo "Unsupported distribution for Tshark automatic removal. Please remove Tshark manually."
        fi
        echo "Tshark uninstallation process attempted."
    else
        echo "Tshark command not found. Skipping Tshark uninstallation."
    fi
else
    echo "Skipping Tshark uninstallation."
fi
echo "--- Tshark uninstallation complete ---"

# --- Nixpacks Uninstallation ---
if confirm "Do you want to uninstall Nixpacks?"; then
    echo "Uninstalling Nixpacks..."
    # Nixpacks is typically installed as a single binary. The install script uses curl | bash.
    # Common locations are /usr/local/bin or ~/.local/bin or the directory from where install script was run.
    # We'll check common system-wide paths first.
    NIXPACKS_PATH=$(command -v nixpacks)
    
    if [ -n "$NIXPACKS_PATH" ] && [ -f "$NIXPACKS_PATH" ]; then
        echo "Nixpacks found at $NIXPACKS_PATH. Removing..."
        rm -f "$NIXPACKS_PATH"
        if [ -f "$NIXPACKS_PATH" ]; then
            echo "Failed to remove Nixpacks binary from $NIXPACKS_PATH. Please check permissions or remove manually." >&2
        else
            echo "Nixpacks binary removed from $NIXPACKS_PATH."
        fi
    else
        # Fallback check for a common user-specific install path if `command -v` fails.
        # This is less reliable as the install script doesn't specify a user-level install.
        # LOCAL_NIXPACKS_PATH="$HOME/.local/bin/nixpacks" 
        # if [ -f "$LOCAL_NIXPACKS_PATH" ]; then
        #    echo "Nixpacks found at $LOCAL_NIXPACKS_PATH. Removing..."
        #    rm -f "$LOCAL_NIXPACKS_PATH"
        # else
        echo "Nixpacks command not found or binary path could not be determined. Skipping direct removal."
        echo "If Nixpacks was installed to a custom location, please remove it manually."
        # fi
    fi
    # Remove nixpacks cache if it exists (usually in ~/.cache/nixpacks)
    if [ -d "$HOME/.cache/nixpacks" ]; then
        if confirm "Do you want to remove the Nixpacks cache directory ($HOME/.cache/nixpacks)?"; then
            echo "Removing Nixpacks cache directory..."
            rm -rf "$HOME/.cache/nixpacks"
            echo "Nixpacks cache directory removed."
        else
            echo "Skipping Nixpacks cache directory removal."
        fi
    fi
    echo "Nixpacks uninstallation process attempted."
else
    echo "Skipping Nixpacks uninstallation."
fi
echo "--- Nixpacks uninstallation complete ---"

# --- Docker Uninstallation ---
if confirm "Do you want to uninstall Docker Engine, CLI, and Containerd? WARNING: This will remove ALL Docker images, containers, volumes, and networks on this system, not just those related to the Deployer application. This action is IRREVERSIBLE."; then
    echo "Proceeding with Docker uninstallation..."
    if command -v docker &> /dev/null; then
        # Stop all running containers first (optional, but can help prevent issues)
        # echo "Stopping all running Docker containers..."
        # docker ps -q | xargs --no-run-if-empty docker stop
        
        if [ "$DISTRO" = "debian" ]; then
            echo "Uninstalling Docker packages (Debian)..."
            # Based on install.sh, get.docker.com script is used, which installs docker-ce and related packages.
            # Forcibly remove packages known to be installed by get.docker.com or common Docker setups.
            apt-get -y purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras
            apt-get -y autoremove --purge
        elif [ "$DISTRO" = "centos" ]; then
            echo "Uninstalling Docker packages (CentOS)..."
            yum -y remove docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            # yum autoremove (or equivalent `yum history undo` for the transaction) might be needed for dependencies.
        else
            echo "Unsupported distribution for Docker automatic uninstallation. Please uninstall Docker manually."
        fi

        if confirm "Do you want to remove Docker's data directories (/var/lib/docker and /var/lib/containerd)? This will delete all images, containers, and volumes stored by Docker."; then
            echo "Removing Docker data directories..."
            rm -rf /var/lib/docker
            rm -rf /var/lib/containerd
            echo "Docker data directories removed."
        else
            echo "Skipping Docker data directory removal."
        fi
        echo "Docker uninstallation process attempted."
    else
        echo "Docker command not found. Skipping Docker uninstallation."
    fi
else
    echo "Skipping Docker uninstallation."
fi
echo "--- Docker uninstallation complete ---"

echo "--- All selected components have been processed. ---"

# --- NVM and Node.js Uninstallation Instructions ---
echo ""
echo "--- NVM and Node.js Uninstallation (Manual Steps Required) ---"
echo "This script does not automatically uninstall NVM (Node Version Manager) or Node.js versions installed by NVM, as this can be highly specific to your shell setup and could unintentionally disrupt other projects."
echo ""
echo "To manually uninstall NVM and Node.js:"
echo "1. Deactivate NVM (if active):"
echo "   nvm deactivate"
echo ""
echo "2. Unload NVM (temporary, for current session):"
echo "   nvm unload"
echo ""
echo "3. Remove NVM directory:"
echo "   The NVM directory is usually located at \$HOME/.nvm (i.e., ~/.nvm)."
echo "   Before deleting, you can confirm its location by checking the NVM_DIR environment variable: echo \$NVM_DIR"
echo "   To remove it (BE CAREFUL, this deletes all Node.js versions installed by NVM):"
echo "   rm -rf \"\$HOME/.nvm\""
echo ""
echo "4. Remove NVM lines from your shell profile file(s):"
echo "   NVM initialization lines are typically added to files like ~/.bashrc, ~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.config/fish/config.fish."
echo "   Open your shell configuration file(s) with a text editor and remove lines similar to these:"
echo "     export NVM_DIR=\"\$HOME/.nvm\""
echo "     [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"  # This loads nvm"
echo "     [ -s \"\$NVM_DIR/bash_completion\" ] && \. \"\$NVM_DIR/bash_completion\"  # This loads nvm bash_completion"
echo ""
echo "5. After removing the lines, restart your shell or source your profile file again (e.g., source ~/.bashrc)."
echo ""
echo "Please perform these steps carefully if you wish to completely remove NVM and its installed Node.js versions."
echo "--- NVM and Node.js Uninstallation Instructions End ---"

echo ""
echo "####################################################################"
echo "Uninstallation process for selected Deployer components is complete."
echo "Please review the output above for any errors or manual steps."
echo "####################################################################"
exit 0
