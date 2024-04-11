import  { useState, useRef, useEffect } from 'react';
import Mic from './Mic';
import Download from './Download';

/// This component returns response via setRespons a useState in parent component
const AudioRecorder =  ({url}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const mediaRecorderRef = useRef(null);
  const hasRecorded = recordedBlobs.length;
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
    } else {
      mediaRecorderRef.current.start();
    }
    setIsRecording(!isRecording);
  }

  const downloadRecording = () => {
    if (recordedBlobs.length === 0) return;
    localStorage.setItem("audioblob",btoa(recordedBlobs));
    console.log("audioblob ",recordedBlobs)
    const blob = new Blob(recordedBlobs, { type: 'audio/wav' });
    console.log("blob ",blob);
    const wavfile = new File([blob],{type:blob.type,lastModified:Date.now()})
    console.log(wavfile)
    //const url = window.URL.createObjectURL(blob);
    upload();
    const url = window.URL.createObjectURL(wavfile);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'newaudio.wav';
    link.click();
    
    console.log("download url :" , url)
  }

  async function whisper(url:string,audioObj:File) {
    console.log("Whisper.... ",audioObj.name,audioObj.size)
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
          throw new Error(`Upload Failed: status =  ${response.status}`)
        }
        const data = await response.json();
        console.log("/whisper response = ",data);
    } catch(err) {
        console.log("Error uploading audio ",err)
    }
    
  }

  async function upload() { // given arg =  recorded blobs: fetches whisper
    if (recordedBlobs.length === 0) return;
    console.log("Uploading....")
    const blob = new Blob(recordedBlobs, { type: 'audio/wav' });
    const wavfile = new File([blob],"prompt.wav",{type:blob.type,lastModified:Date.now()})
    const URL = 'https://main.cldflr-remix-app.pages.dev'+url
    console.log("Uploading.... ",wavfile.name,wavfile.size, URL)
    whisper(URL,wavfile)
      .then (res => res.json())
      .then(data =>console.log("UPLOADED ",JSON.stringify(data,null,2)))
      .catch(e=> console.log("UPLOAD Error ",e));
  }

  return (
    <div>
        <div className='flex flex-row space-x-2 p-4'>
      <Mic recordingStatus={isRecording} onClick={toggleRecording} busy="loading-bars text-info"></Mic>
      {hasRecorded?<button 
            className='btn btn-circle'
            onClick={downloadRecording} > <Download/>     
        </button>:""}
      </div>
    </div>
  );
};

export default AudioRecorder;

//<button  onClick={toggleRecording}>{isRecording ? 'Stop Recording' : 'Start Recording'}</button>
/*
{recordedBlobs.length
         ?
        <button 
            className='btn btn-circle'
            onClick={console.log("Clicked button")} >      
        </button>:""
      }
*/