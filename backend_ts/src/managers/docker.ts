import { Build } from '../dtos/build';
import fs from 'fs';
const { spawnSync } = require('child_process');
import { connection } from "../lib/db";
import Dockerode from 'dockerode';

const docker = new Dockerode();


export async function buildImage(buildconfig: Build) {
    const { name, dockerfile, port,dir } = buildconfig;
    const createdeployment = await connection.query(`INSERT INTO deployments (name) VALUES ('${name}') RETURNING *`);
    const deploymentid = createdeployment.rows[0].id;
    console.log(deploymentid);
    const path = `../projects/${name}/${dir ? dir : ''}`;
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
        await connection.query(`UPDATE deployments SET status = 'success' WHERE id = '${deploymentid}'`);
        runContainer({
            name: name,
            port: port,
            dockerfile: dockerfile,
        });
    }
    else {
        console.log('Error Building Docker Image');
        const query = `UPDATE projects SET buildstatus = 'failed' WHERE name = '${name}' RETURNING *`;
        const resuilt = await connection.query(query);
        console.log(resuilt.rows);
        await connection.query(`UPDATE deployments SET status = 'failed' WHERE id = '${deploymentid}'`);
    }
    const buildouts = fs.readFileSync(`${path}buildout.txt`, 'utf-8');
    await connection.query('UPDATE deployments SET log = $1 WHERE id = $2', [buildouts, deploymentid]);
}

export async function runContainer(runconfig: Build) {
    const { name, port } = runconfig;
    const portstring = `${port}/tcp`;
    const path = `../projects/${name}/`;
    const outputstream = fs.createWriteStream(`${path}runout.txt`);
    //random port between 4500 and 4650
    const hostport = Math.floor(Math.random() * (4650 - 4500 + 1)) + 4500;

    try {
        // check any container running with name the remove it
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        if (listcontainers.length > 0) {
            console.log('Container Already Running, Stopping it');
            const container = docker.getContainer(listcontainers[0].Id);
            await container.stop();
            await container.remove();
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
                            HostPort: hostport.toString()
                        }
                    ]
                }
            }
        });
        console.log(container.id);
        await container.start();
        const query = `UPDATE projects SET container_id = '${container.id}', hostport = ${hostport} WHERE name = '${name}' RETURNING *`;
        const resuilt = await connection.query(query);
        console.log(`Docker Container ${name} started on port ${hostport}`);
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
        await container.pause();
        const query = `UPDATE projects SET container_id = NULL WHERE name = '${name}' RETURNING *`;
    }catch(err){
        console.log('Error Stopping Docker Container',err);
    }
}

export async function startContainer(name: string) {
    try {
        console.log('starting Container ' + name);
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        console.log(listcontainers);
        const container = docker.getContainer(listcontainers[0].Id);
        await container.unpause();
        const query = `UPDATE projects SET container_id = NULL WHERE name = '${name}' RETURNING *`;
    }catch(err){
        console.log('Error Stopping Docker Container',err);
    }
}

export async function restartContainer(name: string) {
    try {
        console.log('restarting Container ' + name);
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        console.log(listcontainers);
        const container = docker.getContainer(listcontainers[0].Id);
        await container.restart();
    }catch(err){
        console.log('Error restarting Docker Container',err);
    }
}

export async function getContainerSates(name: string){
    try {
        console.log('Getting Container States ' + name);
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        const container = docker.getContainer(listcontainers[0].Id);
        const stats = await container.stats({stream:false});
        return stats;
    }catch(err){
        console.log('Error Getting Docker Container States',err);
    }
}
