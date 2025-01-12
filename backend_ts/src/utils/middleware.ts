import { RequestHandler } from "express";
import { expressjwt } from "express-jwt";

export const jwtMiddleware: RequestHandler = expressjwt({secret: process.env.JWT_SECRET || "SECRET",algorithms: ["HS256"]});
