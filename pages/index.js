import Head from 'next/head'
import "tailwindcss/tailwind.css"
import { useEffect, useState, useRef } from 'react'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
const ffmpeg = createFFmpeg({ log: true })
import { useForm } from 'react-hook-form';


export default function Home() {

  const [ready, setReady] = useState(false)
  const [video, setVideo] = useState()
  const [gif, setGif] = useState();

  const { register, errors, getValues, handleSubmit, reset } = useForm();


  const videoRef = useRef(null);
  const load = async () => {
    await ffmpeg.load()
    setReady(true)
  }

  useEffect(() => {
    load()
  }, [])



  function display(seconds) {
    const format = val => `0${Math.floor(val)}`.slice(-2)
    const hours = seconds / 3600
    const minutes = (seconds % 3600) / 60

    return [hours, minutes, seconds % 60].map(format).join(':')
  }

  const editVideo = async (inputs) => {

    const { start, end } = inputs



    const convertStart = display(start)
    const convertEnd = display(end)

    // Write the file to memory 
    ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));

    // Run the FFMpeg command
    await ffmpeg.run('-i', 'test.mp4', '-ss', convertStart, '-to', convertEnd, '-c', 'copy', 'out.mp4');

    // Read the result
    const data = ffmpeg.FS('readFile', 'out.mp4');

    // Create a URL
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    setGif(url)
  }


  function downloadVideo( name = 'video.mp4') {
    // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)

  
    // Create a link element
    const link = document.createElement("a");
  
    // Set link's href to point to the Blob URL
    link.href = gif;
    link.download = name;
  
    // Append link to the body
    document.body.appendChild(link);
  
    // Dispatch click event on the link
    // This is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
      new MouseEvent('click', { 
        bubbles: true, 
        cancelable: true, 
        view: window 
      })
    );
  
    // Remove link from body
    document.body.removeChild(link);
  }

  function resetForm(){
    reset()
    setGif()
  }

  


  return ready ? (
    <div className="flex flex-col flex-wrap content-center mx-4 ">
      <Head>
        <title>EZ Edit</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className="text-4xl text-center py-8 italic">EZ Edit</h1>

      <p className="bg-blue-200 rounded-md text-xl p-2 m-4 max-w-md"> EZ Edit uses <a className=" font-light underline hover:text-blue-600" href='https://ffmpegwasm.github.io/'>FFMPEG.WASM</a> to edit video on your browser. This proccess can be resource intensive and can cause your device to heat up</p>

      { video && <div>
        <button onClick={() => setVideo()}  className=" float-right m-2 px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-gray-600 rounded dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-700 focus:outline-none focus:bg-blue-500 dark:focus:bg-gray-700">
          New Video
        </button>
        <video
        id="video1"
        controls
        width="350"
        src={URL.createObjectURL(video)}
        ref={videoRef}
      >

      </video>
      </div>}


      {!video && <input className="text-center p-4" type="file" onChange={(e) => setVideo(e.target.files?.item(0))} />}

      {video && <form className="p-2" onSubmit={handleSubmit(data => editVideo(data))}>
        <p className="font-bold">Trim Settings</p>

        <div className="flex flex-col space-x-2 py-2 ">
          <label > Start Time  </label>
          <input className="w-24 px-2 bg-gray-100" type="number" name="start" step="1" min='0' placeholder='seconds' ref={register({ required: 'Start is required!' })}
          />
          {errors.start && <p style={{ color: 'red' }}>{errors.start.message}</p>}
        </div>

        <div className="flex flex-col space-x-2 py-2">
          <label >End Time</label>
          <input className="w-24 px-2 bg-gray-100" type="number" name="end" placeholder='seconds' ref={register({
            required: 'End is Required',
            validate: {
              greaterThanStart: (value) => {
                const { start } = getValues();
                return parseInt(value, 10) > parseInt(start, 10) || 'The end time cannot be below the start time';
              },
              max: (value) => {
                const duration = videoRef.current.duration

                return duration >= parseInt(value, 10) || 'End Time is greater than the length of the Video'
              }
            }
          })}
            min="1" step="1" />
          {errors.end && <p style={{ color: 'red' }}>{errors.end.message}</p>}
        </div>
        <button disabled={gif} type='submit' className=" float-right px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-blue-600 rounded dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-700 focus:outline-none focus:bg-blue-500 dark:focus:bg-gray-700 disabled:opacity-50">
          Trim
        </button>
      </form>}
      {    gif && <div>
        <h1 className="text-xl p-2">Output</h1>
        <video controls src={gif} width="250" />
        <button onClick={() => downloadVideo()}  className="px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-blue-600 rounded dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-700 focus:outline-none focus:bg-blue-500 dark:focus:bg-gray-700">
          Download
        </button>
        <button onClick={() => resetForm()}  className="m-4 px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-gray-600 rounded dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-700 focus:outline-none focus:bg-blue-500 dark:focus:bg-gray-700">
          Reset
        </button>

      </div>}
    </div>
  ) :
    (<p>Loading</p>)
}
