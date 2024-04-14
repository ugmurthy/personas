import type { ActionFunctionArgs, ActionFunction, LoaderFunction,LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useActionData } from "@remix-run/react";
import {json,} from '@remix-run/cloudflare'
import { getSystemPrompt, getMemory, getPersonas, getPersonasPrompt } from "~/module/utils.server";
import {z,ZodError} from 'zod'
import {zx} from 'zodix'
import {Ai} from '@cloudflare/ai'
import _ from 'lodash'
import { parseReasoning } from "~/module/utils.server";
interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI: unknown;
}
const PersonaRouteSchema = z.object({
    persona: z.string().trim().min(3),
    prompt: z.string().trim().optional(),
    model: z.string().trim().min(2),
    max_tokens:z.string().trim().optional()
  });

  
// Check if there is an error for a specific path.
function errorAtPath(error: ZodError, path: string) {
    return error.issues.find((issue) => issue.path[0] === path)?.message;
  }



export const action:ActionFunction = async (args:ActionFunctionArgs) =>{
    const result = await zx.parseFormSafe(args.request, PersonaRouteSchema);
    const env = args.context.cloudflare.env as Env
    console.log("/persona form params ",JSON.stringify(result,null,2));
    
    if (!result.success) { // we have  problem
        return json({
            success: false,
            personaError: errorAtPath(result.error, "persona"),
            promptError: errorAtPath(result.error, "prompt"),
            modelError: errorAtPath(result.error,"model"),
            max_tokensError:errorAtPath(result.error,"max_tokens")
          });
    }
    // All good
    const {model,prompt,persona,max_tokens } = result.data;
    console.log("After validation of params")
    console.log(`model '${model}' persona : '${persona}' prompt: '${prompt}'`)
    console.log("max_tokens",max_tokens)
    // get list of personas
    const personas = await getPersonas(env); // gets an array of persona names
    //check if persona is one of listed personas
    if (!(personas).includes(persona)) {
        return json({success:false,errorPersona:`Persona: ${persona} unavaialable`})
    }
    // all good
    const persona_data = await getSystemPrompt(env,persona)
    const memory = await getMemory(env)

    const modifiedPrompt = prompt // ++  depending on what we expecting
    const user = [{role:"user",content:modifiedPrompt}]
    const system = persona_data;
    const messages = [...system, ...user]
    const allPersonas = await getPersonasPrompt(env);

    //// uncomment to run with AI 
    //// At this stage we have all the data to do a LLM inference
    
    const ai = new Ai(env.AI)
    //// STREAMING
    //// "@hf/thebloke/llama-2-13b-chat-awq"
    // const resStream = await ai.run(model, {
    //     messages,
    //     stream:true,    
    // })
    // return new Response(resStream,{
    //     headers: { "content-type":"text/event-stream"},
    //  })
    // ;
    
    /// NO STREAM : Short response for llmutils to ensure good latency
    // not implementing max-tokens now as results are not good and does not help with latency much
    //const mt = persona==='Check'? 256:1024;
    const resp = await ai.run(model, {messages,stream:false,});
    console.log(`/llmutil , persona: ${persona}: resp: `,JSON.stringify(resp,null,2));
    /// checks
    if (persona==='Check') {
        console.log("Check Appropriatness")
        return json(parseReasoning(resp.response))
    }
    if (persona==='SceneAnalyser') {
        return json({scene:resp.response});
    }
    return json(resp);


    // uncomment to run without AI
    //return json({success:true,model,messages,persona,allPersonas,memory})
}


//  uncomment this for test: we need a loader to load the form in order to make a post request
/* export const loader:LoaderFunction = async(args:LoaderFunctionArgs) => {
    
    console.log("/llmutils Loader ");
    return {}
}

export default function Component(){
    const data = useActionData()

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
        console.log("Chunks2Array: ",objArray.length);
        return _.compact(objArray)
      }
    function contentFromChunks(data) {
        let result='';
        for (const chunk of data) {
            result = result + chunk.response
        }
        return result
        }

    let result;
    if (typeof data === 'string' && data.length) { 
        result = contentFromChunks(chunks2Array(data));
    }
     

    return (
    <div className="text-2xl">Persona Data type : {typeof(data)}
    <div className="text-xl font-thin text-blue-600 p-10">{result}</div>
    <div className="text-xl font-thin"></div>
    <pre>{JSON.stringify(data,null,2)}</pre>
    
    <form method="POST">
    <div className="w-max space-y-2 flex flex-col justify-center">
    <input type="text" placeholder="prompt" name="prompt" className="input input-bordered input-primary w-full max-w-xs" />
    <input type="text" placeholder="persona" name="persona" className="input input-bordered input-primary w-full max-w-xs" />
    <input type="text" placeholder="model" name="model" className="input input-bordered input-primary w-full max-w-xs" /> 
    <input type="number" placeholder="Number of tokens" name="max_tokens" className="input input-bordered input-primary w-full max-w-xs" /> 
    <button type="submit" className="btn btn-neutral"> Submit </button> 
    </div>
    </form>
    
    </div>
    )
}   */