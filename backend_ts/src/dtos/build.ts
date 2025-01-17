export interface Build {
    name: string;
    dockerfile: string;
    dir?:string;
    port: number;
}

export interface SetupSource {
    name: string;
    sourceType: 'git' | 'local';
    gitUrl?: string;
    branch?: string;
    tempZipPath?: string;
}