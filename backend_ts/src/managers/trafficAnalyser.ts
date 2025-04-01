import { spawn } from "child_process";
import { connection } from "../lib/db";
import { URL } from 'url';

interface UserAgentInfo {
    browser: string;
    version: string;
    os: string;
    device: string;
}

console.log("Starting traffic analyzer...");
let buffer = '';
let inArray = false;

const tsharkCmd = [
    "-i", "any",
    "-Y", "http || ssl",
    "-T", "json",
    "-e", "ip.src",
    "-e", "tcp.dstport",
    "-e", "frame.time",
    "-e", "http.user_agent",
    "-e", "http.request.full_uri"
];


const tshark = spawn("tshark", tsharkCmd);

tshark.stdout.on("data", (data) => {
    try {
        buffer += data.toString() + ']';
        processBuffer();
        //console.log(data.toString());
    } catch (error) {
        console.error("Error parsing traffic data:", error);
    }
});

tshark.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
});

tshark.on("close", (code) => {
    console.log(`Traffic analyzer stopped with code ${code}`);
});



function processBuffer(): void {
    while (true) {
        if (!inArray) {
            // Look for array start
            const arrayStart = buffer.indexOf('[');
            if (arrayStart === -1) {
                // No array start found, clear buffer
                buffer = '';
                return;
            }
            // Enter array processing mode
            buffer = buffer.slice(arrayStart + 1);
            inArray = true;
        }

        // Process objects within array
        let objStart = buffer.indexOf('{');
        let objEnd = -1;
        let stack = [];

        while (objStart !== -1) {
            stack = [];
            objEnd = -1;

            for (let i = objStart; i < buffer.length; i++) {
                const char = buffer[i];
                if (char === '{') {
                    stack.push(char);
                } else if (char === '}') {
                    stack.pop();
                    if (stack.length === 0) {
                        objEnd = i;
                        break;
                    }
                }
            }

            if (objEnd === -1) {
                // Incomplete object, keep remaining buffer
                buffer = buffer.slice(objStart);
                return;
            }

            try {
                const jsonStr = buffer.substring(objStart, objEnd + 1);
                //const obj = JSON.parse(jsonStr);
                processJson(jsonStr);

                // Remove processed object and any following whitespace/comma
                const remaining = buffer.slice(objEnd + 1).replace(/^\s*,?\s*/, '');
                buffer = remaining;
                objStart = remaining.indexOf('{');
            } catch (e) {
                // Invalid JSON, move past this object
                buffer = buffer.slice(objStart + 1);
                objStart = buffer.indexOf('{');
            }
        }

        // Check for array end
        const arrayEnd = buffer.indexOf(']');
        if (arrayEnd !== -1) {
            inArray = false;
            buffer = buffer.slice(arrayEnd + 1);
            continue;
        }

        // If we get here but still in array, preserve buffer for next chunk
        return;
    }
}

function extractUserAgentData(userAgent: string): UserAgentInfo {
    const browserRegex = /(Chrome|Firefox|Safari|Opera|Edge|MSIE|Trident)/i;
    const versionRegex = /(?:Chrome|Firefox|Safari|Opera|Edge|MSIE|Trident)\/?\s*(\d+\.\d+)/i;
    const osRegex = /(Windows NT|Mac OS X|Android|Linux|iOS|iPhone|iPad)/i;
    const deviceRegex = /(Mobile|Tablet|Desktop)/i;

    const browserMatch = userAgent.match(browserRegex);
    const versionMatch = userAgent.match(versionRegex);
    const osMatch = userAgent.match(osRegex);
    const deviceMatch = userAgent.match(deviceRegex);

    return {
        browser: browserMatch ? browserMatch[0] : "Unknown",
        version: versionMatch ? versionMatch[1] : "Unknown",
        os: osMatch ? osMatch[0] : "Unknown",
        device: deviceMatch ? deviceMatch[0] : "Desktop", // Defaulting to Desktop
    };
}

function isDomain(inputUrl: string): boolean {
    try {
        const parsedUrl = new URL(inputUrl);
        const hostname = parsedUrl.hostname;
        if (/[a-zA-Z]/.test(hostname)) {
            return true;
        }
    } catch (error) {
        console.error('Invalid URL:', error);
    }

    return false;
}

async function ipToCountry(ip: string): Promise<string> {
    const res = await fetch(`https://api.country.is/${ip}`);
    const json = await res.json();
    return json.country;
}

async function processJson(data: string): Promise<void> {
    try {
        const obj = JSON.parse(data);
        const packet = obj._source.layers;
        if (packet?.["ip.src"] &&
            packet?.["tcp.dstport"] &&
            packet?.["frame.time"] &&
            packet?.["http.user_agent"] &&
            packet?.["http.request.full_uri"]) {
            let srcIp = packet["ip.src"][0];
            let country = 'Unknown';
            const dstPort = packet["tcp.dstport"][0];
            const time = packet["frame.time"][0];
            const userAgent = packet["http.user_agent"][0];
            const uri = packet["http.request.full_uri"][0];
            const uaInfo = extractUserAgentData(userAgent);
            if (!isDomain(uri)) {
                country = await ipToCountry(srcIp);
            }
            else {
                country = 'Unknown';
                srcIp = 'Https Protected';
            }
            //console.log(`[${time}] ${srcIp} (${country} ${dstPort}) -> ${uri} (${uaInfo.browser} ${uaInfo.version} on ${uaInfo.os} ${uaInfo.device})`);
            const postData = await connection.query("SELECT hostport FROM projects");
            const ports = postData.rows.map((row: { hostport: string; }) => row.hostport);
            const domainData = await connection.query("SELECT open_domain FROM projects");
            const domains = domainData.rows.map((row: { open_domain: string; }) => row.open_domain);
            // Convert to same type before comparison
            const dstPortNum = Number(dstPort);
            if (ports.some(p => Number(p) === dstPortNum) || domains.includes(uri)) {
                console.log('Data is being inserted');
                const insertQuery = `INSERT INTO traffic (srcip, country, timesta, useragent, browser, browserversion, os, device, fullurl) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
                const values = [srcIp, country, time, userAgent, uaInfo.browser, uaInfo.version, uaInfo.os, uaInfo.device, uri];
                await connection.query(insertQuery, values);
            }

        }
    } catch (e) {
        //console.error('Error parsing JSON:', e);
    }
}
