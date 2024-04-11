import { useState } from 'react'
import Audio from '../components/Audio'
import Mic from '../components/Mic'
export async function loader() {
  return {}
}

function record() {
  const url="/whisper"
  
  
  return (
    <div className='container pt-32 mx-auto max-w-6xl px-4'>
    <Audio url={url}/>
    
    </div>
  )
}

//{responseData!==null?<pre>{JSON.stringify(responseData,null,2)}</pre>:""}

export default record