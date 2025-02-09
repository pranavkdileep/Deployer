import fs from 'fs';
import { exec,execSync } from 'child_process';

export interface domainconfig {
    name: string;
    domain: string;
    port: number;
    ssl: boolean;
    customSSL: boolean;
    redirectHttps: boolean;
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
    if (domain.ssl) {
        if (!domain.customSSL) {
            config = `server {
    listen 80;
    server_name ${domain.domain};

    location / {
        proxy_pass http://localhost:${domain.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`
        } else {
            // Custom SSL
        }
    }
    else {
        // No SSL
    }
    return config;
}

export async function setupDomain(domain: domainconfig) {
    // generate nginx config
    let nginxConfig = generateNginxConfig(domain);
    // write nginx config
    const filepath = `/etc/nginx/sites-available/${domain.name}`
    fs.writeFileSync(filepath, nginxConfig!);
    // create symbolic link
    fs.symlinkSync(filepath, `/etc/nginx/sites-enabled/${domain.name}`);
    // restart nginx
    exec('sudo systemctl restart nginx');
    console.log('Domain Setup Complete');
    if (!domain.customSSL) {
        installCertbot();
        generateSSLCertificate(domain.domain);
        restartNginx();
    }

}

// demo usage
setupDomain({
    name: 'test',
    domain: 'test.com',
    port: 8000,
    ssl: true,
    customSSL: false,
    redirectHttps: false
})