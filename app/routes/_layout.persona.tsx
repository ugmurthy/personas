import type { ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {json,} from '@remix-run/cloudflare'
import { setSystemPrompt,setMemory, getSystemPrompt, getMemory, getPersonas } from "~/module/utils.server";
import {z,ZodError} from 'zod'
import {zx} from 'zodix'

const PersonaRouteSchema = z.object({
    persona: z.string().trim(),
    prompt: z.string().trim().optional(),
    model: z.string().trim()
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


    // get list of personas
    const personas = await getPersonas(env); // gets an array of persona names
    //check if persona is one of listed personas
    if (!(personas).includes(persona)) {
        return json({success:false,errorPersona:`Persona: ${persona} unavaialable`})
    }
    // all good
    const persona_data = await getSystemPrompt(env,persona)
    const memory = await getMemory(env)
    return json({success:true,model,system:persona_data,persona,memory,prompt})
}

export const loader = async() => {
    return {hello:"hello, this is dummy loader"}
}
/* 
export const loader:LoaderFunction = async (args:LoaderFunctionArgs )=>{
    const result = [];
    const params = getURLdetails(args.request);
    const env = args.context.cloudflare.env as Env
    const user = {role:"user",content:"Hi How are you?"}
    const asst = {role:"assistant",content:"I am here to help you"}
    const rdata = [];
    rdata.push(user)
    rdata.push(asst)
    result.push({params});
    console.log("Memory" ,rdata)
    await setMemory(env,rdata);

    if (params?.model && params?.prompt) { // generate
        // generate
        // save response to KV conversation if context enabled
        console.log("MODEL GENERATION.....")
        result.push( {model:params?.model, prompt:params?.prompt});

    } else {
        if (params?.model) { // only model
            // get model details
            // show page of description
            console.log("MODEL DESCRIPTION.....")
            const description = params?.model + ": Description"
            result.push({model:params?.model, description})
        }
    }

     if (params?.name && params?.system) { // set system prompt
        if (params?.name === 'list') { // list all KVs fron namespace SYSTEM
            console.log("LISTING.....")
            const list = await env.SYSTEM.list();
            result.push(list.keys)
        } else { // create KV in SYSTEM namespace
            console.log("CREATING KV ",params.name,params.system)
            await setSystemPrompt(env,params?.name,{role:"system",content:params?.system})

        }
    } 
    //getEnvdetails(env);

    return  json(result);

}
 */