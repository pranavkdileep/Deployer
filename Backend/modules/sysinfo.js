const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

// Function to get CPU usage
function getCpuUsage() {
  return new Promise((resolve) => {
    exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (error, stdout) => {
      if (error) resolve(0);
      resolve(parseFloat(stdout.trim()).toFixed(2));
    });
  });
}

// Function to get RAM usage
function getRamUsage() {
  const totalRam = os.totalmem() / (1024 * 1024);
  const freeRam = os.freemem() / (1024 * 1024);
  const usedRam = totalRam - freeRam;
  const percentUsed = ((usedRam / totalRam) * 100).toFixed(2);

  return {
    total: `${totalRam.toFixed(2)} MB`,
    used: `${usedRam.toFixed(2)} MB`,
    percent: `${percentUsed}%`
  };
}

// Function to get Disk usage
function getDiskUsage() {
  return new Promise((resolve) => {
    exec("df -h / | awk '$NF==\"/\"{printf \"%d,%d,%s\", $3, $2, $5}'", (error, stdout) => {
      if (error) resolve({ used: '0 GB', total: '0 GB', percent: '0%' });
      const [used, total, percent] = stdout.trim().split(',');
      resolve({
        used: `${used} GB`,
        total: `${total} GB`,
        percent: percent
      });
    });
  });
}

// Function to get Network usage
function getNetworkUsage() {
  const interfaces = os.networkInterfaces();
  //console.log(interfaces);
  let rxBytes = 0;
  let txBytes = 0;

  for (const iface of Object.keys(interfaces)) {
    if(interfaces[iface][0].internal === false) {
        rxBytes += parseInt(fs.readFileSync(`/sys/class/net/${iface}/statistics/rx_bytes`, 'utf8')) || 0;
        txBytes += parseInt(fs.readFileSync(`/sys/class/net/${iface}/statistics/tx_bytes`, 'utf8')) || 0;
    }
  }

  return {
    received: `${(rxBytes / (1024 * 1024)).toFixed(2)} MB`,
    transmitted: `${(txBytes / (1024 * 1024)).toFixed(2)} MB`
  };
}

// Main function to gather all data
async function getSystemUsage() {
  const cpuUsage = await getCpuUsage();
  const ramUsage = getRamUsage();
  const diskUsage = await getDiskUsage();
  const networkUsage = getNetworkUsage();

  const systemUsage = {
    cpu: { usage_percent: `${cpuUsage}%` },
    ram: ramUsage,
    disk: diskUsage,
    network: networkUsage
  };

  console.log(JSON.stringify(systemUsage, null, 2));
}

// Run the main function
getSystemUsage();
