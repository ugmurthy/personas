import type { ActionFunctionArgs,ActionFunction } from "@remix-run/cloudflare";
import { useActionData } from "@remix-run/react"; 
import {json} from '@remix-run/cloudflare'
import {z,ZodError} from 'zod'
import zx from 'zodix'
import {Ai} from '@cloudflare/ai'
interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI: unknown;
}

const MAX_FILE_SIZE = 2000000; // 1MB
const WHISPER = "@cf/openai/whisper"

export async function action(args:ActionFunctionArgs) {
    const formData = await args.request.formData();
    const audioObj =  formData.get('audio')
    const size = audioObj?.size;
    const name = audioObj?.name;
    //const ab = await args.request.arrayBuffer()
    //const size =  ab.byteLength;

    console.log("FILE ",name,size);
    const ab = await audioObj?.arrayBuffer();
    //console.log("AB  ",size);

    const env =args.context.cloudflare.env;
    
    try {
        const ai = new Ai(env.AI);
        // const res = await fetch(
        //     "https://github.com/Azure-Samples/cognitive-services-speech-sdk/raw/master/samples/cpp/windows/console/samples/enrollment_audio_katie.wav"
        //   );
        //   const blob = await res.arrayBuffer();
      
        /* const inputs = {
            prompt: "cyberpunk cat",
          };
      
          const response = await ai.run(
            "@cf/lykon/dreamshaper-8-lcm",
            inputs
          );

          return new Response(response, {
            headers: {
              "content-type": "image/png",
            },
          }); */
        
        const input = {
            audio:[...new Uint8Array(ab)],
        }
        console.log("1/whisper Input created, calling ai.run() ", size)
        const response = await ai.run("@cf/openai/whisper",input);
        console.log("2/whisper awaiting response")
        return Response.json({ input: { audio: [] }, response });
    } catch(e) {
        console.log("3/whisper ERROR")
        return json({
            success:false,
            error:e,
            size,
        }) 
    }
    
}