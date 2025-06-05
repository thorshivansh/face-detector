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



// ///
// const video = document.getElementById('video');

// async function start() {
//   console.log("📦 Loading models from /models/");
//   try {
//     await faceapi.nets.tinyFaceDetector.load('/models/');
//     await faceapi.nets.faceLandmark68Net.load('/models/');
//   } catch (err) {
//     console.error("❌ Failed to load models:", err);
//     return;
//   }

//   console.log("🎥 Initializing webcam...");
//   try {
//     const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
//     video.srcObject = stream;
//     console.log("✅ Webcam started");
//   } catch (err) {
//     console.error("❌ Cannot access webcam:", err);
//   }
// }

// video.addEventListener('play', () => {
//   console.log("🚀 Video playing!");

//   const canvas = document.getElementById('overlay');
//   const displaySize = { width: video.width, height: video.height };

//   faceapi.matchDimensions(canvas, displaySize);

//   setInterval(async () => {
//     const detections = await faceapi
//       .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks();

//     const resized = faceapi.resizeResults(detections, displaySize);

//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     faceapi.draw.drawDetections(canvas, resized);
//     faceapi.draw.drawFaceLandmarks(canvas, resized);
//   }, 100);
// });

// start();


// auto
///

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

let faceAlignedCounter = 0;
const FRAME_THRESHOLD = 10;

async function start() {
  console.log("Loading models...");
  await faceapi.nets.tinyFaceDetector.load('/models/');
  await faceapi.nets.faceLandmark68Net.load('/models/');
  console.log("Models loaded ✅");

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

function drawMask() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, h);

  // Clear center circle
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(w/2, h/2, 120, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'lime';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w/2, h/2, 120, 0, Math.PI * 2, true);
  ctx.stroke();
}

function captureImage(detection) {
  const box = detection.detection.box;
  const captureCanvas = document.createElement("canvas");

  captureCanvas.width = box.width;
  captureCanvas.height = box.height;

  const captureCtx = captureCanvas.getContext("2d");
  captureCtx.drawImage(
    video,
    box.x, box.y, box.width, box.height,
    0, 0, box.width, box.height
  );

  const dataURL = captureCanvas.toDataURL("image/png");

  // Download direct
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "captured_face.png";
  link.click();
}

video.addEventListener("play", () => {
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

    drawMask();

    if (detection) {
      const resized = faceapi.resizeResults(detection, displaySize);
      const landmarks = resized.landmarks;
      const box = resized.detection.box;

      // Centering logic
      const faceCenterX = box.x + box.width / 2;
      const diffFromCenter = Math.abs(faceCenterX - canvas.width / 2);

      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const eyeTilt = Math.abs(leftEye[0].y - rightEye[3].y);

      const isCentered = diffFromCenter < 40;
      const isStraight = eyeTilt < 10;

      faceapi.draw.drawDetections(canvas, [resized]);
      faceapi.draw.drawFaceLandmarks(canvas, [resized]);

      if (isCentered && isStraight) {
        faceAlignedCounter++;
        console.log(`Face aligned: ${faceAlignedCounter}/${FRAME_THRESHOLD}`);
      } else {
        faceAlignedCounter = 0;
      }

      if (faceAlignedCounter >= FRAME_THRESHOLD) {
        console.log("📸 Auto-capturing...");
        captureImage(resized);
        faceAlignedCounter = 0;
      }
    } else {
      faceAlignedCounter = 0;
    }
  }, 100);
});

start();
