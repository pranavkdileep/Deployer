#!bin/bash
# check if the user is root
if [ $(id -u) != 0 ]; then
    echo "You must be the superuser to run this script" >&2
    exit 1
fi

installDockerDebian() {
    apt install curl
    #uninstall unofficial docker
    for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do apt-get -y remove $pkg; done
    #install docker
    apt-get update
    apt-get install ca-certificates curl
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |
        tee /etc/apt/sources.list.d/docker.list >/dev/null
    apt-get update
    apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}
installDockerCentos() {
    yum install -y yum-utils device-mapper-persistent-data lvm2 curl git
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    echo "Docker installed"
}
installNvmNodeDebian() {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.bashrc
    nvm install node
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
    cd Deployer/backend-ts
    npm install
    cp env_example .env
    npm run build
    echo "Repo cloned"
}

startNodeServerService() {
    cp deployer.service /etc/systemd/system/
    systemctl start deployer
    systemctl enable deployer
    echo "Node server started"
}

# check the distro ubuntu debian based or centos based like redhat fedora
if [ -f /etc/debian_version ]; then
    echo "Debian based distro"
    installDockerDebian
    installNvmNodeDebian
elif [ -f /etc/redhat-release ]; then
    echo "Centos based distro"
    installDockerCentos
    installNvmNodeCentos
else
    echo "This script doesn't support your distro" >&2
    exit 1
fi
