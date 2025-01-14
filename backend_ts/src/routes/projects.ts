import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import { buildImageHandler, getProjectslist, startContainerHandler, stopContainerHandler } from "../handlers/projects";

const router = Router();

router.get("/list",jwtMiddleware,getProjectslist);
router.post("/buildimage",jwtMiddleware,buildImageHandler);
router.post("/stopcontainer",jwtMiddleware,stopContainerHandler);
router.post("/startcontainer",jwtMiddleware,startContainerHandler);

export default router;