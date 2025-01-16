import { Router } from "express";
import { getSystemStats,getProjectshadler } from "../handlers/system";

const router = Router();

router.get('/systemstats',getSystemStats);
router.get('/projects',getProjectshadler);

export default router;