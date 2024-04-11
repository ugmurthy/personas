import { useState } from 'react'
import Audio from '../components/Audio'



function record() {
  const url="/whisper"
  const [responseData,setResponseData] = useState()

  return (
    <div className='container pt-32 mx-auto max-w-6xl px-4'>
    <Audio url={url} setResponse={setResponseData}></Audio> 
    {responseData?<pre>{JSON.stringify(responseData,null,2)}</pre>:""}
    </div>
  )
}

export default record