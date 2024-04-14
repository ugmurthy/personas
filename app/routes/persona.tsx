import type { ActionFunctionArgs, ActionFunction, LoaderFunction,LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useActionData, useLoaderData } from "@remix-run/react";
import {json,} from '@remix-run/cloudflare'
import { setSystemPrompt,setMemory, getSystemPrompt, getMemory, getPersonas } from "~/module/utils.server";
import {z,ZodError} from 'zod'
import {zx} from 'zodix'
import {Ai} from '@cloudflare/ai'


interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI: unknown;
}
const PersonaRouteSchema = z.object({
    persona: z.string().trim().min(3),
    prompt: z.string().trim().optional(),
    model: z.string().trim().min(2)
  });

// Check if there is an error for a specific path.
function errorAtPath(error: ZodError, path: string) {
    return error.issues.find((issue) => issue.path[0] === path)?.message;
  }

export const action:ActionFunction = async (args:ActionFunctionArgs) =>{
    // parameter passed for now dummy
    // const model = "ModelnameIsxxxx"
    // const prompt = "Who are you?"
    // const persona = "StoryWriter";
    const result = await zx.parseFormSafe(args.request, PersonaRouteSchema);
    const env = args.context.cloudflare.env as Env
    console.log("/persona form params ",JSON.stringify(result,null,2));
    
    if (!result.success) { // we have  problem
        return json({
            success: false,
            personaError: errorAtPath(result.error, "persona"),
            promptError: errorAtPath(result.error, "prompt"),
            modelError: errorAtPath(result.error,"model")
          });
    }
    // All good
    const {model,prompt,persona } = result.data;
    console.log("After validation of params")
    console.log(`model '${model}' persona : '${persona}' prompt: '${prompt}'`)
    // get list of personas
    const personas = await getPersonas(env); // gets an array of persona names
    //check if persona is one of listed personas
    if (!(personas).includes(persona)) {
        return json({success:false,errorPersona:`Persona: ${persona} unavaialable`})
    }
    // all good
    const persona_data = await getSystemPrompt(env,persona)
    const memory = await getMemory(env)

    // At this stage we have all the data to do a LLM inference
    
    let ai 
    try {
    ai = new Ai(env.AI)
    } catch(e) {
        console.log("Error : new Ai :",e)
    }


    // model : @TODO : from caller form
    // assemble messages
        // assemble user input : add stuff to make it smarter
        //  add gaurds,what to do, what not to do
        //  add output format
        const modifiedPrompt = prompt // ++  depending on what we expecting
        const user = [{role:"user",content:modifiedPrompt}]
        const system = persona_data;
    const messages = [...system, ...user]
    // "@hf/thebloke/llama-2-13b-chat-awq"
    console.log(`before ai.run :  model '${model}' messages : '${messages}' `)
    const resStream = await ai.run(model, {
        messages,
        stream:true,
        
        
    })

     return new Response(resStream,{
        headers: { "content-type":"text/event-stream"},
     });
    
    //return json({success:true,model,messages,persona,memory})
}

// uncomment this for local testing

// export const loader:LoaderFunction = async(args:LoaderFunctionArgs) => {
    
//     console.log("/persona Loader ");
//     return {}
// }

// export default function Component(){
//     const data = useActionData()
//     return (
//     <div className="text-2xl">Persons Data
//     <pre>{JSON.stringify(data,null,2)}</pre>
    
//     <form method="POST">
//     <div className="w-max space-y-2 flex flex-col justify-center">
//     <input type="text" placeholder="prompt" name="prompt" className="input input-bordered input-primary w-full max-w-xs" />
//     <input type="text" placeholder="persona" name="persona" className="input input-bordered input-primary w-full max-w-xs" />
//     <input type="text" placeholder="model" name="model" className="input input-bordered input-primary w-full max-w-xs" />  
//     <button type="submit" className="btn btn-neutral"> Submit </button> 
//     </div>
//     </form>
    
//     </div>
//     )
// }  