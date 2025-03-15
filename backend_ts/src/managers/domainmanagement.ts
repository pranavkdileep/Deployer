import fs from 'fs';
import { exec,execSync } from 'child_process';
import { query, wellknown } from 'dns-query'
import dotenv from 'dotenv';
dotenv.config();

const public_ip = process.env.PUBLIC_IP || '';

export interface domainconfig {
    name: string;
    domain: string;
    port: number;
    ssl: boolean;
}

function installCertbot(): void {
    try {
        execSync('certbot --version', { stdio: 'ignore' });
        console.log('Certbot is already installed.');
    } catch (error) {
        console.log('Installing Certbot...');
        execSync('sudo apt update && sudo apt install -y certbot python3-certbot-nginx', { stdio: 'inherit' });
    }
}

function generateSSLCertificate(domain: string): void {
    const command = `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos -m admin@${domain}`;
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`SSL certificate successfully generated for ${domain}`);
    } catch (error) {
        console.error(`Failed to generate SSL certificate for ${domain}`);
    }
}

function restartNginx(): void {
    execSync('sudo systemctl restart nginx', { stdio: 'inherit' });
    console.log('Nginx restarted successfully.');
}


function generateNginxConfig(domain: domainconfig) {
    let config;
    if (!fs.existsSync('/etc/nginx/sites-available')) {
        fs.mkdirSync('/etc/nginx/sites-available');
    }

    if (domain.ssl) {
        config = `
server {
    listen 80;
    server_name ${domain.domain};
    return 301 https://${domain.domain}$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain.domain};

    ssl_certificate /etc/letsencrypt/live/${domain.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain.domain}/privkey.pem;

    location / {
        proxy_pass http://localhost:${domain.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
        generateSSLCertificate(domain.domain);
    } else {
        config = `
server {
    listen 80;
    server_name ${domain.domain};

    location / {
        proxy_pass http://localhost:${domain.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
    }

    fs.writeFileSync(`/etc/nginx/sites-available/${domain.name}`, config);
    if (!fs.existsSync(`/etc/nginx/sites-enabled/${domain.name}`)) {
        fs.symlinkSync(`/etc/nginx/sites-available/${domain.name}`, `/etc/nginx/sites-enabled/${domain.name}`);
    }

    return config;
}

async function checkDomainARecord(domain:string){
    let endpoints = await wellknown.endpoints()
    const { answers, rcode } = await query({
        question:{
            type:'A',
            name:domain
        }
    },{endpoints: endpoints});
    if(rcode === 'NOERROR'){
        console.log(answers);
        if(answers && answers[0].data === public_ip){
            return true;
        }
        else{
            return false;
        }
    }else{
        console.log(rcode);
        return false;
    }
}
installCertbot();

export async function setupDomain(domain: domainconfig) {
    if(await checkDomainARecord(domain.domain)){
        console.log("Domain A record exists");
        generateNginxConfig(domain);
        restartNginx();
    }else{
        console.log("Domain A record does not exist");
    }
}

console.log(public_ip);
let testconfig : domainconfig ={
    name:"testproject",
    domain:"testdigi.pkd.in.net",
    port:8000,
    ssl:true
}

setupDomain(testconfig);