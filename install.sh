#!/bin/bash
set -e

# check if the user is root
if [ $(id -u) != 0 ]; then
    echo "You must be the superuser to run this script" >&2
    exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and install curl and git
echo "Checking for curl and git..."
if [ -f /etc/debian_version ]; then
    # Debian-based
    if ! command_exists curl || ! command_exists git; then
        echo "curl or git not found. Installing..."
        apt-get update
        if ! apt-get install -y curl git; then
            echo "Failed to install curl and git. Exiting." >&2
            exit 1
        fi
        echo "curl and git installed successfully."
    else
        echo "curl and git are already installed."
    fi
elif [ -f /etc/redhat-release ]; then
    # CentOS-based
    if ! command_exists curl || ! command_exists git; then
        echo "curl or git not found. Installing..."
        if ! yum install -y curl git; then
            echo "Failed to install curl and git. Exiting." >&2
            exit 1
        fi
        echo "curl and git installed successfully."
    else
        echo "curl and git are already installed."
    fi
else
    echo "Unsupported distribution. Cannot install curl or git." >&2
    exit 1
fi

installDockerDebian() {
    echo "Starting Docker, Nixpacks, and Caddy installation for Debian-based system..."

    echo "Checking for Docker..."
    if command_exists docker && docker --version; then
        echo "Docker is already installed (version: $(docker --version)). Skipping Docker installation."
    else
        echo "Installing Docker..."
        echo "Removing any old Docker packages..."
        for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
            if dpkg -l | grep -q $pkg; then
                apt-get -y remove $pkg || echo "Could not remove $pkg, it might not be installed."
            fi
        done
        echo "Updating package lists for Docker installation..."
        apt-get update
        echo "Installing prerequisite packages for Docker (ca-certificates)..."
        apt-get -y install ca-certificates # curl is already checked/installed globally
        echo "Downloading and running Docker installation script (get.docker.com)..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        if ! command_exists docker || ! docker --version; then
            echo "Failed to install Docker. Exiting." >&2
            exit 1
        fi
        echo "Docker installed successfully (version: $(docker --version))."
    fi

    echo "Checking for Nixpacks..."
    if command_exists nixpacks && nixpacks --version; then
        echo "Nixpacks is already installed (version: $(nixpacks --version)). Skipping Nixpacks installation."
    else
        echo "Installing Nixpacks..."
        curl -sSL https://nixpacks.com/install.sh | bash
        if ! command_exists nixpacks || ! nixpacks --version; then
            echo "Failed to install Nixpacks. Exiting." >&2
            exit 1
        fi
        echo "Nixpacks installed successfully (version: $(nixpacks --version))."
    fi

    echo "Checking for Caddy..."
    if command_exists caddy && caddy version; then
        echo "Caddy is already installed (version: $(caddy version)). Skipping Caddy installation."
    else
        echo "Installing Caddy..."
        apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/deb.deb.txt' | tee -a /etc/apt/sources.list.d/caddy-stable.list
        apt-get update
        apt-get install caddy -y
        if ! command_exists caddy || ! caddy version; then
            echo "Failed to install Caddy. Exiting." >&2
            exit 1
        fi
        echo "Caddy installed successfully (version: $(caddy version))."
        echo "Configuring Caddy..."
        rm -f /etc/caddy/Caddyfile
        echo -e "{\n    admin localhost:2019\n}" | tee /etc/caddy/Caddyfile > /dev/null
        systemctl restart caddy
        echo "Caddy configured and restarted."
    fi
    
    echo "Checking for build-essential..."
    if dpkg -s build-essential &> /dev/null; then
        echo "build-essential is already installed. Skipping installation."
    else
        echo "Installing build-essential..."
        apt-get install -y build-essential
        echo "build-essential installed successfully."
    fi
    echo "Docker, Nixpacks, and Caddy setup for Debian completed."
}

