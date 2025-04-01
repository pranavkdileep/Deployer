import { spawn } from "child_process";

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

function processJson(data: string): void {
    try {
        const obj = JSON.parse(data);
        const packet = obj._source.layers;
        if (packet?.["ip.src"] &&
            packet?.["tcp.dstport"] &&
            packet?.["frame.time"] &&
            packet?.["http.user_agent"] &&
            packet?.["http.request.full_uri"]) {
            console.log(`Source IP: ${packet["ip.src"][0]}`);
            console.log(`Destination Port: ${packet["tcp.dstport"][0]}`);
            console.log(`Timestamp: ${packet["frame.time"][0]}`);  // Added [0] to match array format
            console.log(`User Agent: ${packet["http.user_agent"][0]}`);  // Added [0] to match array format
            console.log(`Full URI: ${packet["http.request.full_uri"][0]}`);  // Added [0] to match array format
            console.log('-----------------------------------');
        }

    } catch (e) {
        //console.error('Error parsing JSON:', e);
    }
}