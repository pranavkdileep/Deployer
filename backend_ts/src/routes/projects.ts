import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import {createProjectHandler, buildImageHandler,restartContainerHandler, getProjectDetails, getProjectslist, startContainerHandler, stopContainerHandler, setupProjectSourceHandeler, uploadZipHandler, setDeploymentmethodHandler, deployHandler, getDeployments, logStreem, setEnvFileHandler, getEnvFileHandler, streamBuildoutHandler } from "../handlers/projects";
import { RawData, Server } from "ws";
import { parse } from "url";




const router = Router();

router.get("/list",jwtMiddleware,getProjectslist);
router.post("/buildimage",jwtMiddleware,buildImageHandler);
router.post("/stopcontainer",jwtMiddleware,stopContainerHandler);
router.post("/startcontainer",jwtMiddleware,startContainerHandler);
router.post("/restartcontainer",jwtMiddleware,restartContainerHandler);
router.post("/getcontainerstates",jwtMiddleware,getProjectDetails);
router.post("/setupProjectSource",jwtMiddleware,setupProjectSourceHandeler);
router.post("/uploadZip",jwtMiddleware,uploadZipHandler);
router.post("/getProjectDetails",jwtMiddleware,getProjectDetails);
router.post("/setdeploymentmethod",jwtMiddleware,setDeploymentmethodHandler);
router.post("/deploy",jwtMiddleware,deployHandler);
router.post("/craeteProject",jwtMiddleware,createProjectHandler);
router.post("/getDeployments",jwtMiddleware,getDeployments);
router.post("/setenv",jwtMiddleware,setEnvFileHandler);
router.post("/getenv",jwtMiddleware,getEnvFileHandler);
router.post("/steambuildout",jwtMiddleware,streamBuildoutHandler);

export const logWebsoket =  (wss : Server) => {
    wss.on('connection', function connection(ws,req) {
      const projectName = parse(req.url!,true).query.projectName;
      console.log('connected to: %s', projectName);
        ws.on('message', function incoming(message) {
          console.log('received: %s', message);
        });

        logStreem(projectName as string, (data: string) => {
            ws.send(data);
        });
        
      });
    wss.on('error',function(err){
        console.log(err);
    });
}


export default router;