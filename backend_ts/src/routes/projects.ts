import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import { buildImageHandler, getProjectDetails, getProjectslist, startContainerHandler, stopContainerHandler } from "../handlers/projects";

const router = Router();

router.get("/list",jwtMiddleware,getProjectslist);
router.post("/buildimage",jwtMiddleware,buildImageHandler);
router.post("/stopcontainer",jwtMiddleware,stopContainerHandler);
router.post("/startcontainer",jwtMiddleware,startContainerHandler);
router.post("/getcontainerstates",jwtMiddleware,getProjectDetails);

export default router;