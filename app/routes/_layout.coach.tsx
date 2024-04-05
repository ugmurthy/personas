import type { LoaderFunction, LoaderFunctionArgs,  } from "@remix-run/cloudflare";
import {json,} from '@remix-run/cloudflare'
import { useLoaderData, } from "@remix-run/react";
import {z, ZodError} from 'zod';
import {Ai} from '@cloudflare/ai'
interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI: any;
}
// content should be atleast 2 chars
const contentSchema = z.string().trim().min(2,{message:"Prompt should be atleast 2 characters!"})

// a message: {role:<ROLE>,content:<CONTENT>}
const messageSchema = z.object({
    role: z.enum(["system","user","assistant"]),
    content: contentSchema
})

// input is an array of message - {messages:[m1,m2,m3]}
const inputSchema = z.array(messageSchema)
const sysSchema = z.object({
    role:z.string().startsWith("system"),
    content: contentSchema
})
// infer types  from schemas if needed
type Input = z.infer<typeof inputSchema>
type SysRole = z.infer<typeof sysSchema>


async function setSystemPrompt(e:Env,name:string,persona:SysRole,TTL=60*60*24) {
    await e.SYSTEM.put(name,JSON.stringify(persona) );
	console.log("setSystemPrompt ",name, persona, TTL )
}

function getURLdetails(request:Request) {
	
		const url = new URL(request.url);
		if (url.pathname !== '/favicon.ico') { 
			console.log("hostname ",url.hostname);
			console.log("pathname ",url.pathname);
			const model = url.searchParams.get("model");
			const prompt= url.searchParams.get("prompt");
			const name =url.searchParams.get("name")
			const system = url.searchParams.get("system")
			return {model,prompt,name,system}
	}
}


export const loader:LoaderFunction = async (args:LoaderFunctionArgs )=>{
    
    const env = args.context.cloudflare.env as Env
    /*
    result.push({params});
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
    //getEnvdetails(env); */

    const ai = new Ai(env.AI)
    
    const messages = [
        { role: "system", content: "You are a expert long distance running Coach and ever ready to help runners"},
        {role:"user",
         content: "My 5k time is 00:24:45, my 10k time is 00:48:50. Please suggest workout to improve me marathon time."}
    ];
    console.log("Zod : " ,inputSchema.safeParse(messages))
    const stream = await ai.run("@hf/thebloke/llama-2-13b-chat-awq", {
        messages,
        stream:true,
    })
    return new Response(stream,{
        headers: { "content-type":"text/event-stream"},
    });

   

}

/* export default function Component() {
    //const {model,prompt,system,} = useLoaderData<typeof loader>();
    const result = useLoaderData<typeof loader>();
    return (
        <div>
        <div className="p-4 text-2xl text-blue-500">Details from Cloudflare</div>
        <pre>{JSON.stringify(result,null,2)}</pre>
        </div>
    )
} */