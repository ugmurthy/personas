import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {json,} from '@remix-run/cloudflare'
import _ from 'lodash'
import {useState,useEffect, useRef} from 'react'
import { Link, useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { getMemory, getPersonas } from "~/module/utils.server";
import { z,ZodError} from "zod";
//import {zx} from 'zodix';
import Chat from '../components/Chat'
import Prompt from "~/components/Prompt";
import Audio from "~/components/Audio"
interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI:any;
}

const Routeschema = z.object({
  persona: z.string().trim().min(3),
  prompt: z.string().trim().nullable().optional(),
  remember: z.string().nullable().optional(),
});

function errorAtPath(error: ZodError, path: string) {
  return error.issues.find((issue) => issue.path[0] === path)?.message;
}

 function getURLdetails(request:Request) {
	
		const url = new URL(request.url);
		if (url.pathname !== '/favicon.ico') { 
      const persona = url.searchParams.get("persona");
			const prompt= url.searchParams.get("prompt");
			const remember =url.searchParams.get("remember")
			return {prompt,persona,remember}
	}
} 

export const loader:LoaderFunction = async (args:LoaderFunctionArgs )=>{
    const {prompt,persona,remember} = getURLdetails(args.request);
    console.log("/chat LOADER raw params ",JSON.stringify({prompt,persona,remember},null,2));
    const whichModel = {
      coding:"@hf/thebloke/codellama-7b-instruct-awq",
      translate:"@cf/thebloke/discolm-german-7b-v1-awq",
      other:"@hf/mistral/mistral-7b-instruct-v0.2"
    }
    const env = args.context.cloudflare.env as Env; 
    const result = Routeschema.safeParse({prompt,persona,remember});
    const personas = await getPersonas(env);
    console.log("/CHAT LOADER validation result ",JSON.stringify(result,null,2));
    if(!result.success) {
      throw new Error(JSON.stringify({success:false,
        personaError: errorAtPath(result.error, "persona"),
        promptError: errorAtPath(result.error, "prompt"),
        rememberError: errorAtPath(result.error,"remember")
        },null,2))
    }
    //check if persona is one of listed personas
     if (!(personas.includes(persona))) {
      throw new Error (JSON.stringify({success:false,errorPersona:`Persona: ${persona} unavaialable`},null,2))
       
     }

    // all validations passed
    // Set MODEL based on persona
    let model =""
    if (persona?.toLowerCase().includes('coding')) {
      model = whichModel.coding;
    } else if (persona?.toLowerCase().includes('german')) {
      model = whichModel.translate;
    } else {
      model = whichModel.other
    }
    if (model==="")
      return json({success:false,modelError:"No model identified"})
    // Set MEMORY if needed // will be implemented in future
    let memory=[]
    if (remember?.includes("on"))
         memory = await getMemory(env);    

    return  json({success:true, model,persona, prompt,remember, memory, personas});
}


