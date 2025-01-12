import { Response,Request } from "express";
import { connection } from "../lib/db";

export const getProjectslist = async (req:Request,res:Response) => {
    const query = `SELECT * FROM projects`;
    const rows = await connection.query(query);
    if(rows.rowCount === 0){
        res.status(404).json({message:'No projects found'});
    }else{
        res.status(200).json(rows.rows);
    }
};