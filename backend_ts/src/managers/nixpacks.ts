import { spawn } from 'child_process';
import { Build } from '../dtos/build';
import { connection } from '../lib/db';
import fs from "fs";
import { runContainer } from './docker';

export const Buildnixpacks = async (config:Build) => {
    try{
        const {name,dir,port,pkgs,apts,install_cmd,build_cmd,start_cmd} = config;
        const createdeployment = await connection.query(`INSERT INTO deployments (name) VALUES ('${name}') RETURNING *`);
        const deploymentid = createdeployment.rows[0].id;
        await checknixInstalled();
        const path = `../projects/${name}/${dir ? dir : ''}`;
        const buildout = `../projects/${name}/buildout.txt`;
        if (fs.existsSync(buildout)) {
            fs.writeFileSync(buildout, '');
        }

        let buildcmd = `nixpacks build ${path} --name ${name}`;
        if (pkgs!="undefined") {
            buildcmd += ` --pkgs ${pkgs}`;
        }
        if (apts!="undefined") {
            buildcmd += ` --apt ${apts}`;
        }
        if (start_cmd!="undefined") {
            buildcmd += ` --start-cmd "${start_cmd}"`;
        }
        if (install_cmd!="undefined") {
            buildcmd += ` --install-cmd "${install_cmd}"`;
        }
        if (build_cmd!="undefined") {
            buildcmd += ` --build-cmd "${build_cmd}"`;
        }
        console.log(buildcmd);
        const build = spawn(buildcmd,{shell:true});
        build.stdout.on('data', (data: Buffer) => {
                fs.appendFileSync(buildout, data.toString());
            });
        
            build.stderr.on('data', (data: Buffer) => {
                fs.appendFileSync(buildout, data.toString());
            });
            
            build.on('close', async (code: number) => {
                if (code === 0) {
                    console.log('Docker Image Built Successfully');
                    const query = `UPDATE projects SET buildstatus = 'success' WHERE name = '${name}' RETURNING *`;
                    const resuilt = await connection.query(query);
                    console.log(resuilt.rows);
                    await connection.query(`UPDATE deployments SET status = 'success' WHERE id = '${deploymentid}'`);
                    runContainer({
                        name: name,
                        port: port,
                        buildtype: 'nix',
                    });
                } else {
                    console.log('Error Building Docker Image');
                    const query = `UPDATE projects SET buildstatus = 'failed' WHERE name = '${name}' RETURNING *`;
                    const resuilt = await connection.query(query);
                    console.log(resuilt.rows);
                    await connection.query(`UPDATE deployments SET status = 'failed' WHERE id = '${deploymentid}'`);
                }
                const buildouts = fs.readFileSync(`${path}buildout.txt`, 'utf-8');
                await connection.query('UPDATE deployments SET log = $1 WHERE id = $2', [buildouts, deploymentid]);
            });

    } catch (e) {
        console.log(e);
    }
}

const checknixInstalled = async () => {
    return new Promise((resolve,reject)=>{
        let cmd = spawn('which', ['nixpacks']);
        cmd.on("close",()=>{
            resolve(true);
        });
        cmd.on("error",(err)=>{
            reject(err);
        })
    }
    )
}