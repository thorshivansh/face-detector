async function initFaceApi(videoId) {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');

  const video = document.getElementById(videoId);
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;

  video.onloadedmetadata = () => {
    video.play();
    detect(video);
  };
}

async function detect(video) {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    const resized = faceapi.resizeResults(detections, displaySize);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);
  }, 100);
}

window.initFaceApi = initFaceApi;
