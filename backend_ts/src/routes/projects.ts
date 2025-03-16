import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import {createProjectHandler, buildImageHandler,restartContainerHandler, getProjectDetails, getProjectslist, startContainerHandler, stopContainerHandler, setupProjectSourceHandeler, uploadZipHandler, setDeploymentmethodHandler, deployHandler, getDeployments, logStreem, setEnvFileHandler, getEnvFileHandler, streamBuildoutHandler, deleteContainerHandler, getDomainHandler, DomainSetupHandler, getCanddyOutHandler } from "../handlers/projects";
import { RawData, WebSocket, WebSocketServer } from "ws";
import { parse } from "url";




const router = Router();

router.get("/list",jwtMiddleware,getProjectslist);
router.post("/buildimage",jwtMiddleware,buildImageHandler);
router.post("/stopcontainer",jwtMiddleware,stopContainerHandler);
router.post("/deletecontainer",jwtMiddleware,deleteContainerHandler);
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
router.post("/getDomain",jwtMiddleware,getDomainHandler);
router.post("/setupDomain",jwtMiddleware,DomainSetupHandler);
router.get("/getCandyOut",jwtMiddleware,getCanddyOutHandler);

export const logWebsoket = (server: WebSocketServer) => {
  server.on('connection', (ws: WebSocket, req) => {
    const { pathname } = new URL(req.url || '', 'http://' + req.headers.host);
    if (pathname !== '/logs') return; // Only handle log connections

    const projectName = parse(req.url!, true).query.projectName;
    console.log('connected to:', projectName);

    ws.on('message', (message: any) => {
      console.log('received:', message);
    });

    logStreem(projectName as string, (data: string) => {
      ws.send(data);
    });
  });

  server.on('error', (err) => {
    console.log(err);
  });
};


export default router;