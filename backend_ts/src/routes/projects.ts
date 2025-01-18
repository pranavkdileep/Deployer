import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import {createProjectHandler, buildImageHandler,restartContainerHandler, getProjectDetails, getProjectslist, startContainerHandler, stopContainerHandler, setupProjectSourceHandeler, uploadZipHandler, setDeploymentmethodHandler, deployHandler } from "../handlers/projects";

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

export default router;