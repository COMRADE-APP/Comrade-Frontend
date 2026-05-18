import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let modelsLoaded = false;

export const loadFaceAPIModels = async () => {
  if (modelsLoaded) return true;
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face API models loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load face-api models:', error);
    return false;
  }
};

export class LivenessDetector {
  constructor(videoElement) {
    this.video = videoElement;
    this.isRunning = false;
    this.detections = [];
    this.challengeResults = [];
  }

  async startDetection() {
    const modelsLoaded = await loadFaceAPIModels();
    if (!modelsLoaded) {
      throw new Error('Failed to load face detection models');
    }
    this.isRunning = true;
  }

  async detectFace() {
    if (!this.isRunning || !this.video) {
      return null;
    }

    const detection = await faceapi
      .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    return detection;
  }

  async analyzeLiveness() {
    const detection = await this.detectFace();
    
    if (!detection) {
      return {
        livenessScore: 0,
        faceDetected: false,
        multipleFaces: false,
        issues: ['No face detected']
      };
    }

    const issues = [];
    let livenessScore = 1.0;

    // Check for multiple faces
    const allFaces = await faceapi.detectAllFaces(
      this.video, 
      new faceapi.TinyFaceDetectorOptions()
    );
    
    const multipleFaces = allFaces.length > 1;
    if (multipleFaces) {
      issues.push('Multiple faces detected');
      livenessScore -= 0.5;
    }

    // Check face size (too far or too close)
    const box = detection.detection.box;
    const videoArea = this.video.videoWidth * this.video.videoHeight;
    const faceArea = box.width * box.height;
    const faceRatio = faceArea / videoArea;

    if (faceRatio < 0.05) {
      issues.push('Face too far from camera');
      livenessScore -= 0.2;
    } else if (faceRatio > 0.4) {
      issues.push('Face too close to camera');
      livenessScore -= 0.2;
    }

    // Check face landmarks for 3D structure
    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const mouth = landmarks.getMouth();
    const jaw = landmarks.getJawOutline();

    // Calculate face asymmetry
    const leftEyeAvg = leftEye.reduce((a, b) => a + b.x, 0) / leftEye.length;
    const rightEyeAvg = rightEye.reduce((a, b) => a + b.x, 0) / rightEye.length;
    const eyeDistance = Math.abs(rightEyeAvg - leftEyeAvg);
    const noseX = nose[Math.floor(nose.length / 2)].x;
    const noseOffset = Math.abs(noseX - (leftEyeAvg + eyeDistance / 2));

    if (noseOffset > eyeDistance * 0.3) {
      issues.push('Face not centered');
      livenessScore -= 0.1;
    }

    // Check for expressions (indicates real person)
    const expressions = detection.expressions;
    const maxExpression = Object.entries(expressions).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ['neutral', 0]
    );

    if (maxExpression[0] === 'surprised' && maxExpression[1] > 0.8) {
      livenessScore += 0.1;
    }

    // Check for blinking (can indicate liveness)
    const leftEAR = this.calculateEAR(leftEye);
    const rightEAR = this.calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    if (avgEAR < 0.2) {
      issues.push('Eyes may be closed');
      livenessScore -= 0.1;
    }

    // Check brightness (can indicate photo/video)
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const brightness = this.calculateBrightness(imageData);

    if (brightness < 50) {
      issues.push('Poor lighting - too dark');
      livenessScore -= 0.15;
    } else if (brightness > 220) {
      issues.push('Poor lighting - too bright');
      livenessScore -= 0.15;
    }

    return {
      livenessScore: Math.max(0, Math.min(1, livenessScore)),
      faceDetected: true,
      multipleFaces,
      issues,
      details: {
        faceRatio,
        expressions,
        eyeAspectRatio: avgEAR,
        brightness,
        age: detection.age,
        gender: detection.gender,
      }
    };
  }

  calculateEAR(eye) {
    const vertical1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
    );
    const horizontal = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
    );
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  calculateBrightness(imageData) {
    let totalBrightness = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }
    return totalBrightness / (imageData.data.length / 4);
  }

  async verifyChallenge(challengeType) {
    const detection = await this.detectFace();
    
    if (!detection) {
      return { passed: false, message: 'No face detected' };
    }

    const landmarks = detection.landmarks;
    const box = detection.detection.box;
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;

    let passed = false;
    let message = '';

    switch (challengeType) {
      case 'blink':
        const leftEAR = this.calculateEAR(landmarks.getLeftEye());
        const rightEAR = this.calculateEAR(landmarks.getRightEye());
        const avgEAR = (leftEAR + rightEAR) / 2;
        passed = avgEAR < 0.2;
        message = passed ? 'Blink detected' : 'Please blink more noticeably';
        break;

      case 'smile':
        const expressions = detection.expressions;
        passed = expressions.happy > 0.5;
        message = passed ? 'Smile detected' : 'Please smile at the camera';
        break;

      case 'turn_left':
        const noseLeft = landmarks.getNose()[0].x;
        const faceCenterX = box.x + box.width / 2;
        passed = noseLeft < faceCenterX - box.width * 0.15;
        message = passed ? 'Turned left' : 'Please turn your face more to the left';
        break;

      case 'turn_right':
        const noseRight = landmarks.getNose()[0].x;
        passed = noseRight > faceCenterX + box.width * 0.15;
        message = passed ? 'Turned right' : 'Please turn your face more to the right';
        break;

      case 'nod':
        const jaw = landmarks.getJawOutline();
        const jawY = jaw.map(p => p.y);
        const jawMovement = Math.max(...jawY) - Math.min(...jawY);
        passed = jawMovement > box.height * 0.05;
        message = passed ? 'Nod detected' : 'Please nod your head';
        break;

      default:
        passed = true;
        message = 'Challenge completed';
    }

    return { passed, message };
  }

  stop() {
    this.isRunning = false;
  }
}

export default LivenessDetector;