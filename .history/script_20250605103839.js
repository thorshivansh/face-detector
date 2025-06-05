// const video = document.getElementById("video");
// const canvas = document.getElementById("overlay");
// const ctx = canvas.getContext("2d");

// let faceAlignedCounter = 0;
// const FRAME_THRESHOLD = 10;

// async function start() {
//   console.log("Loading models...");
//   await faceapi.nets.tinyFaceDetector.load('/models/');
//   await faceapi.nets.faceLandmark68Net.load('/models/');
//   console.log("Models loaded ✅");

//   const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//   video.srcObject = stream;
// }

// function drawMask() {
//   const w = canvas.width;
//   const h = canvas.height;
//   ctx.clearRect(0, 0, w, h);

//   // Dark overlay
//   ctx.fillStyle = 'rgba(0,0,0,0.6)';
//   ctx.fillRect(0, 0, w, h);

//   // Clear center circle
//   ctx.globalCompositeOperation = 'destination-out';
//   ctx.beginPath();
//   ctx.arc(w/2, h/2, 120, 0, Math.PI * 2, true);
//   ctx.fill();

//   ctx.globalCompositeOperation = 'source-over';
//   ctx.strokeStyle = 'lime';
//   ctx.lineWidth = 2;
//   ctx.beginPath();
//   ctx.arc(w/2, h/2, 120, 0, Math.PI * 2, true);
//   ctx.stroke();
// }

// function captureImage(detection) {
//   const box = detection.detection.box;
//   const captureCanvas = document.createElement("canvas");

//   captureCanvas.width = box.width;
//   captureCanvas.height = box.height;

//   const captureCtx = captureCanvas.getContext("2d");
//   captureCtx.drawImage(
//     video,
//     box.x, box.y, box.width, box.height,
//     0, 0, box.width, box.height
//   );

//   const dataURL = captureCanvas.toDataURL("image/png");

//   // Download direct
//   const link = document.createElement("a");
//   link.href = dataURL;
//   link.download = "captured_face.png";
//   link.click();
// }

// video.addEventListener("play", () => {
//   const displaySize = { width: video.width, height: video.height };
//   faceapi.matchDimensions(canvas, displaySize);

//   setInterval(async () => {
//     const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

//     drawMask();

//     if (detection) {
//       const resized = faceapi.resizeResults(detection, displaySize);
//       const landmarks = resized.landmarks;
//       const box = resized.detection.box;

//       // Centering logic
//       const faceCenterX = box.x + box.width / 2;
//       const diffFromCenter = Math.abs(faceCenterX - canvas.width / 2);

//       const leftEye = landmarks.getLeftEye();
//       const rightEye = landmarks.getRightEye();
//       const eyeTilt = Math.abs(leftEye[0].y - rightEye[3].y);

//       const isCentered = diffFromCenter < 40;
//       const isStraight = eyeTilt < 10;

//     //   faceapi.draw.drawDetections(canvas, [resized]);
//     //   faceapi.draw.drawFaceLandmarks(canvas, [resized]);

//       if (isCentered && isStraight) {
//         faceAlignedCounter++;
//         console.log(`Face aligned: ${faceAlignedCounter}/${FRAME_THRESHOLD}`);
//       } else {
//         faceAlignedCounter = 0;
//       }

//       if (faceAlignedCounter >= FRAME_THRESHOLD) {
//         console.log("📸 Auto-capturing...");
//         captureImage(resized);
//         faceAlignedCounter = 0;
//       }
//     } else {
//       faceAlignedCounter = 0;
//     }
//   }, 100);
// });

// start();



///




const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

let faceAlignedCounter = 0;
const REQUIRED_FRAMES = 10;

async function start() {
  await faceapi.nets.tinyFaceDetector.load('/models/');
  await faceapi.nets.faceLandmark68Net.load('/models/');

    // ✅ Force-disable any leftover drawing functions (safety)
  faceapi.draw.drawFaceLandmarks = () => {};
  faceapi.draw.drawDetections = () => {};

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

function drawMask(isAligned = false) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Dark transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // ✅ Circle border turns green if aligned, gray otherwise
  ctx.strokeStyle = isAligned ? "lime" : "gray";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2, true);
  ctx.stroke();
}

function captureImage(detection) {
  const box = detection.detection.box;

  const headshotCanvas = document.createElement("canvas");
  headshotCanvas.width = box.width;
  headshotCanvas.height = box.height;

  const ctx2 = headshotCanvas.getContext("2d");
  ctx2.drawImage(
    video,
    box.x, box.y, box.width, box.height,
    0, 0, box.width, box.height
  );

  const dataURL = headshotCanvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "aligned_headshot.png";
  link.click();
}

video.addEventListener("play", () => {
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const res = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    let isAligned = false;

    if (res) {
      const resized = faceapi.resizeResults(res, displaySize);
      const box = resized.detection.box;

      const faceCenterX = box.x + box.width / 2;
      const faceCenterY = box.y + box.height / 2;
      const canvasCenterX = canvas.width / 2;
      const canvasCenterY = canvas.height / 2;

      const dx = faceCenterX - canvasCenterX;
      const dy = faceCenterY - canvasCenterY;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

      const isInsideCircle = distanceFromCenter < 100;
      const landmarks = resized.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const eyeHeightDiff = Math.abs(leftEye[0].y - rightEye[3].y);
      const isLookingStraight = eyeHeightDiff < 10;

      isAligned = isInsideCircle && isLookingStraight;

      if (isAligned) {
        faceAlignedCounter++;
        console.log(`✅ Aligned frame ${faceAlignedCounter}/${REQUIRED_FRAMES}`);
      } else {
        faceAlignedCounter = 0;
      }

      if (faceAlignedCounter >= REQUIRED_FRAMES) {
        console.log("📸 Auto capture fired!");
        captureImage(resized);
        faceAlignedCounter = 0; // reset
      }
    } else {
      faceAlignedCounter = 0;
    }

    drawMask(isAligned); // update mask color
  }, 100);
});

start();