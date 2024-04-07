import { useEventSource } from "remix-utils/sse/react"
import {useState} from "react"

export default function Component({url}) {
    const [response,setResponse]=useState("")
    let result = useEventSource(url) // defaults to {event:"message"}

    if (!result) return null;
    if (result.includes('[DONE]')) return <div>DONE</div>
    const message = JSON.parse(result)
    const text = message?.response
    setResponse((r)=> r+text)
    console.log(response)
    

    return (
        <div>  
        <div className="text-2xl">Text Streaming </div>
        <pre>{response}</pre>
        </div>
    )
}