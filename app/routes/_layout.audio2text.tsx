import { ClientActionFunctionArgs, ClientLoaderFunctionArgs, useActionData, useLoaderData } from '@remix-run/react';
import React from 'react'

import Audio from '../components/Audio'

export const clientLoader = async ({
    request,
    params,
    serverLoader,
  }: ClientLoaderFunctionArgs) => {
    
    return {hello:"audio2text"};
  };

export const clientAction = async ({
    request,
    params,
    serverAction,
  }: ClientActionFunctionArgs) => {

    const formdata = await request.formData()
    console.log("/audio2text request ",request.url);
    console.log("/audio2text request ",request.method)
    //console.log("request ",formdata.keys())
    formdata.forEach((value, key) => {
        console.log(`/audio2text formdata {${key}: ${value}}`);
       });
    const data = await serverAction();
    return data;
  };
  
function Component() {

//clien side request
const url = "/whisper"
const data = useActionData();
const l = useLoaderData();

console.log("/audio2text ",l);

  return (
    <div className=' p-40'>
        <div>AUDIO2TEXT</div>
        <pre>
            {JSON.stringify(data,null,2)}
        </pre>
        <Audio url={url}/>
        
    </div>
  )
}

export default Component
