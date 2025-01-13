import { Build } from '../dtos/build';
import fs from 'fs';
const { spawnSync } = require('child_process');
import { connection } from "../lib/db";
import Dockerode from 'dockerode';

const docker = new Dockerode();


export async function buildImage(buildconfig: Build) {
    const { name, dockerfile, port, prevConainerId } = buildconfig;
    const path = `../projects/${name}/`;
    //build the image in the path
    const buildouttxt = fs.openSync(`${path}buildout.txt`, 'w');
    const dockerfilePath = path + dockerfile;
    const dockerBuild = `docker build -t ${name} -f ${dockerfilePath} ${path}`;
    const build = spawnSync(dockerBuild, { shell: true, stdio: [buildouttxt, buildouttxt, buildouttxt] });
    if (build.status === 0) {
        console.log('Docker Image Built Successfully');
        //update build status in db projects table and print the rows
        const query = `UPDATE projects SET buildstatus = 'success' WHERE name = '${name}' RETURNING *`;
        const resuilt = await connection.query(query);
        console.log(resuilt.rows);
        runContainer({
            name: name,
            port: port,
            dockerfile: dockerfile,
            prevConainerId: prevConainerId
        });
    }
    else {
        console.log('Error Building Docker Image');
        const query = `UPDATE projects SET buildstatus = 'failed' WHERE name = '${name}' RETURNING *`;
        const resuilt = await connection.query(query);
        console.log(resuilt.rows);
    }
}

export async function runContainer(runconfig: Build) {
    const { name, port, prevConainerId } = runconfig;
    const portstring = `${port}/tcp`;
    const path = `../projects/${name}/`;
    const outputstream = fs.createWriteStream(`${path}runout.txt`);

    try {
        if (prevConainerId) {
            console.log('Stopping and Removing Previous Container');
            const prevContainer = docker.getContainer(prevConainerId);
            await prevContainer.stop();
            await prevContainer.remove();
        } else {
            //search for container with same name
            const query = `SELECT * FROM projects WHERE name = '${name}'`;
            const resuilt = await connection.query(query);
            if (resuilt.rowCount ? resuilt.rowCount > 0 : false) {
                const prevConainerId = resuilt.rows[0].container_id;
                if (prevConainerId) {
                    console.log('Stopping and Removing Previous Container');
                    const prevContainer = docker.getContainer(prevConainerId);
                    await prevContainer.stop();
                    await prevContainer.remove();
                }
            }
        }
        const container = await docker.createContainer({
            Image: name,
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
        await container.start();
        const query = `UPDATE projects SET container_id = '${container.id}' WHERE name = '${name}' RETURNING *`;
        const resuilt = await connection.query(query);
        console.log(`Docker Container ${name} started on port ${port}`);
    } catch (err) {
        console.log('Error Running Docker Container', err);
    }
}

export async function stopContainer(name: string) {
    try {
        console.log('Stopping Container ' + name);
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        console.log(listcontainers);
        const container = docker.getContainer(listcontainers[0].Id);
        await container.stop();
        const query = `UPDATE projects SET container_id = NULL WHERE name = '${name}' RETURNING *`;
    }catch(err){
        console.log('Error Stopping Docker Container',err);
    }
}

export async function startContainer(name: string) {
    
}