installDockerCentos() {
    echo "Starting Docker, Nixpacks, and Caddy installation for CentOS-based system..."

    echo "Checking for Docker..."
    if command_exists docker && docker --version; then
        echo "Docker is already installed (version: $(docker --version)). Skipping Docker installation."
    else
        echo "Installing Docker..."
        yum install -y yum-utils device-mapper-persistent-data lvm2 # curl & git checked globally
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
        if ! command_exists docker || ! docker --version; then
            echo "Failed to install Docker. Exiting." >&2
            exit 1
        fi
        echo "Starting and enabling Docker service..."
        systemctl start docker
        systemctl enable docker
        echo "Docker installed and started successfully (version: $(docker --version))."
    fi

    echo "Checking for Nixpacks..."
    if command_exists nixpacks && nixpacks --version; then
        echo "Nixpacks is already installed (version: $(nixpacks --version)). Skipping Nixpacks installation."
    else
        echo "Installing Nixpacks..."
        # The Nixpacks install script is generally cross-platform
        curl -sSL https://nixpacks.com/install.sh | bash
        if ! command_exists nixpacks || ! nixpacks --version; then
            echo "Failed to install Nixpacks. Exiting." >&2
            exit 1
        fi
        echo "Nixpacks installed successfully (version: $(nixpacks --version))."
    fi

    echo "Checking for Caddy..."
    if command_exists caddy && caddy version; then
        echo "Caddy is already installed (version: $(caddy version)). Skipping Caddy installation."
    else
        echo "Installing Caddy for CentOS..."
        yum install -y yum-plugin-copr
        yum copr enable @caddy/caddy -y
        yum install caddy -y
        if ! command_exists caddy || ! caddy version; then
            echo "Failed to install Caddy. Exiting." >&2
            exit 1
        fi
        echo "Caddy installed successfully (version: $(caddy version))."
        echo "Configuring Caddy..."
        mkdir -p /etc/caddy # Ensure directory exists
        # Check if Caddyfile exists, create a default one if not.
        # Avoid overwriting user's Caddyfile if it's already there and configured.
        if [ ! -f /etc/caddy/Caddyfile ]; then
            echo -e "{\n    admin localhost:2019\n}" | tee /etc/caddy/Caddyfile > /dev/null
            echo "Default Caddyfile created."
        else
            echo "Caddyfile already exists at /etc/caddy/Caddyfile. Skipping default configuration."
        fi
        systemctl restart caddy # Assumes Caddy package installs and enables a service
        echo "Caddy (re)started."
    fi

    echo "Checking for Development Tools (build-essential equivalent)..."
    if yum groupinfo "Development Tools" | grep -q "Installed Packages"; then # A bit more robust check
        echo "Development Tools group is already installed. Skipping."
    else
        echo "Installing Development Tools group for CentOS..."
        if ! yum groupinstall "Development Tools" -y; then
            echo "Warning: Failed to install 'Development Tools' group. Some native npm modules might fail to build." >&2
            # Not exiting, as per previous logic, but clearly stating the issue.
        else
            echo "Development Tools group installed successfully."
        fi
    fi
    echo "Docker, Nixpacks, and Caddy setup for CentOS completed."
}

installNvmNodeDebian() {
    echo "Starting NVM and Node.js installation for Debian-based system..."
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    
    echo "Checking for NVM..."
    # Check if NVM script exists and is sourceable, then check nvm command
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        echo "NVM script found at $NVM_DIR/nvm.sh. Sourcing and checking version..."
        \. "$NVM_DIR/nvm.sh" # Source NVM
        if command_exists nvm && nvm --version; then
            echo "NVM is already installed and available (version: $(nvm --version)). Skipping NVM installation."
        else
            echo "NVM script found but 'nvm --version' failed or NVM not in PATH. Attempting NVM installation..."
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
            # Re-export and source after installation attempt
            export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        fi
    else
        echo "NVM not found. Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
        export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
    fi

    # Final check for NVM after potential installation
    if ! command_exists nvm || ! nvm --version; then
        echo "Failed to install or source NVM. Exiting." >&2
        exit 1
    fi
    echo "NVM is available (version: $(nvm --version))."
    
    NODE_VERSION="23.6.0" # Define desired Node version
    echo "Checking for Node.js version $NODE_VERSION..."
    # Use nvm list to check if version is installed and is not "N/A"
    if nvm list "$NODE_VERSION" --no-colors | grep -q "$NODE_VERSION"; then
        echo "Node.js version $NODE_VERSION is already installed."
    else
        echo "Node.js version $NODE_VERSION not found or not installed via NVM. Installing..."
        nvm install "$NODE_VERSION"
        if ! nvm list "$NODE_VERSION" --no-colors | grep -q "$NODE_VERSION"; then # Verify after install
            echo "Failed to install Node.js version $NODE_VERSION using NVM. Exiting." >&2
            exit 1
        fi
        echo "Node.js version $NODE_VERSION installed successfully via NVM."
    fi
    
    echo "Using Node.js version $NODE_VERSION..."
    nvm use "$NODE_VERSION"
    echo "Setting Node.js version $NODE_VERSION as default for NVM..."
    nvm alias default "$NODE_VERSION"
    echo "Node.js setup complete. Current active version: $(node --version), NVM default: $(nvm current)"
}

