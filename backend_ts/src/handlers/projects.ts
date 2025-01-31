import { Response, Request } from "express";
import { connection } from "../lib/db";
import { buildImage, getContainerSates, startContainer, stopContainer, restartContainer, streamLogs } from "../managers/docker";
import { Build, DeploymentMethod, SetupSource } from "../dtos/build";
import { setDeploymentmethod, setupSourceFromGit, setupSourceFromLocal } from "../managers/source";
import fileUpload from "express-fileupload";
import { Responsetemplate } from "../dtos/common";


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
                            port: port
                        }
                    } else {
                        buildconfig = {
                            name: name,
                            dockerfile: dockerfile,
                            dir: sourcepath,
                            port: port
                        }
                        res.status(200).json({ message: 'Deployment Started' });
                        await buildImage(buildconfig);
                    }

                } else {
                    res.status(400).json({ message: 'Source Not Setup' });
                }
            }
        }
    }

}

export const createProjectHandler = async (req: Request<{}, {}, { name: string, description: string }>, res: Response) => {
    try {
        const { name, description } = req.body;
        if (!name || !description) {
            res.status(400).json({ message: 'Invalid Request!', success: false });
        }
        else {
            const query = `INSERT INTO projects (name,description) VALUES ('${name}','${description}') RETURNING *`;
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

export const logStreem = async (name: string, streemlog : (log:string) => void) =>{
    streamLogs(name,(log:string)=>{
        streemlog(log);
    });
}