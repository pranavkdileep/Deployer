import { Router } from "express";
import { jwtMiddleware } from "../utils/middleware";
import { getProjectslist } from "../handlers/projects";

const router = Router();

router.get("/list",jwtMiddleware,getProjectslist);

export default router;