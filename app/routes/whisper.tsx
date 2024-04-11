import type { ActionFunctionArgs,ActionFunction } from "@remix-run/cloudflare";
import { useActionData } from "@remix-run/react"; 
import {json} from '@remix-run/cloudflare'
import {z,ZodError} from 'zod'
import zx from 'zodix'

interface Env {
    SYSTEM: KVNamespace;
    CONVERSATION: KVNamespace;
    AI: unknown;
}

const MAX_FILE_SIZE = 2000000; // 1MB


export async function action(args:ActionFunctionArgs) {
    const imgBlob = await args.request.arrayBuffer();
    const size = imgBlob.byteLength;
    console.log("/whisper Size ",imgBlob.byteLength)
    const env = args.context.cloudflare.env as Env
    const err = size > MAX_FILE_SIZE ? `Max size for uploads( ${MAX_FILE_SIZE/1000000} MB ) execeed`:"Zero bytes uploaded"
    if (!size) { // we have  problem
        return json({
            success: false,
            error: err,
            size,
          });
    }
    // result.data contains the blob;
    try {
        const a = new Uint8Array(imgBlob)
        console.log("/whisper BLOB details :",typeof a, a.length)
    } catch(e) {
        return json({
            success:false,
            error:e,
            size,
        }) 
    }
    return json({
        success:true,
        size
    })
}