installNvmNodeCentos() {
    echo "Starting NVM and Node.js installation for CentOS-based system..."
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"

    echo "Checking for NVM..."
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        echo "NVM script found at $NVM_DIR/nvm.sh. Sourcing and checking version..."
        \. "$NVM_DIR/nvm.sh"
        if command_exists nvm && nvm --version; then
            echo "NVM is already installed and available (version: $(nvm --version)). Skipping NVM installation."
        else
            echo "NVM script found but 'nvm --version' failed or NVM not in PATH. Attempting NVM installation..."
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
            export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        fi
    else
        echo "NVM not found. Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
        export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    if ! command_exists nvm || ! nvm --version; then
        echo "Failed to install or source NVM. Exiting." >&2
        exit 1
    fi
    echo "NVM is available (version: $(nvm --version))."

    # For CentOS, original script used 'nvm install node' (latest stable).
    # We'll use a specific version for consistency, same as Debian.
    NODE_VERSION="23.6.0" 
    echo "Checking for Node.js version $NODE_VERSION..."

    if nvm list "$NODE_VERSION" --no-colors | grep -q "$NODE_VERSION"; then
        echo "Node.js version $NODE_VERSION is already installed."
    else
        echo "Node.js version $NODE_VERSION not found or not installed via NVM. Installing..."
        nvm install "$NODE_VERSION"
        if ! nvm list "$NODE_VERSION" --no-colors | grep -q "$NODE_VERSION"; then
            echo "Failed to install Node.js version $NODE_VERSION using NVM. Exiting." >&2
            exit 1
        fi
        echo "Node.js version $NODE_VERSION installed successfully via NVM."
    fi
    
    echo "Using Node.js version $NODE_VERSION..."
    nvm use "$NODE_VERSION"
    echo "Setting Node.js version $NODE_VERSION as default for NVM..."
    nvm alias default "$NODE_VERSION"
    echo "Node.js setup complete. Current active version: $(node --version), NVM default: $(nvm current)"
}

cloneRepo() {
    echo "Setting up Deployer repository..."
    # Ensure NVM is sourced, as npm commands will be run.
    # This relies on NVM_DIR being set and nvm.sh being present from previous steps.
    if [ -z "$NVM_DIR" ]; then # If NVM_DIR is not set, try the default location
      export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    fi
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        \. "$NVM_DIR/nvm.sh"
        # Optionally, ensure a specific node version is active if required before npm install
        # nvm use default # Or the specific version installed: nvm use 23.6.0
    else
        echo "Warning: NVM script not found at $NVM_DIR/nvm.sh. 'npm' commands might fail if Node is not in global PATH." >&2
    fi

    if [ -d "Deployer/.git" ]; then # Check for .git directory to confirm it's a git repo
        echo "Repository 'Deployer' directory already exists and appears to be a git repository."
        echo "Changing directory to Deployer/backend_ts/ and attempting to update..."
        cd Deployer
        # Optional: Consider adding 'git pull' to update the repo if it already exists
        # echo "Pulling latest changes from remote..."
        # if ! git pull; then
        #     echo "Warning: 'git pull' failed. Continuing with existing local version." >&2
        # fi
        cd backend_ts/
    else
        echo "Cloning repository https://github.com/pranavkdileep/Deployer..."
        if ! git clone https://github.com/pranavkdileep/Deployer; then
            echo "Failed to clone repository. Exiting." >&2
            exit 1
        fi
        cd Deployer/backend_ts/
        echo "Repository cloned successfully."
    fi
    
    echo "Current directory: $(pwd)"
    echo "Installing npm dependencies (npm install)..."
    if ! npm install; then
        echo "npm install failed. Exiting." >&2
        exit 1
    fi
    echo "npm dependencies installed successfully."

    if [ -f ".env" ]; then
        echo ".env file already exists. Skipping copy from env_example."
    else
        echo "Copying env_example to .env..."
        cp env_example .env
    fi
    
    echo "Building the project with npm run build..."
    if ! npm run build; then
        echo "npm run build failed. Exiting." >&2
        exit 1
    fi
    echo "Repository setup and build complete."
}

