import React from 'react'
import CommandCopy from './CommandCopy'
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

function Utitlity({result,prompt}) {
    function countWords(text) {
        return text.split(/\s+/).length;
    }
    const rWords = countWords(result);
    const pWords = countWords(prompt)

    const statStr = `WordCount prompt = ${pWords}, result = ${rWords}, total = ${pWords+rWords}`
  return (
    <div>
        <div className="flex flex-row items-center  text-sm font-thin text-white"> 
            <CommandCopy txt={result} btnTxt="Copy Response" color="white">R</CommandCopy> 
            <CommandCopy txt={prompt} color="white" btnTxt="Copy Prompt">P</CommandCopy> 
            <CommandCopy txt={prompt+"\n\n"+result} btnTxt="Copy Both" color="white">B</CommandCopy> 
              <span className='hidden lg:block'>
              <pre className='text-xs'> {statStr} {"    |  NOTE: "}{ "AI models can make mistakes. Check before using it" }</pre> 
             </span>
              <span className='pl-8 lg:hidden flex flex-row  space-x-8'>
                  
                  <div className='tooltip tooltip-bottom tooltip-success' data-tip={statStr}><img className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-white" src="/stats.png" alt=""/> </div>
                  <div className='tooltip tooltip-bottom tooltip-warning' data-tip={"AI models can make mistakes. Check before using it"}><img className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-white" src="/warning.png" alt=""/> </div>
              </span>
        </div>
    </div>
  )
}

export default Utitlity