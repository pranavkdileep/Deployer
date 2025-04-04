import fs from 'fs';
import { DeploymentMethod, envfilejson, SetupSource } from '../dtos/build';
import git, { GitError } from 'simple-git';
import * as unzip from 'unzipper';
import { connection } from '../lib/db';

const projectFolder = '../projects';
const projects = fs.readdirSync(projectFolder);

export async function setupSourceFromGit(source: SetupSource) {
    if (source.sourceType === 'git') {
        const projectPath = `${projectFolder}/${source.name}`;
        const { gitUrl, branch } = source;
        if (fs.existsSync(projectPath)) {
            console.log('Project already exists so deleting it');
            fs.rmSync(projectPath, { recursive: true });
            console.log('Project deleted');
        }
        console.log('Cloning Project');
        fs.mkdirSync(projectPath);
        await git().clone(gitUrl!, projectPath, ['-b', branch!], async (err: GitError | null, data: string) => {
            if (err) {
                console.log('Error while cloning project');
                console.log(err.message);
                return;
            }
            console.log('Project Cloned');
            console.log(data);
            console.log((await connection.query(`UPDATE projects SET sourceStatus = 'TRUE' WHERE name = '${source.name}' RETURNING *`)).rows);
        });

    }
    return { message: 'Invalid Source Type' };
}

export async function setupSourceFromLocal(source: SetupSource) {
    if (source.sourceType === 'local') {
        const projectPath = `${projectFolder}/${source.name}`;
        const { tempZipPath } = source;
        if (fs.existsSync(projectPath)) {
            console.log('Project already exists so deleting it');
            fs.rmSync(projectPath, { recursive: true });
            console.log('Project deleted');
        }
        console.log('Extracting Project');
        fs.mkdirSync(projectPath);
        fs.createReadStream(tempZipPath!).pipe(unzip.Extract({ path: projectPath }));
        console.log('Project Extracted');
        console.log((await connection.query(`UPDATE projects SET sourceStatus = 'TRUE' WHERE name = '${source.name}' RETURNING *`)).rows);

    }
}

export async function setDeploymentmethod(config: DeploymentMethod) {
    const { name, sourcedir, buildtype } = config;
    if (buildtype === 'docker') {
        const { dockerFile, port } = config;
        const query = `UPDATE projects SET deployType = 'docker', dockerfile = '${dockerFile}', port = ${port},sourcePath = '${sourcedir}' WHERE name = '${name}' RETURNING *`;
        console.log(query);
        const result = await connection.query(query);
        console.log(result.rows);
    }else if (buildtype === 'nix'){
        const {port,pkgs,apts,install_cmd,build_cmd,start_cmd} = config;
        const query = `UPDATE projects SET deployType = 'nix', pkgs='${pkgs}', apts='${apts}', install_cmd='${install_cmd}', build_cmd='${build_cmd}',start_cmd='${start_cmd}', sourcePath = '${sourcedir}', port=${port} WHERE name = '${name}' RETURNING *`;
        console.log(query);
        const result = await connection.query(query);
        console.log(result.rows);
    }
}

export async function setEnvFile(name: string, envobj: envfilejson): Promise<boolean> {
    try {
        const projectPath = `${projectFolder}/${name}`;
        if (fs.existsSync(`${projectPath}/envfile.json`)) {
            fs.rmSync(`${projectPath}/envfile.json`);
        }
        fs.writeFileSync(`${projectPath}/envfile.json`, JSON.stringify(envobj));
        console.log('Env File Updated');
        return true;
    }catch(err){
        console.log('Error Updating Env File',err);
        return false;
    }
}

export const deleteProject = async (name: string) => {
    const projectPath = `${projectFolder}/${name}`;
    if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true });
    }
}