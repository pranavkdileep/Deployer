import { Request,Response } from "express";
import { getSystemInfo,getProjects } from "../managers/system";

export const getSystemStats = async (req: Request, res: Response) => {
    const homeDto = await getSystemInfo();
    if(homeDto){
        res.status(200).json(homeDto);
    }
    else{
        res.status(500).json({message:"Internal Server Error"});
    }
}

export const getProjectshadler = async (req: Request, res: Response) => {
    const homeDto = await getProjects();
    if(homeDto){
        res.status(200).json(homeDto);
    }
    else{
        res.status(500).json({message:"Internal Server Error"});
    }
}