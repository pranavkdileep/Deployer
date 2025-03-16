
import { useEffect, useRef, useState } from "react"
import { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import { FitAddon } from "xterm-addon-fit"
import { getTerminalWs } from "@/utils/generateLog";


const term = new Terminal();
const fitAddon = new FitAddon();


function TerminalCard({name}: {name: string}) {
    const terminalref = useRef<HTMLDivElement>(null)
    const [ws,setWs] = useState<WebSocket | null>(null)

    useEffect(() => {
      (async () => {
        const newWs = await getTerminalWs(name);
        setWs(newWs);
      })();
    }, [name]);

    useEffect(() => {
      if (!ws) return;
      ws.onopen = () => term.write(`Connected to ${name} terminal!\r\n`);
      ws.onmessage = (data) => {
        const d = JSON.parse(data.data);
        if (d.type === "terminal-output") {
          term.write(d.data);
        }
      }
      term.onKey(e => {
        const data = JSON.stringify({type: "terminal-input", data: e.key});
        ws.send(data);
      });
      return () => ws.close();
    }, [ws, name]);

    useEffect(() => {
      term.loadAddon(fitAddon);
      term.open(terminalref.current!);
      fitAddon.fit();

      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [])
    
  return (
    <>
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Terminal</h1>
      <div
        ref={terminalref}
        
      >
      </div>
    </div>
    </>
  )
}

export default TerminalCard