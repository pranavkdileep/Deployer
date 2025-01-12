import { Request,Response } from "express-serve-static-core";
import { LoginDTO, LogingResponseDTO } from "../dtos/login";
import jwt from 'jsonwebtoken';
import { expressjwt, Request as JWTRequest } from "express-jwt";
import dotenv from 'dotenv';
dotenv.config();

const gemail = process.env.EMAIL;
const gpassword = process.env.PASSWORD;

export async function login(req: Request<{},{},LoginDTO>, res: Response<LogingResponseDTO>){
    const {email,password} = req.body;
    if(email === gemail && password === gpassword){
        const token = jwt.sign(
            {
                email: email
            },
            process.env.JWT_SECRET || "secret",
            {
                algorithm: "HS256",
                expiresIn: "1h"
            }
        );
        res.status(200).json({
            success: true,
            message: "Login Successful",
            token:token,
            timestamp: Date.now()
        });
    }else{
        res.status(401).json({
            success: false,
            message: "Login Failed",
            token:"",
            timestamp: Date.now()
        });
    }
}

export async function testjwt(req: JWTRequest, res: Response){
    res.status(200).json({
        success: true,
        message: "JWT is valid"
    });
}