installTshark() {
    # This function is specific to Debian-based systems as per original script.
    # For CentOS, tshark (wireshark-cli) would be installed differently (e.g., from EPEL).
    if [ ! -f /etc/debian_version ]; then
        echo "Skipping Tshark installation as this does not appear to be a Debian-based system."
        return
    fi

    echo "Starting Tshark installation for Debian-based system..."
    if command_exists tshark && tshark -v &> /dev/null; then # tshark -v output goes to stderr
        echo "Tshark is already installed (version: $(tshark -v 2>&1 | head -n 1)). Skipping installation."
    else
        echo "Installing Tshark..."
        # Pre-configure wireshark-common for non-interactive installation to allow non-root packet capture
        echo "Pre-configuring wireshark-common..."
        echo "wireshark-common wireshark-common/install-setuid boolean true" | debconf-set-selections
        apt-get update
        echo "Installing tshark package..."
        if ! apt-get install -y tshark; then
            echo "Failed to install Tshark. Exiting." >&2
            exit 1
        fi
        # Verify installation
        if ! command_exists tshark || ! tshark -v &> /dev/null; then
            echo "Tshark installation seems to have failed (command not found or version check failed after install). Exiting." >&2
            exit 1
        fi
        echo "Tshark installed successfully (version: $(tshark -v 2>&1 | head -n 1))."
    fi
}

startNodeServerService() {
    echo "Setting up and starting Deployer Node.js service (deployer.service)..."
    
    # The deployer.service file is created/updated in the setupPostgres function.
    # This function's main role is to ensure systemd reloads the config and (re)starts the service.
    if [ ! -f /etc/systemd/system/deployer.service ]; then
        echo "Systemd service file /etc/systemd/system/deployer.service not found!" >&2
        echo "This file should have been created by the 'setupPostgres' function." >&2
        echo "Please ensure 'setupPostgres' has run successfully before this step." >&2
        exit 1
    fi

    echo "Reloading systemd daemon to pick up any changes in deployer.service..."
    systemctl daemon-reload

    echo "Attempting to start deployer service..."
    if ! systemctl start deployer; then
        echo "Failed to start deployer service. Attempting to provide diagnostic information:" >&2
        echo "---- systemctl status deployer ----"
        systemctl status deployer --no-pager || echo "Failed to get status."
        echo "---- journalctl -u deployer -n 20 ----"
        journalctl -u deployer -n 20 --no-pager || echo "Failed to get journal logs."
        echo "Exiting due to service start failure." >&2
        exit 1 # Critical failure if service doesn't start
    fi
    echo "Deployer service started successfully."

    echo "Enabling deployer service to start on system boot..."
    if ! systemctl enable deployer; then
        echo "Warning: Failed to enable deployer service to start on boot." >&2
        # Not exiting, as the service might be running, but this is an issue to note.
    else
        echo "Deployer service enabled successfully for boot start."
    fi
    echo "Node server service setup complete. Current status: $(systemctl is-active deployer)"
}

