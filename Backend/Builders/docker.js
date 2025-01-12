const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');


const example_config = {
    "project_name": "example",
    "dockerfile": "Dockerfile",
    //"dockerignore": ".dockerignore",
    "path": "sample_app/",

}

const builder = (config) =>{
    console.log('Building Docker Image...');
    return new Promise((resolve, reject) => {
        if(!config){
            config = example_config;
        }
        
        const { project_name, dockerfile, path } = config;
        const buildouttxt = fs.openSync(`${path}/buildout.txt`, 'w');
        const dockerfilePath = path + dockerfile;
        const dockerignorePath = path + '.dockerignore';
        const dockerignore = fs.existsSync(dockerignorePath) ? dockerignorePath : null;
        const dockerBuild = `docker build -t ${project_name} -f ${dockerfilePath} ${path}`;
        const build = spawnSync(dockerBuild, {shell: true, stdio: [buildouttxt, buildouttxt, buildouttxt]});
        if(build.status === 0){
            console.log('Docker Image Built Successfully');
            resolve(fs.readFileSync(`${path}/buildout.txt`, 'utf8'));
        }
        else{   
            console.log('Error Building Docker Image');
            reject();
        }

    });
}

builder(example_config);