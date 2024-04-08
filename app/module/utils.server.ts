import {z} from 'zod'


interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI:any;
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


export async function setSystemPrompt(e:Env,name:string,persona:SysRole,TTL=60*60*24) {
    const data = []
    data.push(persona)
    await e.SYSTEM.put(name,JSON.stringify(data) );
	console.log("setSystemPrompt ",name, persona, TTL )
}

export async function getSystemPrompt(e:Env,keyname:string,) {
    try {
        const persona = JSON.parse(await e.SYSTEM.get(keyname)) ;
        return persona;
    } catch(e) {
        return []
    }
}


export async function setMemory(e:Env,responses:Input,TTL=60*60*24) {
    await e.CONVERSATION.put("memory",JSON.stringify(responses))
}

export async function getMemory(e:Env) {
    try {
    const memory = JSON.parse(await e.CONVERSATION.get("memory"))
        return memory;
    } catch(e) {
        console.log("Error reading KV 'memory'")
        return [];
    }
}

export async function getPersonas(e:Env) {
    const pList = await e.SYSTEM.list();
        if (pList?.list_complete) { // we have list
            const names = pList?.keys;
            return names.map((n) =>n.name)
        }
        return []   
}
