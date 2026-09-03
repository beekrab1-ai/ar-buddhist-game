let video;
let handsfree;
let handX = 0;
let handY = 0;
let isHandDetected = false;
let pointDirection = "NONE";

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
let lastSelectTime = 0;

function setup() {
  let canvas = createCanvas(640, 480);
  canvas.parent('canvas-container');
  
  // เปิดกล้อง WebCam
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // ตั้งค่า Handsfree.js สำหรับการจับพิกัดนิ้วมือ
  handsfree = new Handsfree({
    hands: {
      enabled: true,
      maxNumHands: 1
    }
  });
  handsfree.start();
}

function draw() {
  background(0);
  
  // แสดงภาพกล้องแบบส่องกระจก (Mirror)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // ประมวลผลตำแหน่งนิ้วชี้
  updateHandTracking();

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

  // แสดงวงกลมตัวชี้ตำแหน่งนิ้วชี้ (Pointer)
  if (isHandDetected) {
    fill(255, 215, 0, 220);
    stroke(255);
    strokeWeight(3);
    circle(handX, handY, 28);
    
    fill(255, 0, 0);
    noStroke();
    circle(handX, handY, 8);
  }

  drawDebugInfo();
}

function updateHandTracking() {
  if (handsfree.data.hands && handsfree.data.hands.landmarks && handsfree.data.hands.landmarks[0]) {
    let landmarks = handsfree.data.hands.landmarks[0];
    
    // จุดที่ 8 คือ ปลายนิ้วชี้ (Index Finger Tip)
    let indexTip = landmarks[8];
    
    // แปลงพิกัดกล้อง (0.0 - 1.0) เป็นพิกัดหน้าจอ p5.js แบบกระจก
    handX = (1 - indexTip.x) * width;
    handY = indexTip.y * height;
    isHandDetected = true;

    // แบ่งฝั่งเลือก ซ้าย - ขวา
    if (handX < width * 0.45) {
      pointDirection = "LEFT";
    } else if (handX > width * 0.55) {
      pointDirection = "RIGHT";
    } else {
      pointDirection = "NONE";
    }
  } else {
    isHandDetected = false;
    pointDirection = "NONE";
  }
}

function drawDebugInfo() {
  fill(0, 180);
  noStroke();
  rect(10, 10, 250, 40, 8);
  
  if (isHandDetected) {
    fill(0, 255, 127);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(`กล้องจับมือได้: ชี้ไปฝั่ง [ ${pointDirection} ]`, 20, 30);
  } else {
    fill(255, 200, 0);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(`กำลังรอกล้อง... (ชูมือขึ้นมา)`, 20, 30);
  }
}

function drawStartScreen() {
  fill(0, 0, 0, 190);
  rect(0, 0, width, height);
  
  textAlign(CENTER, CENTER);
  fill(255, 215, 0);
  textSize(32);
  textStyle(BOLD);
  text("เกม AR พุทธประวัติวัดใจ", width / 2, height / 2 - 50);
  
  fill(255);
  textSize(18);
  textStyle(NORMAL);
  text("ใช้นิ้วชี้ไปทาง ซ้าย หรือ ขวา เพื่อเลือกคำตอบ", width / 2, height / 2 + 10);
  
  fill(0, 255, 127);
  rect(width / 2 - 140, height / 2 + 60, 280, 50, 12);
  fill(0);
  textSize(18);
  textStyle(BOLD);
  text("ชี้มือไปทาง ซ้าย/ขวา เพื่อเริ่ม", width / 2, height / 2 + 85);

  // เริ่มเล่นเมื่อชี้ไปทางซ้ายหรือขวา
  if (pointDirection === "LEFT" || pointDirection === "RIGHT") {
    score = 0;
    currentQ = 0;
    gameState = "PLAYING";
    lastSelectTime = millis();
  }
}

function drawGameScreen() {
  let q = questions[currentQ];

  // กล่องโจทย์
  fill(30, 30, 30, 230);
  stroke(255, 215, 0);
  strokeWeight(3);
  rect(50, 20, width - 100, 100, 15);

  noStroke();
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(`ข้อที่ ${currentQ + 1}/${questions.length}: ${q.q}`, width / 2, 70);

  // ตัวเลือกฝั่งซ้าย
  drawOptionBox(30, 180, 250, 130, q.left, pointDirection === "LEFT");
  
  // ตัวเลือกฝั่งขวา
  drawOptionBox(width - 280, 180, 250, 130, q.right, pointDirection === "RIGHT");

  // แถบแสดงคะแนน
  fill(0, 0, 0, 180);
  rect(0, height - 50, width, 50);
  fill(255, 215, 0);
  textSize(22);
  textAlign(LEFT, CENTER);
  text(` คะแนนสะสม: ${score}`, 20, height - 25);

  // ตรวจสอบการเลือก (หน่วงเวลา 1 วินาทีเพื่อป้องกันการค้างเลือกซ้ำ)
  if ((pointDirection === "LEFT" || pointDirection === "RIGHT") && (millis() - lastSelectTime > 1000)) {
    checkAnswer(pointDirection);
  }
}

function drawOptionBox(x, y, w, h, txt, isSelected) {
  push();
  if (isSelected) {
    fill(255, 215, 0, 240);
    stroke(255);
    strokeWeight(4);
  } else {
    fill(0, 102, 204, 210);
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
    feedbackMsg = "ถูกต้องครับ! 🎉";
    feedbackColor = color(0, 200, 83);
  } else {
    score = max(0, score - 50);
    feedbackMsg = "ยังไม่ถูกต้องครับ ❌";
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
    lastSelectTime = millis();
    if (currentQ >= questions.length) {
      gameState = "GAMEOVER";
    } else {
      gameState = "PLAYING";
    }
  }
}

function drawGameOverScreen() {
  fill(0, 0, 0, 230);
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
  rect(width / 2 - 140, height / 2 + 60, 280, 50, 12);
  fill(0);
  textSize(18);
  text("ชี้มือเพื่อเริ่มเล่นใหม่อีกครั้ง", width / 2, height / 2 + 85);

  if ((pointDirection === "LEFT" || pointDirection === "RIGHT") && (millis() - timer > 2000)) {
    score = 0;
    currentQ = 0;
    gameState = "PLAYING";
    lastSelectTime = millis();
  }
}

// ระบบสำรอง: คลิกเมาส์เลือกได้หากจำเป็น
function mousePressed() {
  if (gameState === "START") {
    score = 0;
    currentQ = 0;
    gameState = "PLAYING";
    lastSelectTime = millis();
  } else if (gameState === "PLAYING" && millis() - lastSelectTime > 1000) {
    if (mouseX < width / 2) {
      checkAnswer("LEFT");
    } else {
      checkAnswer("RIGHT");
    }
  } else if (gameState === "GAMEOVER") {
    score = 0;
    currentQ = 0;
    gameState = "PLAYING";
    lastSelectTime = millis();
  }
}