setupPostgres(){
    echo "Starting PostgreSQL setup and Deployer service configuration..."

    # --- Determine Node.js executable path for systemd service ---
    echo "Determining Node.js executable path for the systemd service..."
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    NODE_EXEC_PATH_FOR_SERVICE=""

    if [ -s "$NVM_DIR/nvm.sh" ]; then
        \. "$NVM_DIR/nvm.sh" # Source NVM to use its commands
        NVM_CURRENT_NODE_VERSION=$(nvm current)
        
        # Try to get the path for the 'current' nvm version if it's not 'system' or 'none'
        if [ "$NVM_CURRENT_NODE_VERSION" != "system" ] && [ "$NVM_CURRENT_NODE_VERSION" != "none" ] && [ "$NVM_CURRENT_NODE_VERSION" != "N/A" ]; then
            NODE_EXEC_PATH_FOR_SERVICE="$NVM_DIR/versions/node/$NVM_CURRENT_NODE_VERSION/bin/node"
        fi
        
        # If current is system or not specific, try the version this script aims to install/use
        if [ -z "$NODE_EXEC_PATH_FOR_SERVICE" ] || [ ! -f "$NODE_EXEC_PATH_FOR_SERVICE" ]; then
            SCRIPT_TARGET_NODE_VERSION="v23.6.0" # Matches nvm install commands
            if [ -f "$NVM_DIR/versions/node/$SCRIPT_TARGET_NODE_VERSION/bin/node" ]; then
                 NODE_EXEC_PATH_FOR_SERVICE="$NVM_DIR/versions/node/$SCRIPT_TARGET_NODE_VERSION/bin/node"
            fi
        fi
    fi
    
    # Fallback: if NVM path wasn't found or isn't valid, try `command -v node`
    if [ -z "$NODE_EXEC_PATH_FOR_SERVICE" ] || [ ! -f "$NODE_EXEC_PATH_FOR_SERVICE" ]; then
        if command -v node > /dev/null; then
            NODE_EXEC_PATH_FOR_SERVICE=$(command -v node)
            echo "Using system node path for service (found via command -v node): $NODE_EXEC_PATH_FOR_SERVICE"
        else
            # Absolute fallback if all else fails - this is unlikely to work but prevents script error
            NODE_EXEC_PATH_FOR_SERVICE="node" 
            echo "Critical Warning: Could not determine a specific Node.js path via NVM or command -v. Service will use 'node'." >&2
            echo "This might cause the service to fail if 'node' is not in the root user's PATH or not the correct version." >&2
        fi
    fi
    echo "Node.js executable path for systemd service set to: $NODE_EXEC_PATH_FOR_SERVICE"
    # --- End Node.js path determination ---

    echo "Checking for existing PostgreSQL container 'pg'..."
    if docker ps -a --format '{{.Names}}' | grep -qw "^pg$"; then
        echo "PostgreSQL container 'pg' already exists."
        if ! docker ps --format '{{.Names}}' | grep -qw "^pg$"; then # Check if it's running
            echo "Container 'pg' exists but is not running. Attempting to start..."
            if ! docker start pg; then
                echo "Failed to start existing PostgreSQL container 'pg'. Check Docker logs for 'pg'. Exiting." >&2
                exit 1
            fi
            echo "Existing PostgreSQL container 'pg' started."
        else
            echo "PostgreSQL container 'pg' is already running."
        fi
        echo "Skipping PostgreSQL data setup steps, assuming it's already configured."
    else
        echo "PostgreSQL container 'pg' not found. Proceeding with new setup..."
        # Optional: Stop nginx if it's running, in case Caddy needs ports (though Caddy manages its own).
        # if systemctl is-active --quiet nginx; then
        #     echo "Stopping Nginx (if running and if it conflicts with Caddy)..."
        #     systemctl stop nginx
        # fi

        echo "Pulling PostgreSQL Docker image (postgres:latest)..."
        if ! docker pull postgres:latest; then
            echo "Failed to pull PostgreSQL image. Check Docker Hub connectivity. Exiting." >&2
            exit 1
        fi
        echo "Creating Docker volume 'pgdata' for persistent storage..."
        docker volume create pgdata || { echo "Failed to create docker volume 'pgdata'. Exiting." >&2; exit 1; }
        
        echo "Running new PostgreSQL container 'pg'..."
        DB_USER="docker_user"
        DB_PASSWORD="postgres" # Consider making this configurable or auto-generated
        DB_NAME="deployer"

        if ! docker run --name pg --restart always \
            -e POSTGRES_USER="$DB_USER" \
            -e POSTGRES_PASSWORD="$DB_PASSWORD" \
            -e POSTGRES_DB="$DB_NAME" \
            -d -p 127.0.0.1:5432:5432 \
            -v pgdata:/var/lib/postgresql/data \
            postgres:latest; then
            echo "Failed to run PostgreSQL container. Check Docker daemon and image. Exiting." >&2
            exit 1
        fi
        echo "PostgreSQL container 'pg' started successfully with database '$DB_NAME' initialized."
        
        echo "Waiting for PostgreSQL to be fully ready (approx. 20-30 seconds)..."
        sleep 25 # Increased sleep, and DB is now created via environment variables

        # Database 'deployer' should be created automatically by POSTGRES_DB env var.
        # Verify connection and database existence
        echo "Verifying database '$DB_NAME' existence..."
        MAX_RETRIES=5
        RETRY_COUNT=0
        DB_READY=false
        until [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; do
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if docker exec pg psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
                DB_READY=true
                echo "Database '$DB_NAME' is ready and accessible."
                break
            fi
            echo "Attempt ${RETRY_COUNT}/${MAX_RETRIES} to connect to database '$DB_NAME' failed. Waiting 5 seconds..."
            sleep 5
        done

        if [ "$DB_READY" = false ]; then
            echo "Failed to connect to database '$DB_NAME' in container 'pg' after $MAX_RETRIES attempts." >&2
            echo "Showing last 50 lines of PostgreSQL container logs:"
            docker logs --tail 50 pg
            echo "Exiting." >&2
            exit 1
        fi
        
        # Path to SQL schema file. Assuming it's in the same directory as 'install.sh' or repo root.
        # If cloneRepo changed dir to backend_ts, this needs to be relative to script's original location or absolute.
        # For simplicity, assuming it's in /root/Deployer/backend_ts/ (where cloneRepo cd's into)
        # The script should ideally be run from /root or a known base path.
        # If the script is /root/install.sh, then path is Deployer/backend_ts/projects_rows.sql
        SCHEMA_SQL_PATH="/root/Deployer/backend_ts/projects_rows.sql" 
        if [ ! -f "$SCHEMA_SQL_PATH" ]; then
            echo "SQL schema file '$SCHEMA_SQL_PATH' not found!" >&2
            echo "Please ensure 'projects_rows.sql' is present at this location or update the path in the script." >&2
            echo "Skipping schema import." # Not exiting, to allow service setup if schema is optional / handled differently
        else
            echo "Copying schema file '$SCHEMA_SQL_PATH' to container 'pg'..."
            if ! docker cp "$SCHEMA_SQL_PATH" pg:/projects_rows.sql; then
                 echo "Failed to copy schema file to PostgreSQL container. Schema import aborted." >&2
            else
                echo "Importing schema from projects_rows.sql into '$DB_NAME' database..."
                if ! docker exec pg psql -U "$DB_USER" -d "$DB_NAME" -f /projects_rows.sql; then
                    echo "Failed to import schema into '$DB_NAME' database. Check SQL file and container logs." >&2
                    docker logs --tail 20 pg
                else
                    echo "Schema imported successfully into '$DB_NAME'."
                fi
            fi
        fi
    fi

    echo "Gathering user input for Deployer service configuration..."
    # Default values for user prompts
    DEFAULT_EMAIL="admin@example.com"
    DEFAULT_PASSWORD="Password123!" # Strongly recommend changing this
    DEFAULT_JWT_SECRET=$(openssl rand -hex 32) # Secure random default
    # Attempt to get public IP automatically, fallback to placeholder
    DEFAULT_PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me || curl -s --max-time 5 ipinfo.io/ip || echo "YOUR_SERVER_IP_ADDRESS")

    read -r -p "Enter Admin Email for Deployer [default: $DEFAULT_EMAIL]: " admin_email
    admin_email="${admin_email:-$DEFAULT_EMAIL}"
    
    read -r -s -p "Enter Admin Password for Deployer [default: $DEFAULT_PASSWORD]: " admin_password
    echo # Newline after silent input
    admin_password="${admin_password:-$DEFAULT_PASSWORD}"
    
    read -r -p "Enter JWT Secret Key for Deployer [default: randomly generated]: " jwt_secret
    jwt_secret="${jwt_secret:-$DEFAULT_JWT_SECRET}"
    
    read -r -p "Enter Server Public IP Address [detected: $DEFAULT_PUBLIC_IP]: " public_ip
    public_ip="${public_ip:-$DEFAULT_PUBLIC_IP}"

    echo "Creating/Updating systemd service file: /etc/systemd/system/deployer.service"
    # Using $NODE_EXEC_PATH_FOR_SERVICE determined at the beginning of this function
    # Using $DB_USER, $DB_PASSWORD, $DB_NAME, $admin_email, $admin_password, $jwt_secret, $public_ip
    cat <<EOL > /etc/systemd/system/deployer.service
[Unit]
Description=Deployer Node.js Application
Documentation=https://github.com/pranavkdileep/Deployer
After=network.target docker.service caddy.service
# BindsTo=docker.service # Ensures if docker stops, this stops. Consider if this is desired.

[Service]
User=root # Running as root is generally not recommended for Node apps. Consider a dedicated user.
Group=root

WorkingDirectory=/root/Deployer/backend_ts

# Dynamically determined path to Node.js executable
ExecStart=$NODE_EXEC_PATH_FOR_SERVICE dist/index.js

# Environment variables for the Deployer application
Environment=NODE_ENV=production
Environment="EMAIL=$admin_email"
Environment="PASSWORD=$admin_password"
Environment="JWT_SECRET=$jwt_secret"
Environment="PGSQL_USER=$DB_USER"
Environment="PGSQL_PASSWORD=$DB_PASSWORD"
Environment="PGSQL_HOST=localhost" # Backend connects to PostgreSQL via localhost mapping
Environment="PGSQL_PORT=5432"
Environment="PGSQL_DATABASE=$DB_NAME"
Environment="PGSQL_POOL_MODE=transaction" 
Environment="PUBLIC_IP=$public_ip"

Restart=always
RestartSec=10 # Restart service 10 seconds after a crash

# Logging configuration
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=deployer-nodejs

[Install]
WantedBy=multi-user.target
EOL
    echo "Systemd service file '/etc/systemd/system/deployer.service' created/updated successfully."
    echo "PostgreSQL setup and Deployer service configuration complete."
    echo "Important: If this is an update to an existing service, run 'systemctl daemon-reload' and 'systemctl restart deployer'."
}

