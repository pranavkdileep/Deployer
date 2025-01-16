export interface HomeDto {
    cpu: string;
    ram:{
        total:string;
        used:string;
        percent:string;
    }
    disk:{
        used:string;
        total:string;
        percent:string;
    }
    network:{
        received:string;
        transmitted:string;
    }
}

export interface ProjectsDto {
    projects: {
        id: number;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        status: string;
        cpu: string;
        ram: string;
        networkio:string
        open_ports: string[];
        open_domains:string;
    }[]
}