export default function MyComponent() {
  
  const ret_val = useLoaderData(); 

    /* CODE for testing only
    // if (ret_val.success) {
    //   return <pre>{JSON.stringify(ret_val,null,2)}</pre>
    // }
    // else {
    //   throw new Error(JSON.stringify(ret_val))
    // }
    // CODE for testing ends here
    */
    
    const {success,model,persona,prompt,remember,memory,personas} = ret_val;
    // success will be used in useEffect to return before fetching
    const [data, setData] = useState([]);
    const [done, setDone] = useState(false);
    //const [stopped,setStopped]=useState(false)
    const navigate = useNavigate();
    const responseRef = useRef(null);
    const isInferencing = !done && data.length;
    const isEvaluating  = !done && data.length === 0;
    //const url = "https://main.cldflr-remix-app.pages.dev/coach"
    const personaURL = "https://main.cldflr-remix-app.pages.dev/persona"


    //helper funcs
    // 8th April
    const controller = new AbortController();
    const signal = controller.signal;

    function abort() {
        controller.abort();
        console.log("Stopped Manually")
    }
    async function whisper(url,imgBlob) {
      const formData = new FormData();
      formData.append("imgBlob",imgBlob);
      const options = {method:"POST",body:formData,mode:"no-cors"}
      const response = await fetch(url,options);
      return response
    }
    async function personaChat(url,model,persona,prompt) {
      // a POST Request to /persona with parameter model,persona,prompt
      const formData = new FormData();
      formData.append("model",model);
      formData.append("persona",persona);
      formData.append("prompt",prompt);
      const options = {method:"POST",body:formData,mode:"no-cors"}
      const response = await fetch(url,options);
      return response;
    }
    // hook helper
    function chunks2Array(chunk) {
      function getStr(c) {
        if (c!=="") return JSON.parse(c);
       }
      // return an array of json objects
      // check if chunk has json objects, remove non-json objects from string
      const retval = chunk.split('\n').map((c)=>c.substring(_.indexOf(c,"{"),_.lastIndexOf(c,"}")+1))
      //console.log(retval)
      if (retval[retval.length-1]==="") {
        retval.pop();
      }
      const objArray = retval.map(getStr)
      //console.log("Chunks2Array: ",objArray);
      return _.compact(objArray)
    }
    // hook to capture stream
    useEffect(() => {
      const fetchData = async () => {
        console.log("Client useEffect ",personaURL)
        console.log("Client useEffect success ",success)
        console.log("Client useEffect prompt len is ",prompt.length)
        if (!success || prompt==="") return;
        setDone(false);
        
        const response = await personaChat(personaURL,model,persona,prompt)
        if (response===null || response?.body===null) {console.log("Null response"); return;}
        const reader = response.body.getReader();
        const readChunk = async () => {
          const { done, value } = await reader.read();
          if (done || stopped ) {
            setDone(true);
            return; 
          }
          const chunk = new TextDecoder().decode(value);
          // old code being replaced
          // const start= _.indexOf(chunk,"{")
          // const end = _.lastIndexOf(chunk,"}")
          // let chunk_json={}
          // //console.log("Chunk : ",start,end,chunk)

          // try {
          // chunk_json = JSON.parse(chunk.substring(start,end+1))
          // } catch(e) {
          //   console.log("useEffect : JSON Parse Error",start,end,chunk)
          // }
          const chunk_json = chunks2Array(chunk); // return array of json objects
          setData(prevData => [...prevData, ...chunk_json]);
          readChunk(); // Call itself recursively to read the next chunk
        };
  
        readChunk();
      };
  
      fetchData();
    }, []);
    
    function handleTranslate() {
      navigate("/chat"+germanURL);
      console.log("Navigating to ",germanURL)
    }
    function contentFromChunks(data) {
        let result='';
        for (const chunk of data) {
            result = result + chunk.response
        }
        return result
        }
    const result = contentFromChunks(data)
    // in dev mode
    //const result = "```python\nimport random\ndef generate_string(length):  \nreturn ''.join([random.choice('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(length)])  # you can also use random characters from a string of your preference here\n```"
    let germanURL="";
    if (done && persona.includes("Story")) {
      // translate option
      germanURL = `?persona=German&prompt=${result}`
    }

    return (
      <div className='container pt-32 mx-auto max-w-6xl px-4'>
              <div className="collapse bg-base-200">
                <input type="radio" name="my-accordion-1" /> 
                <div className="collapse-title text-xl font-medium">
                <span className="underline text-sm text-blue-700">Show Params</span>
                </div>
                <div className="collapse-content"> 
                <pre>{JSON.stringify(ret_val,null,2)}</pre>
                <span className="text-red-800">Close <input type="radio" name="my-accordion-1" /> </span>
                </div>
              </div>
         {prompt !== null ? <Chat className="bg-blue-100 text-sm rounded-t-lg scroll-smooth"
                promptClass="text-2xl font-normal"
                pendingStatus={isEvaluating}
                progress_type={'progress-primary'}
                me={true}
                tooltip={"You"}
                ref={null}
        >
          {prompt}
        </Chat>:""}
        {result!==""?<Chat className="bg-gray-50 text-sm rounded-t-lg scroll-smooth"
                promptClass="text-2xl font-normal"
                pendingStatus={isInferencing}
                progress_type={'progress-success'}
                me={false}
                tooltip={persona||""}
                ref={responseRef}
        >
          {result}
        </Chat>:""}
        {done && germanURL!==''?<form method="GET" >
          <input name="prompt" type="hidden" value={result}></input>
          <input name="persona" type="hidden" value="German"></input>
          <button className="btn btn-xs btn-neutral" type="submit">Translate to German?</button>
        </form>:""}
        {done && persona.toLowerCase().includes("german")?<form method="GET" >
          
          <input name="persona" type="hidden" value="StoryWriter"></input>
          <button className="btn btn-xs btn-outline" type="submit">Back to English?</button>
        </form>:""}
        <div className="pb-32"></div>
        <Prompt persona={persona}></Prompt>
        <Audio/>
        </div>
        )

  }
  
   