# --- Main script execution flow ---
# Ensure this script is run from a sensible location, e.g. /root, as some paths are relative (like project_rows.sql).

# Check the distribution
if [ -f /etc/debian_version ]; then
    echo "Debian-based distribution detected."
    DISTRO_TYPE="debian"
elif [ -f /etc/redhat-release ]; then
    echo "CentOS-based distribution detected."
    DISTRO_TYPE="centos"
else
    echo "Unsupported Linux distribution. This script supports Debian-based and CentOS-based systems only." >&2
    exit 1
fi

# Call functions based on distro type or common for all
if [ "$DISTRO_TYPE" = "debian" ]; then
    installDockerDebian    # Installs Docker, Nixpacks, Caddy, build-essential
    installNvmNodeDebian   # Installs NVM and a specific Node.js version
    installTshark          # Debian-specific Tshark installation
elif [ "$DISTRO_TYPE" = "centos" ]; then
    installDockerCentos    # Installs Docker, Nixpacks, Caddy, Development Tools
    installNvmNodeCentos   # Installs NVM and a specific Node.js version
    echo "Note: Tshark installation for CentOS is not automatically handled by this script. Please install manually if needed."
fi

# Common steps for both distributions
cloneRepo              # Clones Deployer repo, npm install, npm build (needs Node.js from NVM)
setupPostgres          # Sets up PostgreSQL (Docker), generates deployer.service with dynamic Node path & user inputs
startNodeServerService # Reloads systemd, starts and enables the deployer.service

echo "----------------------------------------------------"
echo "Installation and setup script completed."
echo "Deployer service status: $(systemctl is-active deployer)"
echo "PostgreSQL container 'pg' status: $(docker ps -q -f name=pg)"
echo "Caddy status: $(systemctl is-active caddy)"
echo "----------------------------------------------------"
echo "Please check the output above for any errors or warnings."
echo "You may need to configure your DNS to point to $public_ip for web access."
echo "Default Admin Email (if not changed): $admin_email"
echo "Access Deployer via http(s)://$public_ip (Caddy might auto-enable HTTPS)"
echo "----------------------------------------------------"
