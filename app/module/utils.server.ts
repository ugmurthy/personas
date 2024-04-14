import {effect, z} from 'zod'
import _ from 'lodash'

interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI:any;
}

// content should be atleast 2 chars
const contentSchema = z.string().trim().min(2,{message:"Prompt should not be empty!"})

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

// This was a tricky function: was solved partly by CodeAssistant (this project) 12/4/2024
export async function getPersonasPrompt(e:Env) {
    const personas = await getPersonas(e) 
    console.log(personas)  
    const result= await Promise.all(personas.map(async  (p) => {return await getSystemPrompt(e,p)}))
    return result
    }

/// returns an array of strings of interest. tobe converted to JSON with care
export function parseReasoning(inStr) {
    // outputs JSON - not perfect but reasonable
    const inAry = inStr.split(":");
    const out = []
    //console.log("Array ", inAry)
    function getReasoning(lookfor) {
    let idx = _.findIndex(inAry,(s)=>s.includes(lookfor))
    //console.log("idx ",idx)

    if (idx>=0) {
        if (idx+1 <= inAry.length) {
            let result = inAry[idx+1].split(",")[0]
            let str = `\{"${lookfor}":"${result}" \}`
            //console.log(out.length,":", str)
            out.push(str);
            return str;
        }
    }
    return {}
    }
     _.forEach(["REASONING","TEXT","ANSWER"],v=>getReasoning(v))
    
    try {
        // out is an array of strings
        let reasonJsonAry = out.map((s)=>JSON.parse(s));
        return {json:true,result:reasonJsonAry}
    } catch (e) {
        console.log("parseReason could not conver array to json")
        return {json:false,result:out}
    }
  }

