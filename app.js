// ============================================================
// SORTEO — Ruleta Interactiva
// app.js
// ============================================================

// ------------------------------------------------------------
// Participantes
// ------------------------------------------------------------
const NAMES = [
  "Jonathan Guerra Cruz",
  "Cristian Cerda Araneda",
  "Cristian Pinto Diaz",
  "Tamara González Armijo",
  "Ricardo Hernandez",
  "Alejandro Navarro",
  "Darlette Morales Vallejos",
  "Víctor Silva Farías",
  "Rodrigo Muñoz Catalan",
  "Martin Romero",
  "Sebastián Orellana",
  "Daniel Betancourt Jerez",
  "Moises Salinas Castro",
  "Bryan Bastián Muñoz Meza",
  "Rodrigo Gonzalo Contreras Alvarez",
  "Carlos Matias Araya Perez",
  "Antonia Valentina Luna Leyton",
  "Fabián Andrés Miranda Aldana",
  "Bruno Lorenzo Sepulveda Henriquez",
  "Matías Ignacio Ureta Araya",
  "Benjamin Enrique Martinez Muñoz",
  "Leandro Antonio Aldana Aguilera",
  "Diego Andrés Henriquez Azua",
  "Javier Ignacio Devia Mallea",
  "Benjamin Fernando Morales Toro",
  "Pedro Manuel Carrasco Escobedo",
  "Sebastián Ignacio Martinez Cifuentes",
  "Luis Roberto Enrique Zuniga Reyes",
  "Cristobal Ignacio Gonzalez Flores",
  "Martin Eliezer Aguilar Espinoza",
  "Esteban Alejandro Valdenegro Quiroga",
  "Ricardo Fernando Manríquez Werches",
  "Cesar Emilio Morales Rojas",
  "Andree Alejandro Perez Zuñiga",
  "Benjamin Eduardo Pino Arenas",
  "Jeremy Nicolas Leyton Alarcon",
  "Alejandro Josue Soto Urbano",
  "Andres Romero Madrid",
  "Francisco Briones Lavados",
  "Cristian Alvarez Bueno"
];

const N = NAMES.length; // 40

// Paleta vibrante — alterna colores sin adyacentes iguales
const COLORS = [
  "#7C3AED","#FFD700","#00D4FF","#FF4757","#00FF88",
  "#9F67FF","#FFA500","#00BFFF","#FF6B81","#39FF14",
  "#6929EA","#F5C518","#0ABDE3","#FF3838","#1DD1A1",
  "#8B5CF6","#FFEAA7","#74B9FF","#FF7675","#55EFC4",
  "#7C3AED","#FFD700","#00D4FF","#FF4757","#00FF88",
  "#9F67FF","#FFA500","#00BFFF","#FF6B81","#39FF14",
  "#6929EA","#F5C518","#0ABDE3","#FF3838","#1DD1A1",
  "#8B5CF6","#FFEAA7","#74B9FF","#FF7675","#55EFC4"
];

// ------------------------------------------------------------
// Constantes de animación
// ------------------------------------------------------------
const STOP_THRESHOLD = 0.0008;
const MIN_VELOCITY   = 0.25;
const MAX_VELOCITY   = 0.55;
const MIN_FRICTION   = 0.982;
const MAX_FRICTION   = 0.994;

// ------------------------------------------------------------
// Estado global
// ------------------------------------------------------------
const state = {
  angle: 0,
  angularVelocity: 0,
  friction: 0.99,
  isSpinning: false,
  rafId: null
};

const winners = []; // historial de ganadores

// ------------------------------------------------------------
// Referencias DOM (asignadas en DOMContentLoaded)
// ------------------------------------------------------------
let canvas      = null;
let ctx         = null;
let spinBtn     = null;
let resultPanel = null;
let winnerOverlay = null;
let winnerNameEl  = null;
let qrCanvasEl    = null;
let qrUrlEl       = null;
let participantList = null;
let historyList     = null;
let confettiCanvas  = null;
let confettiCtx     = null;
let confettiParticles = [];

// ------------------------------------------------------------
// Geometría
// ------------------------------------------------------------
function computeSegmentAngles(n, angle) {
  const step = (2 * Math.PI) / n;
  return Array.from({ length: n }, (_, i) => ({
    start: angle + i * step,
    end:   angle + (i + 1) * step,
    mid:   angle + (i + 0.5) * step
  }));
}

function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

