import { Response,Request } from "express";
import { connection } from "../lib/db";
import { buildImage, getContainerSates, startContainer, stopContainer,restartContainer } from "../managers/docker";
import { Build, DeploymentMethod, SetupSource } from "../dtos/build";
import { setDeploymentmethod, setupSourceFromGit, setupSourceFromLocal } from "../managers/source";
import fs from 'fs';
import fileUpload from "express-fileupload";


export const getProjectslist = async (req:Request,res:Response) => {
    const query = `SELECT * FROM projects`;
    const rows = await connection.query(query);
    if(rows.rowCount === 0){
        res.status(404).json({message:'No projects found'});
    }else{
        res.status(200).json(rows.rows);
    }
};

export const buildImageHandler = async (req:Request<{},{},Build>,res:Response) => {
    const buildconfig = req.body;
    if(!buildconfig.name || !buildconfig.dockerfile){
        res.status(400).json({message:'Invalid Request'});
    }
    else{
        try{
            res.status(200).json({message:'Docker Build Started'});
            buildImage(buildconfig);
        }catch(err){
            res.status(500).json({message:'Error Building Docker Image'});
        }
    }
}

export const stopContainerHandler = async (req:Request<{},{},{name:string}>,res:Response) => {
    const {name} = req.body;
    if(!name){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        try{
            res.status(200).json({message:'Stopping Container Requested'});
            stopContainer(name);
        }catch(err){
            res.status(500).json({message:'Error Stopping Container'});
        }
    }
}

export const startContainerHandler = async (req:Request<{},{},{name:string}>,res:Response) => {
    const {name} = req.body;
    if(!name){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        try{
            res.status(200).json({message:'Starting Container Requested'});
            startContainer(name);
        }catch(err){
            res.status(500).json({message:'Error Starting Container'});
        }
    }
}

export const getProjectDetails = async (req:Request<{name:string},{}>,res:Response) => {
    const {name} = req.body;
    if(!name){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        const sates = await getContainerSates(name);
        res.status(200).json(sates);
    }
}

export const restartContainerHandler = async (req:Request<{},{},{name:string}>,res:Response) => {
    const {name} = req.body;
    if(!name){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        try{
            res.status(200).json({message:'Restarting Container Requested'});
            restartContainer(name);
        }catch(err){
            res.status(500).json({message:'Error Restarting Container'});
        }
    }
}

export const setupProjectSourceHandeler = async (req:Request<{},{},SetupSource>,res:Response) => {
    const source = req.body;
    if(!source.name || !source.sourceType){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        res.status(200).json({message:'Setting up Source'});
        if(source.sourceType === 'git'){
            setupSourceFromGit(source);
        }
        else if(source.sourceType === 'local'){
            setupSourceFromLocal(source);
        }
    }
}

export const uploadZipHandler = async (req:Request,res:Response) => {
    // save the zip file to ../projects
    if(!req.files || !req.files.zipfile){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        const zip = req.files.zipfile as fileUpload.UploadedFile;
        const projectPath = `../projects/${zip.name}`;
        zip.mv(projectPath,(err)=>{
            if(err){
                res.status(500).json({message:'Error Saving Zip File'});
            }
            else{
                console.log(req.body.name);
                setupSourceFromLocal({
                    name:req.body.name,
                    sourceType:'local',
                    tempZipPath:projectPath
                });
                res.status(200).json({message:'Zip File Saved'});
            }
        });
    }
}

export const setDeploymentmethodHandler = async (req:Request<{},{},DeploymentMethod>,res:Response) => {
    const config = req.body;
    if(!config.name || !config.sourcedir || !config.buildtype){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        setDeploymentmethod(config);
        res.status(200).json({message:'Deployment Method Set'});
    }
}

export const deployHandler = async (req:Request<{},{},{name:string}>,res:Response) => {
    const {name} = req.body;
    if(!name){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        const query = `SELECT * FROM projects WHERE name = '${name}'`;
        const result = await connection.query(query);
        console.log(result.rows);
        if(result.rowCount === 0){
            res.status(404).json({message:'Project Not Found'});
        }
        else{
            const project = result.rows[0];
            if(project.deploytype === 'docker'){
                const {dockerfile,port,sourcepath} = project;
                let buildconfig:Build;
                if(sourcepath === null){
                    buildconfig = {
                        name:name,
                        dockerfile:dockerfile,
                        port:port
                    }
                }else{
                    buildconfig = {
                        name:name,
                        dockerfile:dockerfile,
                        dir:sourcepath,
                        port:port
                }
                res.status(200).json({message:'Deployment Started'});
                await buildImage(buildconfig);
            }
            
        }
    }
}

}

export const createProjectHandler = async (req:Request<{},{},{name:string ,description:string}>,res:Response) => {
    try{
    const {name,description} = req.body;
    if(!name || !description){
        res.status(400).json({message:'Invalid Request!'});
    }
    else{
        const query = `INSERT INTO projects (name,description) VALUES ('${name}','${description}') RETURNING *`;
        const result = await connection.query(query);
        res.status(200).json(result.rows);
    }
}catch(err){
    res.status(500).json({message:'Error Creating Project'});
}
}