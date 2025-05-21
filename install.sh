#!bin/bash
# check if the user is root
if [ $(id -u) != 0 ]; then
    echo "You must be the superuser to run this script" >&2
    exit 1
fi

export DEBIAN_FRONTEND=noninteractive

installDockerDebian() {
    #uninstall unofficial docker
    for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do apt-get -y remove $pkg; done
    #install docker
    apt-get update
    apt-get -y install ca-certificates curl
#     install -m 0755 -d /etc/apt/keyrings
#     curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
#     chmod a+r /etc/apt/keyrings/docker.asc
#     echo \
#         "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
#   $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |
#         tee /etc/apt/sources.list.d/docker.list >/dev/null
#     apt-get update
#     apt-get -y \
#     -o Dpkg::Options::="--force-confdef" \
#     -o Dpkg::Options::="--force-confold" \
#     install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    curl -sSL https://nixpacks.com/install.sh | bash
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/deb.deb.txt' | sudo tee -a /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy -y
    sudo rm -f /etc/caddy/Caddyfile && echo -e "{\n    admin localhost:2019\n}" | sudo tee /etc/caddy/Caddyfile > /dev/null
    sudo systemctl restart caddy
    sudo apt install build-essential -y
    echo "Docker installed"

}
installDockerCentos() {
    yum install -y yum-utils device-mapper-persistent-data lvm2 curl git
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    echo "Docker installed"
}
installNvmNodeDebian() {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 23.6.0
    # setup npm and node in /root/.nvm/versions/node/v23.6.0/bin/node and /root/.nvm/versions/node/v23.6.0/bin/npm
    
    echo "Node.js installed"
}
installNvmNodeCentos() {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.bashrc
    nvm install node
    echo "Node.js installed"
}

cloneRepo() {
    git clone https://github.com/pranavkdileep/Deployer
    cd Deployer/backend_ts/
    npm install
    cp env_example .env
    npm run build
    echo "Repo cloned"
}

installTshark() {
    echo "Installing tshark"
    echo "wireshark-common wireshark-common/install-setuid boolean true" | sudo debconf-set-selections
    sudo apt update
    sudo apt install -y tshark
    echo "Tshark installed"
}

startNodeServerService() {
    cp deployer.service /etc/systemd/system/
    systemctl start deployer
    systemctl enable deployer
    echo "Node server started"
}

setupPostgres(){
    systemctl stop nginx
    #pull image
    docker pull postgres:latest
    #create volume
    docker volume create pgdata
    #run container
    docker run --name pg --restart always -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=docker_user -d -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres:latest
    echo "Postgres setup"
    # create database
    docker start pg
    # wait 30 seconds for postgres to start
    sleep 8
    #docker exec -it pg psql -U docker_user -c "CREATE DATABASE deployer;"
    docker exec -it pg psql -U docker_user -c "CREATE DATABASE deployer;"
    echo "Database created"
    #create table projects
    #import schema
    docker cp projects_rows.sql pg:/projects_rows.sql
    docker exec -it pg psql -U docker_user -d deployer -f projects_rows.sql
    echo "Schema imported"
    echo "Enter Admin Emain:"
    read email
    echo "Enter Admin Password:"
    read password
    echo "Enter JWT Securty Key:"
    read jwt
    echo "Enter Server Public IP:"
    read pubip
    cat <<EOL > deployer.service
    [Unit]
    Description=Node.js Application
    Documentation=https://example.com/docs
    After=network.target

    [Service]
    # User is root
    User=root

    # Path to the application directory
    WorkingDirectory=/root/Deployer/backend_ts

    # Command to start the app
    ExecStart=/root/.nvm/versions/node/v23.6.0/bin/node dist/index.js

    # Environment variables

    Environment=NODE_ENV=production
    Environment=EMAIL=$email
    Environment=PASSWORD=$password
    Environment=JWT_SECRET=$jwt
    Environment=PGSQL_USER=docker_user
    Environment=PGSQL_PASSWORD=postgres
    Environment=PGSQL_HOST=localhost
    Environment=PGSQL_PORT=5432
    Environment=PGSQL_DATABASE=deployer
    Environment=PGSQL_POOL_MODE=transaction
    Environment=PUBLIC_IP=$pubip

    Restart=always
    RestartSec=10

    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=nodejs-app

    [Install]
    WantedBy=multi-user.target

EOL


}



# check the distro ubuntu debian based or centos based like redhat fedora
if [ -f /etc/debian_version ]; then
    echo "Debian based distro"
    installDockerDebian
    installNvmNodeDebian
    installTshark
    cloneRepo
    setupPostgres
    startNodeServerService
elif [ -f /etc/redhat-release ]; then
    echo "Centos based distro"
    installDockerCentos
    installNvmNodeCentos
else
    echo "This script doesn't support your distro" >&2
    exit 1
fi