// ------------------------------------------------------------
// Renderizado de la ruleta
// ------------------------------------------------------------
function drawWheel(angle) {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(cx, cy) * 0.88;

  ctx.clearRect(0, 0, W, H);

  // Sombra interior del fondo
  const bgGrad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  bgGrad.addColorStop(0, 'rgba(30,20,60,0.8)');
  bgGrad.addColorStop(1, 'rgba(10,5,30,0.95)');
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  const segments = computeSegmentAngles(N, angle);
  const segSize  = (2 * Math.PI) / N;

  segments.forEach((seg, i) => {
    const color = COLORS[i];

    // Sector
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, seg.start, seg.end);
    ctx.closePath();

    // Gradiente radial por sector
    const midX = cx + radius * 0.5 * Math.cos(seg.mid);
    const midY = cy + radius * 0.5 * Math.sin(seg.mid);
    const grad = ctx.createRadialGradient(cx, cy, 0, midX, midY, radius * 0.8);
    grad.addColorStop(0, color + 'CC');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Texto (solo primer nombre, girado)
    const textR = radius * 0.62;
    const textX = cx + textR * Math.cos(seg.mid);
    const textY = cy + textR * Math.sin(seg.mid);
    const segArcLen = radius * segSize;
    const fontSize = Math.max(10, Math.min(14, Math.floor(segArcLen * 0.38)));
    const shortName = NAMES[i].split(' ')[0];
    const textColor = isLightColor(color) ? '#000000' : '#FFFFFF';

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(seg.mid - Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = isLightColor(color) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillText(shortName, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  });

  // Borde exterior brillante
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, '#FFD700');
  borderGrad.addColorStop(0.5, '#9F67FF');
  borderGrad.addColorStop(1, '#00D4FF');
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Centro decorativo
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.12);
  centerGrad.addColorStop(0, '#FFD700');
  centerGrad.addColorStop(0.5, '#FFA500');
  centerGrad.addColorStop(1, '#7C3AED');
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function render(angle) {
  drawWheel(angle);
}

// ------------------------------------------------------------
// Confetti
// ------------------------------------------------------------
function initConfetti() {
  confettiParticles = Array.from({ length: 120 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20 - Math.random() * 100,
    w: 8 + Math.random() * 8,
    h: 6 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speed: 3 + Math.random() * 4,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    drift: (Math.random() - 0.5) * 1.5
  }));
}

let confettiRAF = null;
function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let alive = false;
  confettiParticles.forEach(p => {
    p.y += p.speed;
    p.x += p.drift;
    p.angle += p.spin;
    if (p.y < confettiCanvas.height + 30) alive = true;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.angle);
    confettiCtx.fillStyle = p.color;
    confettiCtx.globalAlpha = Math.max(0, 1 - p.y / confettiCanvas.height);
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  });
  if (alive) confettiRAF = requestAnimationFrame(animateConfetti);
  else confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function launchConfetti() {
  if (confettiRAF) cancelAnimationFrame(confettiRAF);
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  initConfetti();
  animateConfetti();
}

// ------------------------------------------------------------
// Animación de la ruleta
// ------------------------------------------------------------
function animate() {
  state.angle           += state.angularVelocity;
  state.angularVelocity *= state.friction;

  render(state.angle);

  if (state.angularVelocity < STOP_THRESHOLD) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;

    const winnerIndex = computeWinner(state.angle);
    const winnerName  = NAMES[winnerIndex];

    spinBtn.disabled = false;
    canvas.classList.remove('spinning');
    state.isSpinning = false;

    onWinner(winnerName, winnerIndex);
  } else {
    state.rafId = requestAnimationFrame(animate);
  }
}

// ------------------------------------------------------------
// Lógica del ganador
// ------------------------------------------------------------
function computeWinner(finalAngle) {
  const TWO_PI = 2 * Math.PI;
  return Math.floor(((TWO_PI - (finalAngle % TWO_PI)) / (TWO_PI / N)) % N);
}

function onWinner(name, index) {
  // Panel resultado
  resultPanel.textContent = '🏆 ' + name;

  // Highlight en lista
  const items = participantList.querySelectorAll('li');
  items.forEach(li => li.classList.remove('winner-highlight'));
  if (items[index]) items[index].classList.add('winner-highlight');
  if (items[index]) items[index].scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Historial
  winners.push(name);
  updateHistory();

  // Confetti
  launchConfetti();

  // Mostrar overlay después de un breve delay para que se vea la ruleta detenida
  setTimeout(() => showWinnerOverlay(name), 800);
}

function updateHistory() {
  const emptyEl = historyList.querySelector('.history-empty');
  if (emptyEl) emptyEl.remove();

  const li = document.createElement('li');
  li.innerHTML = `<span class="history-num">#${winners.length}</span>${winners[winners.length - 1]}`;
  historyList.insertBefore(li, historyList.firstChild);
}

