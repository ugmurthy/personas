import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {json,} from '@remix-run/cloudflare'
import _ from 'lodash'
import {useState,useEffect} from 'react'
import { useLoaderData, useLocation, useNavigate } from '@remix-run/react';

interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI:any;
}

function getURLdetails(request:Request) {
	
		const url = new URL(request.url);
		if (url.pathname !== '/favicon.ico') { 
			//const model = url.searchParams.get("model");
			const prompt= url.searchParams.get("prompt");
			//const name =url.searchParams.get("name")
			//const system = url.searchParams.get("system")
            const persona = url.searchParams.get("persona")
			return {prompt,persona}
	}
}
function getNames(pList) {
    if (pList?.list_complete) { // we have list
        const names = pList?.keys;
        return names.map((n) =>n.name)
    }
    return []
}

export const loader:LoaderFunction = async (args:LoaderFunctionArgs )=>{
    // GET from KV in futute
    const model = {model:"@hf/thebloke/llama-2-13b-chat-awq"};
    const env = args.context.cloudflare.env as Env;
    // const result = [];
    const params = getURLdetails(args.request);
    
    const personaList = await env.SYSTEM.list();
    const personas = getNames(personaList);
    const persona = params?.persona;
    //console.log("Typeof personas ",typeof personas, personas)
    //console.log("Typeof params ",typeof persona, persona)
    let system=[]
    if ( personas.includes(persona)) {
         system = JSON.parse(await env.SYSTEM.get(params?.persona))
    } else {
        console.log(`persona ${persona} missing`)
        system = []
    }
    
    
    const memory = JSON.parse(await env.CONVERSATION.get("memory"));
    const user = [{role:"user",content:params?.prompt}]
    const messages = [...system,...memory,...user]
    console.log("generate Loader ",JSON.stringify({messages,model,persona, prompt:params?.prompt},null,2));
    //return  json({messages,model,system,memory,personas});
    return  json({messages,model,persona, prompt:params?.prompt});
}


export default function MyComponent() {
    const [data, setData] = useState([]);
    const [stopped,setStopped]=useState(false)
    const {messages,model,persona, prompt} = useLoaderData(); // (2) - client data
    const url = "https://main.cldflr-remix-app.pages.dev/coach"

    //helper funcs
    // 8th April
    const controller = new AbortController();
    const signal = controller.signal;

    function abort() {
        controller.abort();
        console.log("Stopped Manually")
    }

    async function chat(url,messages,model,persona) {
        const options = {method:"GET",mode:"no-cors",signal:signal}
        const response = await fetch(url,options)
        return response;
    }


    function handleAbort() {
      setStopped(true);
      abort();
    }

    useEffect(() => {
      const fetchData = async () => {
        console.log("Client useEffect ",url)
        if (prompt==='') return;
        //const response = await fetch(url, {method:"GET",mode:'no-cors'})
        const response = await chat(url,messages,model,persona)
        if (response===null || response?.body===null) {console.log("Null response"); return;}
        const reader = response.body.getReader();
        const readChunk = async () => {
          const { done, value } = await reader.read();
          if (done || stopped ) {
            return; 
          }
          const chunk = new TextDecoder().decode(value);
          const start= _.indexOf(chunk,"{")
          const end = _.lastIndexOf(chunk,"}");
          const chunk_json = JSON.parse(chunk.substring(start,end+1))
    
          setData(prevData => [...prevData, chunk_json]);
          readChunk(); // Call itself recursively to read the next chunk
        };
  
        readChunk();
      };
  
      fetchData();
    }, []);
    // NOTE: to self
    //establish done from data
    //console.log(isInferencing,isEvaluating)
    function contentFromChunks(data) {
        let result='';
        for (const chunk of data) {
            result = result + chunk.response
        }
        return result
        }
    const result = contentFromChunks(data)


    return (
      <div> <button className="btn btn-neutral" onClick={handleAbort}> Stop </button>
        <pre>
            {data.length} : {result}
        </pre>
        </div>
        )

  }
  
   