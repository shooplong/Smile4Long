import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  
  const [timer, setTimer] = useState(10);
  const [isCounting, setIsCounting] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, counting, flash, review, result
  
  const [photos, setPhotos] = useState([]);
  const [videoClips, setVideoClips] = useState([]);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // --- VIDEO LOGIC ---
  const startRecording = useCallback(() => {
    setRecordedChunks([]);
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
      };
      mediaRecorderRef.current.start();
    }
  }, []);

  const stopAndCapture = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setStatus('flash');
    const imageSrc = webcamRef.current.getScreenshot();
    
    setTimeout(() => {
      // Temporarily store the shot for review
      setPhotos((prev) => [...prev, imageSrc]);
      setStatus('review'); // STOP HERE for user feedback
      setIsCounting(false);
    }, 200);
  }, []);

  // Process video chunks into a URL once recording stops
  useEffect(() => {
    if (recordedChunks.length > 0 && status === 'review') {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoClips((prev) => [...prev, url]);
    }
  }, [recordedChunks, status]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (isCounting && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
        if (timer === 4) startRecording(); 
      }, 1000);
    } else if (timer === 0 && isCounting) {
      stopAndCapture();
    }
    return () => clearInterval(interval);
  }, [isCounting, timer, startRecording, stopAndCapture]);

  const nextPhoto = () => {
    if (photos.length < 4) {
      setTimer(10);
      setIsCounting(true);
      setStatus('counting');
    } else {
      setStatus('result');
    }
  };

  const retakeLast = () => {
    setPhotos(photos.slice(0, -1));
    setVideoClips(videoClips.slice(0, -1));
    setTimer(10);
    setIsCounting(true);
    setStatus('counting');
  };

  return (
    <div className={`app-container ${status === 'flash' ? 'flash-effect' : ''}`}>
      <h1 className="title">Smile4Long</h1>

      <div className="main-stage">
        {/* SHOW WEBCAM during counting or idle */}
        {(status === 'idle' || status === 'counting') && (
          <div className="camera-container">
            <div className="camera-box">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="webcam-feed" />
              {status === 'counting' && <div className="timer-overlay">{timer}</div>}
            </div>
            {status === 'idle' && (
              <button onClick={() => { setPhotos([]); setVideoClips([]); nextPhoto(); }} className="start-btn">
                Start Session
              </button>
            )}
          </div>
        )}

        {/* REVIEW SCREEN after each shot */}
        {status === 'review' && (
          <div className="review-box">
            <div className="review-media">
              {/* Just the photo now - cleaner and faster! */}
              <img src={photos[photos.length - 1]} className="preview-img" alt="Captured" />
            </div>
            <div className="review-controls">
              <button onClick={retakeLast} className="retake-btn">Retake Shot {photos.length}</button>
              <button onClick={nextPhoto} className="keep-btn">
                {photos.length === 4 ? "See Final Strip" : "Keep & Next"}
              </button>
            </div>
          </div>
        )}

        {/* FINAL RESULT */}
        {status === 'result' && (
          <div className="final-result-view">
            <div className="live-strip">
              {videoClips.map((vid, i) => (
                <video key={i} src={vid} autoPlay loop muted className="strip-video" />
              ))}
            </div>
            <button onClick={() => setStatus('idle')} className="start-btn">Start New Session</button>
          </div>
        )}
      </div>

      <div className="progress-dots">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`dot ${i < photos.length ? 'filled' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export default App;