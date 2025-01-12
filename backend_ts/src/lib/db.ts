import {Pool} from 'pg';

const connectionConfig = {
    user: process.env.PGSQL_USER,
    password: process.env.PGSQL_PASSWORD,
    host: process.env.PGSQL_HOST,
    port: parseInt(process.env.PGSQL_PORT!, 10),
    database: process.env.PGSQL_DATABASE,
    pool_mode: process.env.PGSQL_POOL_MODE,
};

export const connection = new Pool(connectionConfig);

connection.connect((err:any) => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log('Connected to the database');
    }
});
