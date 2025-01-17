import fs from 'fs';
import { SetupSource } from '../dtos/build';
import git, { GitError } from 'simple-git';
import * as unzip from 'unzipper';

const projectFolder = '../projects';
const projects = fs.readdirSync(projectFolder);
console.log(projects);

export async function setupSourceFromGit(source: SetupSource){
    if(source.sourceType === 'git'){
        const projectPath = `${projectFolder}/${source.name}`;
        const {gitUrl,branch} = source;
        if(fs.existsSync(projectPath)){
            console.log('Project already exists so deleting it');
            fs.rmSync(projectPath,{recursive:true});
            console.log('Project deleted');
        }
        console.log('Cloning Project');
        fs.mkdirSync(projectPath);
        await git().clone(gitUrl!,projectPath,['-b',branch!],(err:GitError | null,data:string)=>{
            if(err){
                console.log('Error while cloning project');
                console.log(err.message);
                return;
            }
            console.log('Project Cloned');
            console.log(data);
        });
        
    }
    return {message:'Invalid Source Type'};
}

export async function setupSourceFromLocal(source: SetupSource){
    if(source.sourceType === 'local'){
        const projectPath = `${projectFolder}/${source.name}`;
        const {tempZipPath} = source;
        if(fs.existsSync(projectPath)){
            console.log('Project already exists so deleting it');
            fs.rmSync(projectPath,{recursive:true});
            console.log('Project deleted');
        }
        console.log('Extracting Project');
        fs.mkdirSync(projectPath);
        fs.createReadStream(tempZipPath!).pipe(unzip.Extract({path:projectPath}));
        console.log('Project Extracted');
    }
}

setupSourceFromLocal({
    name:'test',
    sourceType:'local',
    tempZipPath:'../projects/sample-flask-app-main.zip'
})