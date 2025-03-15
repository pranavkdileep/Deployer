import fs from 'fs';
import { exec,execSync } from 'child_process';
import { query, wellknown } from 'dns-query';
import dotenv from 'dotenv';
dotenv.config();

const public_ip = process.env.PUBLIC_IP || '';

export interface domainconfig {
    name: string;
    domain: string;
    port: number;
    ssl: boolean;
}



function restartCanddy(): void {
    execSync('sudo systemctl restart caddy', { stdio: 'inherit' });
    console.log('Nginx restarted successfully.');
}


async function setupCanddy(config: domainconfig){
    let {name,domain,port,ssl} = config;
    if(!ssl){
        domain = `http://${domain}`;
    }
    try{
        //generate new line that appends to canddy file
        let candyfile = `${domain} {
            reverse_proxy localhost:${port}
        }`;
        //append the new line to canddy file
        await fs.promises.appendFile('/etc/caddy/Caddyfile',candyfile,{encoding:'utf-8'});
        console.log(`Added ${domain} to Caddyfile`);

    }catch(e){
        console.error(e);
    }
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

export async function setupDomain(domain: domainconfig) {
    if(await checkDomainARecord(domain.domain)){
        console.log("Domain A record exists");
        setupCanddy(domain);
        restartCanddy();
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