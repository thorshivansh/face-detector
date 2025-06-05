// async function initFaceApi(videoId) {
//   await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
//   await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
//   await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
//   await faceapi.nets.faceExpressionNet.loadFromUri('/models');

//   const video = document.getElementById(videoId);
//   const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
//   video.srcObject = stream;

//   video.onloadedmetadata = () => {
//     video.play();
//     detect(video);
//   };
// }

// async function detect(video) {
//   const canvas = faceapi.createCanvasFromMedia(video);
//   document.body.append(canvas);
//   const displaySize = { width: video.width, height: video.height };
//   faceapi.matchDimensions(canvas, displaySize);

//   setInterval(async () => {
//     const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks()
//       .withFaceExpressions();

//     canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
//     const resized = faceapi.resizeResults(detections, displaySize);
//     faceapi.draw.drawDetections(canvas, resized);
//     faceapi.draw.drawFaceLandmarks(canvas, resized);
//   }, 100);
// }



///

const video = document.getElementById('video');

// Load models and start webcam
async function start() {
  console.log('⏳ Loading models...');
  try {
    await faceapi.nets.tinyFaceDetector.load('/models/');
    await faceapi.nets.faceLandmark68Net.load('/models/');
    console.log('✅ Models loaded');
  } catch (err) {
    console.error('❌ Could not load models:', err);
    return;
  }

  console.log('⏳ Starting video...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    console.log('✅ Webcam stream started');
  } catch (err) {
    console.error('❌ Webcam permission denied or error:', err);
  }
}

// When video starts playing
video.addEventListener('play', () => {
  console.log('▶️ Video playing');

  const canvas = document.getElementById('overlay');
  const displaySize = { width: video.width, height: video.height };

  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    } catch (e) {
      console.error('Detection error:', e);
    }
  }, 100);
});

start();