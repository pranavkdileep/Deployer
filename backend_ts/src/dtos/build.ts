export interface envfilejson {
    id: number,
    key: string,
    value: string,
}

export interface Build {
    name: string;
    dockerfile?: string;
    dir?:string;
    port: number;
    buildtype: 'docker' | 'nix'; 
    pkgs?: string;
    apts?: string;
    install_cmd?: string; 
    build_cmd?: string; 
    start_cmd?: string; 

}

export interface SetupSource {
    name: string;
    sourceType: 'git' | 'local';
    gitUrl?: string;
    branch?: string;
    tempZipPath?: string;
}

export interface DeploymentMethod {
    name: string;
    sourcedir?: string;
    buildtype: 'docker' | 'nix';
    dockerFile?: string;
    port?: number;
    pkgs?: string[];
    apts?: string[];
    install_cmd?: string;
    build_cmd?: string;
    start_cmd?: string;
}
