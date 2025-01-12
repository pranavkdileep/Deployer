const { exec, spawn } = require('child_process');

const containerinfo = {
    "name": "example",
    "tag": "latest",
    "port": "8000",
}
const runContainer = (containerinfo) => {
    return new Promise((resolve, reject) => {
        exec(`docker run --restart always -d -p ${containerinfo.port}:8000/tcp ${containerinfo.name}:${containerinfo.tag}`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            const containerId = stdout.replace('\n', '');
            console.log(`Container ${containerinfo.name} is running with id ${containerId}`);
            resolve(containerId);
        });
    });
};


const getLogs = (containerId) => {
    const logs = spawn(`docker logs ${containerId}`, {shell: true});
    logs.stdout.on('data', (data) => {
        //console.log(data.toString());
        return data.toString();
    });
    logs.stderr.on('data', (data) => {
        console.error(data.toString());
    });
    logs.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
    });
};

const stopContainer = (containerId) => {
    exec(`docker stop ${containerId}`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
        }
        console.log(`Container ${containerId} stopped`);
    });
};

const removeContainer = (containerId) => {
    exec(`docker rm -f ${containerId}`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
        }
        console.log(`Container ${containerId} removed`);
    });
};

const restartContainer = (containerId) => {
    exec(`docker restart ${containerId}`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
        }
        console.log(`Container ${containerId} restarted`);
    });
};



async function main() {
    const containerId = await runContainer(containerinfo);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const logs = getLogs(containerId);
    console.log(logs);
    console.log('wait 30 secount to restart container');
    await new Promise((resolve) => setTimeout(resolve, 30000));
    console.log('restart container');
    restartContainer(containerId);
    // console.log('wait 30 secount to stop container');
    // await new Promise((resolve) => setTimeout(resolve, 30000));
    // console.log('stop container');
    // stopContainer(containerId);
    // console.log('wait 30 secount to resart container');
    // await new Promise((resolve) => setTimeout(resolve, 30000));
    // console.log('restart container');
    // restartContainer(containerId);
    // getLogs(containerId);
    console.log('wait 30 secount to remove container');
    await new Promise((resolve) => setTimeout(resolve, 30000));
    console.log('remove container');
    removeContainer(containerId);


}

main();