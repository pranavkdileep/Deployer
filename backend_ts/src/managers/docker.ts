import { Build,envfilejson } from '../dtos/build';
import fs from 'fs';
const { spawnSync } = require('child_process');
import { connection } from "../lib/db";
import Dockerode from 'dockerode';
import { spawn } from 'child_process';

const docker = new Dockerode();




export async function buildImage(buildconfig: Build) {
    const { name, dockerfile, port, dir } = buildconfig;
    const createdeployment = await connection.query(`INSERT INTO deployments (name) VALUES ('${name}') RETURNING *`);
    const deploymentid = createdeployment.rows[0].id;
    console.log(deploymentid);
    const path = `../projects/${name}/${dir ? dir : ''}`;
    const dockerfilePath = path + dockerfile;
    const buildout = `${path}buildout.txt`;
    if (fs.existsSync(buildout)) {
        fs.writeFileSync(buildout, '');
    }
    const dockerBuild = `docker build -t ${name} -f ${dockerfilePath} ${path}`;
    const build = spawn(dockerBuild, { shell: true });

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
                dockerfile: dockerfile,
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
}

export async function runContainer(runconfig: Build) {
    const { name, port } = runconfig;
    const portstring = `${port}/tcp`;
    const path = `../projects/${name}/`;
    //ToDo: get hostport from db
    const hostportrq = await connection.query(`SELECT hostport FROM projects WHERE name = '${name}'`);
    const hostport = hostportrq.rows[0].hostport;
    let envstring:string[] = [];
    if (fs.existsSync(`${path}envfile.json`)) {
        const envfile = fs.readFileSync(`${path}envfile.json`, 'utf-8');
        const envjson = JSON.parse(envfile) as envfilejson[];
        const env = envjson.map((env) => {
            envstring.push(`${env.key}=${env.value}`);
            return `${env.key}=${env.value}`;
        });
    }
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
            Env: envstring,
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
    } catch (err) {
        console.log('Error Stopping Docker Container', err);
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
    } catch (err) {
        console.log('Error Stopping Docker Container', err);
    }
}

export async function restartContainer(name: string) {
    try {
        console.log('restarting Container ' + name);
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        console.log(listcontainers);
        const container = docker.getContainer(listcontainers[0].Id);
        await container.restart();
    } catch (err) {
        console.log('Error restarting Docker Container', err);
    }
}

export async function getContainerSates(name: string) {
    try {
        console.log('Getting Container States ' + name);
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        const container = docker.getContainer(listcontainers[0].Id);
        const stats = await container.stats({ stream: false });
        return stats;
    } catch (err) {
        console.log('Error Getting Docker Container States', err);
    }
}

export async function streamLogs(name: string, streamer: (log: string) => void) {
    try {
        console.log('Streaming Logs for Container ' + name);
        const listcontainers = await docker.listContainers({ filters: { name: [name] } });
        if (!listcontainers.length) {
            throw new Error('Container not found');
        }
        const container = docker.getContainer(listcontainers[0].Id);
        const logStream = await container.logs({
            follow: true,
            stdout: true,
            stderr: true
        });
        logStream.setEncoding('utf-8');
        logStream.on('data', (data: string) => {
            const buffer: Buffer = Buffer.from(data);
            const log = buffer.subarray(8).toString();
            streamer(log);
        });
        logStream.on('error', (err: Error) => {
            throw err;
        });
        logStream.on('end', () => {
            console.log('Log stream ended');
        });

    } catch (err) {
        console.log('Error Getting Docker Container States', err);
        streamer('Error Getting Docker Container States');
    }
}

export async function streamBuildout(name: string, streamer: (log: string) => void) {
    try {
        const path = `../projects/${name}/`;
        const filePath = `${path}buildout.txt`;
        while(!fs.existsSync(filePath)){
            streamer(Buffer.from('Waiting for build to start').toString('base64'));
            console.log(fs.existsSync(filePath));
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        streamer(Buffer.from(fs.readFileSync(filePath)).toString('base64'));
        fs.watch(filePath, (eventType) => {
            if (eventType === 'change') {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                    } else {
                        const encoded = Buffer.from(data).toString('base64');
                        streamer(encoded);
                        console.log('New file contents:\n', data);
                    }
                });
            }
        });
    } catch (err) {
        console.log('Error Getting Docker Container States', err);
        streamer(Buffer.from('Error Getting Docker Container States').toString('base64'));
    }
}