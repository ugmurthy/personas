import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";

import {z, } from 'zod';
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
    const ai = new Ai(env.AI)
    console.log(`/coach : Loader typeof -  ai: ${typeof ai} env.AI: ${typeof env.AI}`)
    const messages = [
        { role: "system", content: "You are a expert long distance running Coach and ever ready to help runners"},
        {role:"user",
         content: "My 5k time is 00:24:45, my 10k time is 00:48:50. Please suggest workout to improve me marathon time."}
    ];
    console.log("Zod : " ,inputSchema.safeParse(messages))
    const model = "@hf/thebloke/llama-2-13b-chat-awq";

   const newmsg =  [
    {
      "role": "system",
      "content": "You are a expert long distance running Coach and ever ready to help runners"
    },
    {
      "role": "user",
      "content": "Hi How are you?"
    },
    {
      "role": "assistant",
      "content": "I am here to help you"
    },
    {
      "role": "user",
      "content": "Create a weekly base building plan?"
    }
  ]

    /* const streamPromise =  ai.run("@hf/thebloke/llama-2-13b-chat-awq", {
        messages,
        stream:true,
    })

    return defer({stream:streamPromise}) */
    // OLD CODE - preserve
    const stream = await ai.run("@hf/thebloke/llama-2-13b-chat-awq", {
        messages:newmsg,
        stream:true,
    })
    return new Response(stream,{
        headers: { "content-type":"text/event-stream"},
    });

   

}
