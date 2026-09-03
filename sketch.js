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

  // พยายามโหลด AI ตรวจจับมือ
  try {
    initHandLandmarker();
  } catch(e) {
    console.log("MediaPipe Loading Error:", e);
  }
}

async function initHandLandmarker() {
  if (window.tasksVision) {
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
}

function draw() {
  background(0);
  
  // แสดงภาพกล้องแบบส่องกระจก (Mirror)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // ประมวลผลตรวจจับมือ (ถ้าจับได้)
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

  // วาดวงกลมติดตามปลายนิ้วชี้
  if (pointDirection !== "NONE") {
    fill(255, 215, 0, 200);
    stroke(255);
    strokeWeight(3);
    circle(handX, handY, 30);
  }

  // แสดง Debug สถานะ
  drawDebugInfo();
}

function detectHand() {
  if (handLandmarker && video.elt && video.elt.readyState >= 2) {
    try {
      if (video.elt.currentTime !== lastVideoTime) {
        lastVideoTime = video.elt.currentTime;
        let results = handLandmarker.detectForVideo(video.elt, performance.now());
        
        if (results && results.landmarks && results.landmarks.length > 0) {
          let landmarks = results.landmarks[0];
          let indexTip = landmarks[8];
          
          handX = width - (indexTip.x * width);
          handY = indexTip.y * height;
          
          if (handX < width * 0.45) {
            pointDirection = "LEFT";
          } else if (handX > width * 0.55) {
            pointDirection = "RIGHT";
          } else {
            pointDirection = "NONE";
          }
          return;
        }
      }
    } catch(e) {
      // ignore
    }
  }
  
  // ถ้าไม่มีมือ หรือระบบจับไม่ได้ ให้ตรวจจากตำแหน่งเมาส์/การแตะแทน
  if (mouseX > 0 && mouseX < width * 0.45) {
    pointDirection = "LEFT";
    handX = mouseX;
    handY = mouseY;
  } else if (mouseX > width * 0.55 && mouseX < width) {
    pointDirection = "RIGHT";
    handX = mouseX;
    handY = mouseY;
  } else {
    pointDirection = "NONE";
  }
}

function drawDebugInfo() {
  fill(0, 200);
  noStroke();
  rect(10, 10, 260, 40, 5);
  fill(255, 255, 0);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(`การเลือก: ${pointDirection} (ชี้กล้อง/คลิกเลือกได้)`, 15, 30);
}

function drawStartScreen() {
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  
  textAlign(CENTER, CENTER);
  fill(255, 215, 0);
  textSize(32);
  textStyle(BOLD);
  text("เกม AR พุทธประวัติวัดใจ", width / 2, height / 2 - 50);
  
  fill(255);
  textSize(18);
  textStyle(NORMAL);
  text("ชี้มือไปทาง ซ้าย/ขวา หรือ คลิกปุ่ม บนหน้าจอ", width / 2, height / 2 + 10);
  
  fill(0, 255, 127);
  rect(width / 2 - 140, height / 2 + 60, 280, 50, 10);
  fill(0);
  textSize(20);
  textStyle(BOLD);
  text("คลิกหน้าจอ หรือ ชี้มือ เพื่อเริ่ม", width / 2, height / 2 + 85);
}

function mousePressed() {
  if (gameState === "START") {
    score = 0;
    currentQ = 0;
    gameState = "PLAYING";
  } else if (gameState === "PLAYING") {
    if (mouseX < width / 2) {
      checkAnswer("LEFT");
    } else {
      checkAnswer("RIGHT");
    }
  } else if (gameState === "GAMEOVER") {
    score = 0;
    currentQ = 0;
    gameState = "PLAYING";
  }
}

function drawGameScreen() {
  let q = questions[currentQ];

  // กล่องคำถามตรงกลาง
  fill(30, 30, 30, 220);
  stroke(255, 215, 0);
  strokeWeight(3);
  rect(60, 20, width - 120, 100, 15);

  noStroke();
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(`ข้อที่ ${currentQ + 1}/${questions.length}: ${q.q}`, width / 2, 70);

  // ตัวเลือกซ้าย
  drawOptionBox(30, 180, 250, 120, q.left, pointDirection === "LEFT");
  
  // ตัวเลือกขวา
  drawOptionBox(width - 280, 180, 250, 120, q.right, pointDirection === "RIGHT");

  // แสดงคะแนนด้านล่าง
  fill(0, 0, 0, 150);
  rect(0, height - 50, width, 50);
  fill(255, 215, 0);
  textSize(22);
  textAlign(LEFT, CENTER);
  text(` คะแนน: ${score}`, 20, height - 25);
}

function drawOptionBox(x, y, w, h, txt, isSelected) {
  push();
  if (isSelected) {
    fill(255, 215, 0, 230);
    stroke(255);
    strokeWeight(4);
  } else {
    fill(0, 102, 204, 200);
    stroke(255);
    strokeWeight(2);
  }
  rect(x, y, w, h, 15);

  fill(isSelected ? 0 : 255);
  noStroke();
  textSize(20);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(txt, x + w / 2, y + h / 2);
  pop();
}

function checkAnswer(selected) {
  let q = questions[currentQ];
  if (selected === q.ans) {
    score += 100;
    feedbackMsg = "ถูกต้อง! 🎉";
    feedbackColor = color(0, 200, 83);
  } else {
    score = max(0, score - 50);
    feedbackMsg = "ยังไม่ถูกต้อง! ❌";
    feedbackColor = color(229, 57, 53);
  }
  gameState = "FEEDBACK";
  timer = millis();
}

function drawFeedbackScreen() {
  fill(feedbackColor);
  rect(0, 0, width, height);

  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text(feedbackMsg, width / 2, height / 2);

  if (millis() - timer > 1500) {
    currentQ++;
    if (currentQ >= questions.length) {
      gameState = "GAMEOVER";
    } else {
      gameState = "PLAYING";
    }
  }
}

function drawGameOverScreen() {
  fill(0, 0, 0, 220);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255, 215, 0);
  textSize(36);
  textStyle(BOLD);
  text("จบการแข่งขัน!", width / 2, height / 2 - 60);

  fill(255);
  textSize(26);
  text(`คะแนนรวมของคุณ: ${score} คะแนน`, width / 2, height / 2);

  fill(0, 230, 118);
  rect(width / 2 - 140, height / 2 + 60, 280, 50, 10);
  fill(0);
  textSize(18);
  text("คลิกหน้าจอเพื่อเล่นอีกครั้ง", width / 2, height / 2 + 85);
}