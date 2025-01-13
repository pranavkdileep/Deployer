import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import { buildImageHandler, getProjectslist, stopContainerHandler } from "../handlers/projects";

const router = Router();

router.get("/list",jwtMiddleware,getProjectslist);
router.post("/buildimage",jwtMiddleware,buildImageHandler);
router.post("/stopcontainer",jwtMiddleware,stopContainerHandler);

export default router;