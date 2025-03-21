import { Response, Request } from "express";
import { connection } from "../lib/db";
import { buildImage, getContainerSates, startContainer, stopContainer, restartContainer, streamLogs, streamBuildout, deleteContainer } from "../managers/docker";
import { Build, DeploymentMethod, envfilejson, Resources, SetupSource } from "../dtos/build";
import { setDeploymentmethod, setEnvFile, setupSourceFromGit, setupSourceFromLocal } from "../managers/source";
import fileUpload from "express-fileupload";
import { Responsetemplate } from "../dtos/common";
import fs, { stat } from 'fs';
import { Buildnixpacks } from "../managers/nixpacks";
import { getCanddylog, setupDomain } from "../managers/domainmanagement";
import dotenv from 'dotenv';
dotenv.config();


export const getProjectslist = async (req: Request, res: Response) => {
    const query = `SELECT * FROM projects`;
    const rows = await connection.query(query);
    if (rows.rowCount === 0) {
        res.status(404).json({ message: 'No projects found', success: false });
    } else {
        res.status(200).json(rows.rows);
    }
};

export const buildImageHandler = async (req: Request<{}, {}, Build>, res: Response<Responsetemplate>) => {
    const buildconfig = req.body;
    if (!buildconfig.name || !buildconfig.dockerfile) {
        res.status(400).json({ message: 'Invalid Request',success:false });
    }
    else {
        try {
            res.status(200).json({ message: 'Docker Build Started',success:true });
            buildImage(buildconfig);
        } catch (err) {
            res.status(500).json({ message: 'Error Building Docker Image',success:false });
        }
    }
}

export const stopContainerHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!',success:false });
    }
    else {
        try {
            res.status(200).json({ message: 'Stopping Container Requested',success:true });
            stopContainer(name);
        } catch (err) {
            res.status(500).json({ message: 'Error Stopping Container',success:false });
        }
    }
}

export const startContainerHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        try {
            res.status(200).json({ message: 'Starting Container Requested' });
            startContainer(name);
        } catch (err) {
            res.status(500).json({ message: 'Error Starting Container' });
        }
    }
}

export const deleteContainerHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!',success:false });
    }
    else {
        try {
            res.status(200).json({ message: 'Deleting Container Requested',success:true });
            deleteContainer(name);
        } catch (err) {
            res.status(500).json({ message: 'Error Deleting Container',success:false });
        }
    }
}

export const getProjectDetails = async (req: Request<{ name: string }, {}>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        const sates = await getContainerSates(name);
        res.status(200).json(sates);
    }
}

export const restartContainerHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        try {
            res.status(200).json({ message: 'Restarting Container Requested' });
            restartContainer(name);
        } catch (err) {
            res.status(500).json({ message: 'Error Restarting Container' });
        }
    }
}

export const setupProjectSourceHandeler = async (req: Request<{}, {}, SetupSource>, res: Response) => {
    const source = req.body;
    if (!source.name || !source.sourceType) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        res.status(200).json({ message: 'Setting up Source' });
        if (source.sourceType === 'git') {
            setupSourceFromGit(source);
        }
        else if (source.sourceType === 'local') {
            setupSourceFromLocal(source);
        }
    }
}

export const uploadZipHandler = async (req: Request, res: Response) => {
    // save the zip file to ../projects
    if (!req.files || !req.files.zipfile) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        const zip = req.files.zipfile as fileUpload.UploadedFile;
        const projectPath = `../projects/${zip.name}`;
        zip.mv(projectPath, (err) => {
            if (err) {
                res.status(500).json({ message: 'Error Saving Zip File' });
            }
            else {
                console.log(req.body.name);
                setupSourceFromLocal({
                    name: req.body.name,
                    sourceType: 'local',
                    tempZipPath: projectPath
                });
                res.status(200).json({ message: 'Zip File Saved' });
            }
        });
    }
}

