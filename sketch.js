let video;
let handLandmarker;
let lastVideoTime = -1;
let pointDirection = "NONE"; // LEFT, RIGHT, NONE
let handX = 0;
let handY = 0;

// คลังคำถาม (วิชาพระพุทธศาสนา ป.4-ป.6)
const questions = [
  {
    q: "วันประสูติ ตรัสรู้ และปรินิพพาน\nตรงกับวันใด?",
    left: "วันวิสาขบูชา",
    right: "วันอาสาฬหบูชา",
    ans: "LEFT"
  },
  {
    q: "วันที่มีพระรัตนตรัยครบ 3 ประการ\nเกิดขึ้นครั้งแรกในวันใด?",
    left: "วันมาฆบูชา",
    right: "วันอาสาฬหบูชา",
    ans: "RIGHT"
  },
  {
    q: "เหตุการณ์การแสดง 'โอวาทปาติโมกข์'\nตรงกับวันสำคัญใด?",
    left: "วันมาฆบูชา",
    right: "วันวิสาขบูชา",
    ans: "LEFT"
  },
  {
    q: "ปฐมเทศนาที่พระพุทธเจ้าทรงแสดง\nมีชื่อว่าอะไร?",
    left: "ธัมมจักกัปปวัตนสูตร",
    right: "มงคลสูตร 38",
    ans: "LEFT"
  },
  {
    q: "สถานที่ประสูติของพระพุทธเจ้า\nคือสถานที่ใด?",
    left: "ลุมพินีวัน",
    right: "พุทธคยา",
    ans: "LEFT"
  }
];

let currentQ = 0;
let score = 0;
let gameState = "START"; // START, PLAYING, FEEDBACK, GAMEOVER
let feedbackMsg = "";
let feedbackColor;
let timer = 0;

function setup() {
  let canvas = createCanvas(640, 480);
  canvas.parent('canvas-container');
  
  // เปิดกล้อง WebCam
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // โหลด AI ตรวจจับมือ
  initHandLandmarker();
}

async function initHandLandmarker() {
  const vision = window.tasksVision;
  const filesetResolver = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  handLandmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
}

function draw() {
  background(0);
  
  // แสดงภาพกล้องแบบส่องกระจก (Mirror)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // ประมวลผลตรวจจับมือ
  detectHand();

  // สถานะเกม
  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAYING") {
    drawGameScreen();
  } else if (gameState === "FEEDBACK") {
    drawFeedbackScreen();
  } else if (gameState === "GAMEOVER") {
    drawGameOverScreen();
  }

  // วาดวงกลมติดตามปลายนิ้วชี้เมื่อมีการชี้
  if (pointDirection !== "NONE") {
    fill(255, 215, 0, 200); // สีทองโปร่งแสง
    stroke(255);
    strokeWeight(3);
    circle(handX, handY, 30);
  }

  // แสดง Debug สถานะมือที่มุมซ้ายบน
  drawDebugInfo();
}

function detectHand() {
  if (handLandmarker && video.elt.readyState >= 2) {
    if (video.elt.currentTime !== lastVideoTime) {
      lastVideoTime = video.elt.currentTime;
      let results = handLandmarker.detectForVideo(video.elt, performance.now());
      
      if (results.landmarks && results.landmarks.length > 0) {
        let landmarks = results.landmarks[0];
        
        // จุดอ้างอิง: ปลายนิ้วชี้ (Index Finger Tip = 8)
        let indexTip = landmarks[8];
        
        // แปลงพิกัดให้ตรงกับจอ p5.js แบบกระจกเงา
        handX = width - (indexTip.x * width);
        handY = indexTip.y * height;
        
        // ตรวจว่าปลายนิ้วชี้อยู่ฝั่งซ้ายหรือขวาของหน้าจอ (เพิ่มขอบเขตการชี้)
        if (handX < width * 0.45) {
          pointDirection = "LEFT";
        } else if (handX > width * 0.55) {
          pointDirection = "RIGHT";
        } else {
          pointDirection = "NONE";
        }
      } else {
        pointDirection = "NONE";
      }
    }
  }
}

function drawDebugInfo() {
  fill(0, 200); // สีดำโปร่งแสง
  noStroke();
  rect(10, 10, 220, 40, 5); // ปรับขนาดกรอบ
  fill(255, 255, 0); // สีเหลือง
  textSize(14);
  textAlign(LEFT, CENTER);
  text(`ทิศทางการชี้: ${pointDirection}`, 20, 30);
}

// ... ส่วนที่เหลือของโค้ด drawStartScreen, drawGameScreen, checkAnswer, drawFeedbackScreen, drawGameOverScreen, drawOptionBox เหมือนเดิม ...
// (เพื่อประหยัดเนื้อหา ผมจะละส่วนนี้ไว้ ให้คุณครูใช้โค้ดเดิมในไฟล์ sketch.js ของคุณครูได้เลยครับ)