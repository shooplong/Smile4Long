import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const [timer, setTimer] = useState(10);
  const [isCounting, setIsCounting] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, counting, flash, review

  // The 10-second logic
  useEffect(() => {
    let interval;
    if (isCounting && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      capturePhoto();
    }
    return () => clearInterval(interval);
  }, [isCounting, timer]);

  const startSession = () => {
    setTimer(10);
    setIsCounting(true);
    setStatus('counting');
  };

  const capturePhoto = () => {
    setStatus('flash');
    const imageSrc = webcamRef.current.getScreenshot();
    
    // Simulate flash timing
    setTimeout(() => {
      setPhotos([...photos, imageSrc]);
      setIsCounting(false);
      setStatus('review');
    }, 200);
  };

  return (
    <div className={`app-container ${status === 'flash' ? 'flash-effect' : ''}`}>
      <h1 className="title">Smile4Long</h1>
      
      <div className="camera-box">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="webcam-feed"
        />
        
        {status === 'counting' && <div className="timer-overlay">{timer}</div>}
      </div>

      <div className="controls">
        {status === 'idle' && (
          <button onClick={startSession} className="start-btn">Start Session</button>
        )}
        
        {status === 'review' && (
          <div className="review-btns">
            <button onClick={() => { setPhotos(photos.slice(0, -1)); startSession(); }} className="retake-btn">Retake</button>
            <button onClick={() => setStatus('idle')} className="next-btn">Keep & Next</button>
          </div>
        )}
      </div>

      <div className="preview-strip">
        {photos.map((img, i) => (
          <img key={i} src={img} alt={`Capture ${i}`} className="mini-photo" />
        ))}
      </div>
    </div>
  );
}

export default App;
