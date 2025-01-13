import { Build, Run } from '../dtos/build';
import fs from 'fs';
const { spawnSync } = require('child_process');
import { connection } from "../lib/db";
import Dockerode from 'dockerode';

const docker = new Dockerode();


export async function buildImage(buildconfig:Build){
    const {name,dockerfile} = buildconfig;
    const path = `../projects/${name}/`;
    //build the image in the path
    const buildouttxt = fs.openSync(`${path}buildout.txt`, 'w');
    const dockerfilePath = path + dockerfile;
    const dockerBuild = `docker build -t ${name} -f ${dockerfilePath} ${path}`;
    const build = spawnSync(dockerBuild, {shell: true, stdio: [buildouttxt, buildouttxt, buildouttxt]});
        if(build.status === 0){
            console.log('Docker Image Built Successfully');
            //update build status in db projects table and print the rows
            const query = `UPDATE projects SET buildstatus = 'success' WHERE name = '${name}' RETURNING *`;
            const resuilt = await connection.query(query);
            console.log(resuilt.rows);
            runContainer({
                name:name,
                port:8000,
                image:name
            });
        }
        else{   
            console.log('Error Building Docker Image');
            const query = `UPDATE projects SET buildstatus = 'failed' WHERE name = '${name}' RETURNING *`;
            const resuilt = await connection.query(query);
            console.log(resuilt.rows);
        }
}

export async function runContainer(runconfig: Run) {
    const { name, image, port } = runconfig;
    const portstring = `${port}/tcp`;
    const path = `../projects/${name}/`;
    const outputstream = fs.createWriteStream(`${path}runout.txt`);

    try {
        const container = await docker.createContainer({
            Image: image,
            name: name,
            ExposedPorts: {
                [portstring]: {}
            },
            HostConfig: {
                PortBindings: {
                    [portstring]: [
                        {
                            HostPort: `${port}`
                        }
                    ]
                }
            }
        });
        console.log(container.id);
        await docker.getContainer(container.id).start();
        console.log(`Docker Container ${name} started on port ${port}`);
    } catch (err) {
        console.log('Error Running Docker Container', err);
    }
}