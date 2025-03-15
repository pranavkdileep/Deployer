import fs from 'fs';
import { execSync } from 'child_process';
import { query, wellknown } from 'dns-query';
import dotenv from 'dotenv';
import { connection } from '../lib/db';
import axios from 'axios';
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
    let https = ssl ? 'https' : 'http';
    try{
        const payload = {
            "apps": {
                'https': {
                    "servers": {
                        name: {
                            "listen": [":80"],
                            "routes": [
                                {
                                    "match": [{ "host": [domain] }],
                                    "handle": [{ "handler": "reverse_proxy", "upstreams": [{ "dial": `localhost:${port}` }] }]
                                }
                            ]
                        }
                    }
                }
            }
        };
        const response = await axios.post("http://localhost:2019/load", payload);
        console.log("Domain added successfully:", response.data);
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
        const sql = `UPDATE projects SET open_domain = '${domain.domain}', ishttps = ${domain.ssl} WHERE name = '${domain.name}' RETURNING *`;
        console.log(sql);
        const result = await connection.query(sql);
        console.log(result);
    }else{
        console.log("Domain A record does not exist");
    }
}



