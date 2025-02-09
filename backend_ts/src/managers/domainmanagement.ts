import fs from 'fs';
import { exec } from 'child_process';

export interface domainconfig {
    name: string;
    domain: string;
    port: number;
    ssl: boolean;
    customSSL: boolean;
    redirectHttps: boolean;
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