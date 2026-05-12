import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import verificationService from '../services/verification';
import toast from 'react-hot-toast';

const CHALLENGES = [
  { id: 'blink', instruction: 'Blink slowly' },
  { id: 'smile', instruction: 'Smile' },
  { id: 'turn_left', instruction: 'Turn your head to the left' },
  { id: 'turn_right', instruction: 'Turn your head to the right' },
  { id: 'nod', instruction: 'Nod slowly' },
];

export default function LivenessVerification() {
  const { verificationId } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('idle');
  const [sessionId, setSessionId] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [stream, setStream] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus('ready');
    } catch (error) {
      toast.error('Could not access camera. Please grant permission.');
    }
  };

  const initiateLiveness = async () => {
    try {
      const response = await verificationService.initiateLiveness(verificationId);
      setSessionId(response.session_id);
      setStatus('initiated');
      setCurrentChallenge(0);
      setCountdown(3);
      
      toast.success('Liveness session initiated');
      startRecording();
    } catch (error) {
      toast.error('Failed to initiate liveness verification');
    }
  };

  const startRecording = async () => {
    if (!stream) {
      await startCamera();
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      setRecordedChunks(chunks);
      await processLiveness(chunks);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    setStatus('recording');
    runChallengeSequence();
  };

  const runChallengeSequence = () => {
    let challengeIndex = 0;
    const runNext = () => {
      if (challengeIndex < CHALLENGES.length) {
        setCurrentChallenge(challengeIndex);
        
        setTimeout(() => {
          challengeIndex++;
          if (challengeIndex < CHALLENGES.length) {
            runNext();
          } else {
            setTimeout(() => {
              stopRecording();
            }, 2000);
          }
        }, 3000);
      }
    };

    runNext();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
    }
  };

  const processLiveness = async (chunks) => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const file = new File([blob], 'liveness_video.webm', { type: 'video/webm' });

    const mockLivenessData = {
      faceDetected: true,
      multipleFaces: false,
      screenRecordingDetected: false,
      maskDetected: false,
      livenessScore: 0.85,
      video: file
    };

    try {
      const response = await verificationService.completeLiveness(sessionId, mockLivenessData);
      
      if (response.liveness_verified) {
        setStatus('success');
        toast.success('Liveness verification successful!');
        setTimeout(() => {
          navigate(`/verification/${verificationId}`);
        }, 2000);
      } else {
        setStatus('failed');
        toast.error('Liveness verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      toast.error('Error processing liveness verification');
    }
  };

  const retryLiveness = async () => {
    try {
      await verificationService.retryLiveness(verificationId);
      setStatus('idle');
      setSessionId(null);
      setRecordedChunks([]);
      setCurrentChallenge(0);
    } catch (error) {
      toast.error('Failed to retry liveness verification');
    }
  };

  const renderIdle = () => (
    <div className="text-center">
      <div className="bg-gray-100 rounded-lg p-8 mb-6">
        <div className="text-6xl mb-4">📹</div>
        <h3 className="text-xl font-semibold mb-2">Live Video Verification</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          This verification ensures you're a real person, not a bot, AI, or someone impersonating.
          You'll be asked to perform simple movements in front of your camera.
        </p>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg text-left max-w-lg mx-auto mb-6">
        <h4 className="font-semibold text-yellow-800 mb-2">Requirements:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>✓ Good lighting on your face</li>
          <li>✓ Face the camera directly</li>
          <li>✓ Remove glasses, hats, headphones</li>
          <li>✓ Ensure no one else is in frame</li>
          <li>✓ Complete the movements shown on screen</li>
        </ul>
      </div>

      <button
        onClick={initiateLiveness}
        className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-lg"
      >
        Start Verification
      </button>
    </div>
  );

  const renderRecording = () => (
    <div className="text-center">
      <div className="relative max-w-lg mx-auto mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg border-4 border-blue-500"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          REC
        </div>

        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
          Challenge {currentChallenge + 1}/{CHALLENGES.length}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
        <h3 className="text-2xl font-bold mb-2">{CHALLENGES[currentChallenge]?.instruction}</h3>
        <p className="text-gray-500">Follow the instructions on screen</p>
        
        <div className="mt-4 flex justify-center gap-2">
          {CHALLENGES.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx < currentChallenge ? 'bg-green-500' :
                idx === currentChallenge ? 'bg-blue-500 animate-pulse' :
                'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center">
      <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
      <h3 className="text-xl font-semibold mb-2">Processing Verification</h3>
      <p className="text-gray-600">Analyzing your video for liveness indicators...</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center">
      <div className="text-6xl mb-4">✓</div>
      <h3 className="text-2xl font-bold text-green-600 mb-2">Verification Successful!</h3>
      <p className="text-gray-600 mb-6">Your identity has been verified.</p>
      <button
        onClick={() => navigate(`/verification/${verificationId}`)}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        View Verification Details
      </button>
    </div>
  );

  const renderFailed = () => (
    <div className="text-center">
      <div className="text-6xl mb-4">✕</div>
      <h3 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h3>
      <p className="text-gray-600 mb-6">We couldn't verify your liveness. Please try again.</p>
      <button
        onClick={retryLiveness}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  );

  const renderError = () => (
    <div className="text-center">
      <div className="text-6xl mb-4">!</div>
      <h3 className="text-2xl font-bold text-red-600 mb-2">Error Occurred</h3>
      <p className="text-gray-600 mb-6">Something went wrong. Please try again.</p>
      <button
        onClick={() => setStatus('idle')}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Start Over
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Liveness Verification</h1>

      {status === 'idle' && renderIdle()}
      {status === 'initiated' && renderRecording()}
      {status === 'recording' && renderRecording()}
      {status === 'processing' && renderProcessing()}
      {status === 'success' && renderSuccess()}
      {status === 'failed' && renderFailed()}
      {status === 'error' && renderError()}
    </div>
  );
}