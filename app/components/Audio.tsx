import  { useState, useRef, useEffect } from 'react';
import Mic from './Mic';
//import Download from './Download';
//import Upload from './Upload';
import Up from './Up'

import { useActionData, useNavigation } from '@remix-run/react';

/// This component returns response via setRespons a useState in parent component
const AudioRecorder =  ({url,update, done}) => {
  //const navigation = useNavigation();
  //const isBusy = navigation.state!='idle';

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const [isBusy,setIsBusy]=useState(false);
  const mediaRecorderRef = useRef(null);
  const hasRecorded = recordedBlobs.length;

  //const [audioResponse,setAudioResponse]=useState({})
  console.log("1. Audio Component params ",url);
  
  //let blobURL=null
  useEffect(() => {
    if (!mediaRecorderRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (event) => {
            setRecordedBlobs([...recordedBlobs, event.data]);
          };
        })
        .catch(err => console.error(err));
    }
  }, [recordedBlobs]);

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setRecordedBlobs([])
      console.log("toggleRecord initiates auto upload...")
      //upload()
    } else {
      mediaRecorderRef.current.start();
    }
    setIsRecording(!isRecording);
  }

  // Courtesy Coding Assistant (impressive)
  // Prompt : Create a function to generate a string from date. 
  // ensure it has the following format YYYYMMDD_HHMMSS where YYYY is full year, 
  // MM is Month, DD is date. HH, MM and SS are hours, minutes. 
  // Ensure MM,DD,HH,MM,SS are prefixed with a 0 if they turn out to be single digit

  function generateDateString(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
   
    return `${year}${month < 10 ? '0' : ''}${month}${day < 10 ? '0' : ''}${day}_${hours < 10 ? '0' : ''}${hours}${minutes < 10 ? '0' : ''}${minutes}${seconds < 10 ? '0' : ''}${seconds}`;
   }

  const downloadRecording = () => {
    if (recordedBlobs.length === 0) return;
    const fname = generateDateString(new Date())+'.wav';
    //console.log("audioblob ",recordedBlobs)
    const blob = new Blob(recordedBlobs, { type: 'audio/wav' });
    console.log("blob ",blob);
   
    const wavfile = new File([blob],fname,{type:blob.type,lastModified:Date.now()})
    console.log("Calling upload...")
    //upload();
    console.log(`File  : ${wavfile.name}`);
    const url = window.URL.createObjectURL(wavfile);
    const link = document.createElement('a');
    link.href = url;
    
  

    link.download = fname
    link.click();
    
    console.log("download url :" , url)
  }

  async function whisper(url:string,audioObj:File) {
    console.log("Whisper(POST) ",audioObj.name,audioObj.size)
    setIsBusy(true);
    const formData = new FormData();
    formData.append("audio",audioObj);
    const options = {
                    method:"POST",
                    body:formData,
                    mode:"no-cors",
                    }
    try {
        const response = await fetch(url,options);
        if (!response.ok) {
          throw new Error(`whisper(POST) Failed: status =  ${response.status}`)
        }
        const data = await response?.json();
        //setAudioResponse(data)
        update(data);
        
        console.log("/whisper response = ",data);
    } catch(err) {
        console.log("Error uploading audio ",err)
    }
    
  }

  async function upload() { // given arg =  recorded blobs: fetches whisper
    if (recordedBlobs.length === 0) return;
    const blob = new Blob(recordedBlobs, { type: 'audio/wav' });
    console.log("upload : blob ",blob);
    const wavfile = new File([blob],"prompt.wav",{type:blob.type,lastModified:Date.now()})
    console.log("upload : wavefile ",wavfile);

    const URL = 'https://main.cldflr-remix-app.pages.dev'+url
    console.log("Uploading.... ",wavfile.name,wavfile.size,URL)
    whisper(URL,wavfile)
      //.then (res => res?.json())
      .then((data) =>  console.log("UPLOADED ",JSON.stringify(data,null,2)))
      .catch(e=> console.log("UPLOAD Error ",e));
    
  }

  return (
    <div className='fixed bottom-24 left-16 z-8'>
        
      {!hasRecorded
      ?
      <div className='flex flex-row space-x-2 p-4' >
        <div className='tooltip tooltip-top' data-tip="Recording Start/Stop">
        <Mic recordingStatus={isRecording} 
            onClick={toggleRecording} 
            busy="loading-bars text-info">
        </Mic>
        </div>
      </div>
      :""
      }
      
      {hasRecorded
        ?
        <div>

          <div className='tooltip tooltip-top' data-tip="Audio to Text">
              <Up 
                  isBusy={isBusy}
                  onClick={upload}
                  busy={"loading-ring text-info"}
                  > 
              </Up>
          </div>

          

        </div>

        :
        ""}
      
    </div>
  );
};

export default AudioRecorder;

/*
<div>
        <pre>{JSON.stringify(audioResponse)}</pre>
      </div>
//download button removed 
<div className='tooltip tooltip-top' data-tip="Download Audio file">
            <button 
                className='btn btn-circle'
                onClick={downloadRecording} > <Download/>     
            </button>
</div>

      */

