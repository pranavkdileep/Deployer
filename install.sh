#!bin/bash
# check if the user is root
if [ $(id -u) != 0 ]; then
    echo "You must be the superuser to run this script" >&2
    exit 1
fi

installDockerDebian(){
    apt install curl
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common git
    curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    echo "Docker installed"
}
installDockerCentos(){
    yum install -y yum-utils device-mapper-persistent-data lvm2 curl git
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    echo "Docker installed"
}
installNvmNodeDebian(){
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.bashrc
    nvm install node
    echo "Node.js installed"
}
installNvmNodeCentos(){
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.bashrc
    nvm install node
    echo "Node.js installed"
}

cloneRepo(){
    git clone https://github.com/pranavkdileep/Deployer
    cd Deployer/backend-ts
    npm install
    cp env_example .env
    npm run build
    echo "Repo cloned"
}

startNodeServerService(){
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
