export interface Build {
    name: string;
    dockerfile: string;
}

export interface Run {
    name: string;
    port: number;
    image: string;
}