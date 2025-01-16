import { HomeDto, ProjectsDto } from "../dtos/home";
import { exec } from 'child_process';
import os from 'os';
import fs from 'fs';
import Dockerode from 'dockerode';
import { connection } from "../lib/db";

const docker = new Dockerode();

interface diskUsage {
    used: string;
    total: string;
    percent: string;
}

function getCpuUsage() {
    return new Promise((resolve) => {
        exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (error, stdout) => {
            if (error) resolve(0);
            resolve(parseFloat(stdout.trim()).toFixed(2));
        });
    });
}
function getRamUsage() {
    const totalRam = os.totalmem() / (1024 * 1024);
    const freeRam = os.freemem() / (1024 * 1024);
    const usedRam = totalRam - freeRam;
    const percentUsed = ((usedRam / totalRam) * 100).toFixed(2);

    return {
        total: `${totalRam.toFixed(2)} MB`,
        used: `${usedRam.toFixed(2)} MB`,
        percent: `${percentUsed}%`
    };
}
function getDiskUsage(): Promise<diskUsage> {
    return new Promise((resolve) => {
        exec("df -h / | awk '$NF==\"/\"{printf \"%d,%d,%s\", $3, $2, $5}'", (error, stdout) => {
            if (error) resolve({ used: '0 GB', total: '0 GB', percent: '0%' });
            const [used, total, percent] = stdout.trim().split(',');
            const diskUsage: diskUsage = {
                used: `${used} GB`,
                total: `${total} GB`,
                percent: percent
            };
            resolve(diskUsage);
        });
    });
}
function getNetworkUsage() {
    const interfaces = os.networkInterfaces();
    //console.log(interfaces);
    let rxBytes = 0;
    let txBytes = 0;

    for (const iface of Object.keys(interfaces)) {
        if (interfaces[iface] && interfaces[iface][0].internal === false) {
            rxBytes += parseInt(fs.readFileSync(`/sys/class/net/${iface}/statistics/rx_bytes`, 'utf8')) || 0;
            txBytes += parseInt(fs.readFileSync(`/sys/class/net/${iface}/statistics/tx_bytes`, 'utf8')) || 0;
        }
    }

    return {
        received: `${(rxBytes / (1024 * 1024)).toFixed(2)} MB`,
        transmitted: `${(txBytes / (1024 * 1024)).toFixed(2)} MB`
    };
}

export const getSystemInfo = async (): Promise<HomeDto> => {
    const cpuUsage = await getCpuUsage();
    const ramUsage = getRamUsage();
    const diskUsage: diskUsage = await getDiskUsage();
    const networkUsage = getNetworkUsage();
    const homeDto: HomeDto = {
        cpu: `${cpuUsage}%`,
        ram: ramUsage,
        disk: {
            used: diskUsage.used,
            total: diskUsage.total,
            percent: diskUsage.percent
        },
        network: networkUsage
    };
    return homeDto;
};

const getConainer = async (name: string) => {
    const listcontainers = await docker.listContainers({ filters: { name: [name] } });
    if (listcontainers.length > 0) {
        const container = docker.getContainer(listcontainers[0].Id);
        return container;
    }
    return null;
}

function getDockerStats(name: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        exec(`docker stats ${name} --no-stream --format '{{json .}}'`, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error executing docker stats: ${error.message}`);
            }
            if (stderr) {
                return reject(`Error in output: ${stderr}`);
            }
            try {
                const stats = stdout
                    .trim()
                    .split("\n")
                    .map(line => JSON.parse(line));
                resolve(stats);
            } catch (parseError) {
                reject(`Error parsing JSON: `);
            }
        });
    });
}

export const getProjects = async (): Promise<ProjectsDto> => {
    console.log('Getting Projects');
    const query = `SELECT * FROM projects`;
    const resuilt = await connection.query(query);
    const projectsDto: ProjectsDto = {
        projects: []
    };
    try {
        for (const project of resuilt.rows) {
            const id = project.id;
            const name = project.name;
            const description = project.description;
            const created_at = project.created_at;
            const container = await getConainer(name);
            const inspect = container ? await container.inspect() : null;
            const status = inspect ? inspect.State.Status : 'Stopped';
            const updated_at = inspect ? inspect.Created : '';
            const open_domains = project.open_domains;
            const open_ports = inspect ? Object.keys(inspect.Config.ExposedPorts) : [];
            const stats = status === 'running' ? await getDockerStats(name) : null;
            const cpu = stats? stats[0].CPUPerc : '0';
            const ram = stats? stats[0].MemUsage : '0';
            const networkio = stats? stats[0].NetIO : '0';
            projectsDto.projects.push({
                id,
                name,
                description,
                created_at,
                updated_at,
                status,
                cpu,
                ram,
                networkio,
                open_ports,
                open_domains
            });

        }

        return projectsDto;
    }catch(err){
        console.log('Error Getting Projects',err);
        return projectsDto;
    }
}
