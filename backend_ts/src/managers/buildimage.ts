import { Build } from '../dtos/build';
import fs from 'fs';
const { spawnSync } = require('child_process');
import { connection } from "../lib/db";


export async function buildImage(buildconfig:Build){
    const {name,dockerfile} = buildconfig;
    const path = `../projects/${name}/`;
    //build the image in the path
    const buildouttxt = fs.openSync(`${path}buildout.txt`, 'w');
    const dockerfilePath = path + dockerfile;
    const dockerBuild = `docker build -t ${name} -f ${dockerfilePath} ${path}`;
    const build = spawnSync(dockerBuild, {shell: true, stdio: [buildouttxt, buildouttxt, buildouttxt]});
        if(build.status === 0){
            console.log('Docker Image Built Successfully');
            //update build status in db projects table and print the rows
            const query = `UPDATE projects SET buildstatus = 'success' WHERE name = '${name}' RETURNING *`;
            const resuilt = await connection.query(query);
            console.log(resuilt.rows);
        }
        else{   
            console.log('Error Building Docker Image');
            const query = `UPDATE projects SET buildstatus = 'failed' WHERE name = '${name}' RETURNING *`;
            const resuilt = await connection.query(query);
            console.log(resuilt.rows);
        }
}