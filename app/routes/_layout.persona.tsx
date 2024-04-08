import type { ActionFunctionArgs, ActionFunction, LoaderFunction,LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useActionData, useLoaderData } from "@remix-run/react";
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

export const loader:LoaderFunction = async(args:LoaderFunctionArgs) => {
    
    console.log("/persona Loader ");
    return {}
}

export default function Component(){
    const data = useActionData()
    return (
    <div className="text-2xl">Persons Data
    <pre>{JSON.stringify(data,null,2)}</pre>
    <div className="flex flex-col justify-center">
    <form method="POST">
    <input type="text" placeholder="prompt" name="prompt" className="input input-bordered input-primary w-full max-w-xs" />
    <input type="text" placeholder="persona" name="persona" className="input input-bordered input-primary w-full max-w-xs" />
    <input type="text" placeholder="model" name="model" className="input input-bordered input-primary w-full max-w-xs" />  
    <button type="submit" className="btn btn-neutral"> Submit </button> 
    </form>
    </div>
    </div>
    )
}