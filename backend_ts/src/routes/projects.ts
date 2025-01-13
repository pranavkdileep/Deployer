import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import { buildImageHandler, getProjectslist } from "../handlers/projects";

const router = Router();

router.get("/list",jwtMiddleware,getProjectslist);
router.post("/buildimage",jwtMiddleware,buildImageHandler);

export default router;