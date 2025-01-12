import { Router } from "express";
import { login } from "../handlers/auth";
import { testjwt } from "../handlers/auth";
import { jwtMiddleware } from "../utils/middleware";

const router = Router();

router.post("/login",login);
router.get("/testjwt",jwtMiddleware,testjwt);

export default router;