// ------------------------------------------------------------
// Overlay ganador + QR
// ------------------------------------------------------------
function showWinnerOverlay(name) {
  winnerNameEl.textContent = name;
  winnerOverlay.classList.remove('hidden');

  // Generar QR
  generateQR(name);
}

function generateQR(name) {
  const encoded = encodeURIComponent(name);
  const BASE_URL = 'https://Leandro21X.github.io/sorteo/';
  const url = `${BASE_URL}winner.html?name=${encoded}`;

  qrUrlEl.textContent = url;

  // Limpiar contenedor anterior y crear div fresco para QRCode
  const qrContainer = document.getElementById('qrContainer');
  const oldDiv = document.getElementById('qrDiv');
  if (oldDiv) oldDiv.remove();
  const qrDiv = document.createElement('div');
  qrDiv.id = 'qrDiv';
  qrDiv.style.cssText = 'display:inline-block; background:white; padding:8px; border-radius:8px; margin: 0 auto 0.5rem;';

  // Insertar antes del qrUrlEl
  qrContainer.insertBefore(qrDiv, qrUrlEl);

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrDiv, {
      text: url,
      width: 180,
      height: 180,
      colorDark: '#000000',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrDiv.innerHTML = '<p style="color:#333;font-size:0.75rem;padding:1rem;max-width:180px;">QR no disponible — abre desde GitHub Pages</p>';
  }
}

function showQRPlaceholder() {
  const qrEl = document.getElementById('qrCanvas');
  qrEl.style.display = 'none';
  const existing = document.querySelector('.qr-placeholder');
  if (!existing) {
    const div = document.createElement('div');
    div.className = 'qr-placeholder';
    div.textContent = 'Abre la app desde un servidor web para activar el QR';
    qrEl.parentNode.insertBefore(div, qrEl);
  }
}

// ------------------------------------------------------------
// Handlerspin
// ------------------------------------------------------------
function sampleInitialVelocity(r) {
  return MIN_VELOCITY + r * (MAX_VELOCITY - MIN_VELOCITY);
}

function handleSpin() {
  if (state.isSpinning) return;

  // Limpiar highlight anterior
  participantList.querySelectorAll('li').forEach(li => li.classList.remove('winner-highlight'));
  resultPanel.textContent = '';

  state.angularVelocity = sampleInitialVelocity(Math.random());
  state.friction        = MIN_FRICTION + Math.random() * (MAX_FRICTION - MIN_FRICTION);
  state.isSpinning      = true;

  spinBtn.disabled = true;
  canvas.classList.add('spinning');

  state.rafId = requestAnimationFrame(animate);
}

// ------------------------------------------------------------
// Inicialización de la UI
// ------------------------------------------------------------
function buildParticipantList() {
  participantList.innerHTML = '';
  NAMES.forEach((name, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;
    li.textContent = `${i + 1}. ${name}`;
    li.title = name;
    participantList.appendChild(li);
  });
  document.getElementById('participantCount').textContent = NAMES.length;
}

function checkServerMode() {
  // GitHub Pages activo — no se necesita aviso de servidor
}

// ------------------------------------------------------------
// DOMContentLoaded
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  canvas        = document.getElementById('rouletteCanvas');
  spinBtn       = document.getElementById('spinBtn');
  resultPanel   = document.getElementById('resultPanel');
  winnerOverlay = document.getElementById('winnerOverlay');
  winnerNameEl  = document.getElementById('winnerName');
  qrCanvasEl    = document.getElementById('qrCanvas');
  qrUrlEl       = document.getElementById('qrUrl');
  participantList = document.getElementById('participantList');
  historyList     = document.getElementById('historyList');

  // Canvas confetti
  confettiCanvas = document.createElement('canvas');
  confettiCanvas.id = 'confettiCanvas';
  document.body.appendChild(confettiCanvas);
  confettiCtx = confettiCanvas.getContext('2d');

  ctx = canvas.getContext('2d');
  if (!ctx) { spinBtn.disabled = true; return; }

  buildParticipantList();
  checkServerMode();

  resultPanel.textContent = '';
  spinBtn.disabled = false;
  spinBtn.addEventListener('click', handleSpin);

  document.getElementById('closeOverlay').addEventListener('click', () => {
    winnerOverlay.classList.add('hidden');
  });

  document.getElementById('closeToast').addEventListener('click', () => {
    document.getElementById('serverToast').classList.add('hidden');
  });

  render(state.angle);
});