export const setDeploymentmethodHandler = async (req: Request<{}, {}, DeploymentMethod>, res: Response) => {
    const config = req.body;
    if (!config.name || !config.buildtype) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        setDeploymentmethod(config);
        res.status(200).json({ message: 'Deployment Method Set' });
    }
}

export const deployHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        const query = `SELECT * FROM projects WHERE name = '${name}'`;
        const result = await connection.query(query);
        console.log(result.rows);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Project Not Found' });
        }
        else {
            const project = result.rows[0];
            if (project.sourcestatus === 'TRUE') {
                if (project.deploytype === 'docker') {
                    const { dockerfile, port, sourcepath } = project;
                    let buildconfig: Build;
                    if (sourcepath === null) {
                        buildconfig = {
                            name: name,
                            dockerfile: dockerfile,
                            buildtype:'docker',
                            port: port
                        }
                    } else {
                        buildconfig = {
                            name: name,
                            dockerfile: dockerfile,
                            buildtype:'docker',
                            dir: sourcepath,
                            port: port
                        }
                        res.status(200).json({ message: 'Deployment Started' });
                        await buildImage(buildconfig);
                    }

                }else if(project.deploytype === 'nix'){
                    const {name,sourcepath,port,pkgs,apts,install_cmd,build_cmd,start_cmd} = project;
                    let buildconfig: Build;
                    if(sourcepath === null){
                        buildconfig = {
                            name:name,
                            port:port,
                            buildtype:'nix',
                            pkgs:pkgs,
                            apts:apts,
                            install_cmd:install_cmd,
                            build_cmd:build_cmd,
                            start_cmd:start_cmd,
                        }
                    }else{
                        buildconfig = {
                            name:name,
                            port:port,
                            buildtype:'nix',
                            pkgs:pkgs,
                            apts:apts,
                            install_cmd:install_cmd,
                            dir:sourcepath,
                            build_cmd:build_cmd,
                            start_cmd:start_cmd,
                        }
                    }
                    res.status(200).json({ message: 'Deployment Started' });
                    await Buildnixpacks(buildconfig)
                } else {
                    res.status(400).json({ message: 'Source Not Setup' });
                }
            }
        }
    }

}

export const createProjectHandler = async (req: Request<{}, {}, { name: string, description: string,hostport:number }>, res: Response) => {
    try {
        const { name, description,hostport } = req.body;
        if (!name || !description || !hostport) {
            res.status(400).json({ message: 'Invalid Request!', success: false });
        }
        else {
            const query = `INSERT INTO projects (name,description,hostport) VALUES ('${name}','${description}',${hostport}) RETURNING *`;
            const result = await connection.query(query);
            res.status(200).json({ message: 'Project Created', success: true, data: result.rows[0] });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error Creating Project', success: false });
    }
}

export const getDeployments = async (req: Request<{}, {},{name:string}>, res: Response) => {
    const {name} = req.body;
    if(!name){
        res.status(400).json({message:'Invalid Request',success:false});
    }
    else{
        const query = `SELECT * FROM deployments WHERE name = '${name}' ORDER BY created_at DESC LIMIT 20`;
        const result = await connection.query(query);
        if(result.rowCount === 0){
            res.status(404).json({message:'No Deployments Found',success:false});
        }
        else{
            res.status(200).json(result.rows);
        }
    }
}

export const setEnvFileHandler = async (req: Request<{}, {}, { name: string, envobj: envfilejson }>, res: Response) => {
    const { name, envobj } = req.body;
    if (!name || !envobj) {
        res.status(400).json({ message: 'Invalid Request!', success: false });
    }
    else {
        const setresult = await setEnvFile(name, envobj);
        if (setresult) {
            res.status(200).json({ message: 'Env File Set', success: true });
        }
        else {
            res.status(500).json({ message: 'Error Setting Env File', success: false });
        }
    }
}
export const getEnvFileHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        try{
            const projectPath = `../projects/${name}/envfile.json`;
            if (fs.existsSync(projectPath)) {
                const envfile = fs.readFileSync(projectPath);
                res.status(200).json({sucess:true,data:JSON.parse(envfile.toString())});
            }
            else {
                res.status(404).json({sucess:false,message:'Env File Not Found'});
            }
        }catch(err){
            res.status(500).json({sucess:false,message:'Error Getting Env File'});
        }
    }
}

