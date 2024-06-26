
import { useRef } from 'react';
import { useLocation } from '@remix-run/react';
import clsx from 'clsx';
import Audio from './OldAudio'

// eslint-disable-next-line react/prop-types
function Component({method="GET", className="bg-gray-100  outline-1 outline-slate-800" ,persona='StoryWriter',promptText}) {
    //console.log("Prompt ",method, persona, className)
  
  const formRef = useRef()
  function handleKeyPress(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      formRef.current.submit();
    }
  }
  return (
    <div className={className}>
      <form method={method} ref={formRef} >
      <input name="persona" type="text" hidden defaultValue={persona} />
      <textarea 
         name="prompt" 
         placeholder={"Ask "+persona+"..."} 
         className=" hover:outline hover:outline-2  p-2 shadow-2xl flex-grow fixed bottom-10 left-1/2 m-0 -translate-x-1/2 transform rounded-lg bg-slate-100 w-11/12 "
         onKeyUp={handleKeyPress}>
      </textarea>
      
      </form>
     
    </div>

  )
}

export default Component
// removed FORM button
// <button type="submit" className=" fixed bottom-5 right-24 w-10 h-10 shadow-lg text-2xl rounded-full bg-slate-300 drop-shadow-lg" >Go</button>