import  { useState, useRef, useEffect } from 'react';
import Mic from './Mic';
import Download from './Download';
/// This component returns response via setRespons a useState in parent component
const AudioRecorder = ({url,setResponse}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const mediaRecorderRef = useRef(null);
  let blobURL=null
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
    } else {
      mediaRecorderRef.current.start();
    }
    setIsRecording(!isRecording);
  }

  const downloadRecording = () => {
    if (recordedBlobs.length === 0) return;
    const blob = new Blob(recordedBlobs, { type: 'audio/wav' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recording.wav';
    link.click();
    blobURL=url
    console.log("URL :" , url)
  }

  async function whisper(url,imgBlob) {
    const formData = new FormData();
    formData.append("imgBlob",imgBlob);
    const headers = {'Content-Type':'application/octet-stream'}

    const options = {method:"POST",headers,body:formData,mode:"no-cors"}
    const response = await fetch(url,options);
    console.log("Whisper args ",typeof imgBlob,url)
    return response
  }

  async function upload() { // given arg =  recorded blobs: fetches whisper
    if (recordedBlobs.length === 0) return;
    const blob = new Blob(recordedBlobs, { type: 'audio/wav' });
    const response = await whisper(url,blob);
    setResponse(response);
    console.log("Upload ",JSON.stringify(response));
    return response;
  }

  return (
    <div>
        <div className='flex flex-row space-x-2 p-4'>
      <Mic recordingStatus={isRecording} onClick={toggleRecording} busy="loading-bars text-info"></Mic>
      {recordedBlobs.length?<button 
      className='btn btn-circle'
      onClick={upload} 
      disabled={recordedBlobs.length === 0}><Download/>
    
      </button>:""}
      </div>
    </div>
  );
};

export default AudioRecorder;

//<button  onClick={toggleRecording}>{isRecording ? 'Stop Recording' : 'Start Recording'}</button>