export const streamBuildoutHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    if (!req.body.name) {
        res.status(400).json({ message: 'Invalid Request!',success:false });
    }
    else {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const { name } = req.body;
        streamBuildout(name,(log:string)=>{
            res.write(`data: ${log}\n\n`);
        });
    }
}

export const logStreem = async (name: string, streemlog : (log:string) => void) =>{
    streamLogs(name,(log:string)=>{
        streemlog(log);
    });
}

export const getDomainHandler = async (req: Request<{}, {}, { name: string }>, res: Response) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        const query = `SELECT * FROM projects WHERE name = '${name}'`;
        const result = await connection.query(query);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Project Not Found' });
        }
        else {
            const project = result.rows[0];
            if(project.open_domain === null || project.open_domain === ''){
                let domain = `${process.env.PUBLIC_IP}:${project.hostport}`;
                res.status(200).json({ domain: domain, ssl: false });
            }
            else{
                let domain = project.open_domain;
                res.status(200).json({ domain: domain, ssl: project.ishttps });
            }
        }
    }
}

export const DomainSetupHandler = async (req: Request<{}, {}, { name: string, domain: string, ssl: boolean }>, res: Response) => {
    const { name, domain, ssl } = req.body;
    if (!name || !domain || !ssl) {
        res.status(400).json({ message: 'Invalid Request!' });
    }
    else {
        const query = `SELECT * FROM projects WHERE name = '${name}'`;
        const result = await connection.query(query);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Project Not Found' });
        }
        else {
            const project = result.rows[0];
            const updatequery = `UPDATE projects SET open_domain = '${domain}', ishttps = ${ssl} WHERE name = '${name}' RETURNING *`;
            const updateresult = await connection.query(updatequery);
            const port = project.hostport;
            console.log(updateresult);
            try{
                setupDomain({
                    name: name,
                    domain: domain,
                    ssl: ssl,
                    port: port
                })
                res.status(200).json({ message: 'Domain Setup Started' });
            }catch(err){
                res.status(500).json({ message: 'Error Setting up Domain' });
            }
        }
    }
}

export const getCanddyOutHandler = async (req: Request<{}, {}, {}>, res: Response) => {
    try{
        let result = await getCanddylog();
        res.status(200).json({message:result});
    }catch(err){
        res.status(500).json({message:'Error Getting CaddyLog'});
    }
}

export const getResoucesHandler = async (req: Request<{}, {}, {name:string}>, res: Response) => {
    const {name} = req.body;
    if(!name){
        res.status(400).json({message:'Invalid Request'});
    }
    else{
        const query = `SELECT cpureservation, memoryreservation , cpulimit , memorylimit FROM projects WHERE name = '${name}'`;
        const result = await connection.query(query);
        if(result.rowCount === 0){
            res.status(404).json({message:'No Resources Found'});
        }
        else{
            res.status(200).json(result.rows[0]);
        }
    }
}

export const setResoucesHandler = async (req: Request<{}, {}, {name:string, resources : Resources}>, res: Response) => {
    const {name, resources} = req.body;
    if(!name || !resources){
        res.status(400).json({message:'Invalid Request'});
    }
    else{
        const query = `UPDATE projects SET cpureservation = ${resources.cpureservation}, memoryreservation = ${resources.memoryreservation}, cpulimit = ${resources.cpulimit}, memorylimit = ${resources.memorylimit} WHERE name = '${name}' RETURNING *`;
        const result = await connection.query(query);
        if(result.rowCount === 0){
            res.status(404).json({message:'No Resources Found'});
        }
        else{
            res.status(200).json({message:'Resources Set'});
        }
    }
}