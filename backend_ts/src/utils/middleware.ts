import { RequestHandler } from "express";
import { expressjwt } from "express-jwt";
import jwt from 'jsonwebtoken';
import { parse } from "url";


export const jwtMiddleware: RequestHandler = expressjwt({secret: process.env.JWT_SECRET || "SECRET",algorithms: ["HS256"]});

export const verifyClient = (info: any, callback: (res: boolean, code?: number, message?: string) => void) => {
    const token = parse(info.req.url!,true).query.token as string;
    const projectName = parse(info.req.url!,true).query.projectName as string;
    if (!token) return callback(false, 401, 'Authentication required');
    if (!projectName) return callback(false, 403, 'Project name required');
  
    jwt.verify(token,process.env.JWT_SECRET || "secret",{algorithms: ["HS256"]}, (err: any, decoded: any) => {
      if (err) return callback(false, 403, 'Invalid token');
      (info.req as any).user = decoded;
      callback(true);
    });
  };