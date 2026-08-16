const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Scroll progress + reveal
const progress = document.querySelector(".page-progress span");
const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
};
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

// Mobile navigation
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  siteNav.classList.toggle("open", open);
});
siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menuToggle.setAttribute("aria-expanded", "false");
  siteNav.classList.remove("open");
}));

// Activity details
document.querySelectorAll(".activity-expand").forEach((button) => {
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.querySelector("span").textContent = open ? "收起路线细节" : "查看路线细节";
    button.nextElementSibling.classList.toggle("open", open);
  });
});

// Semester roadmap interaction
const roadmap = document.querySelector(".roadmap");
document.querySelectorAll(".roadmap-step").forEach((step, index) => {
  const activate = () => {
    document.querySelectorAll(".roadmap-step").forEach((item) => item.classList.remove("active"));
    step.classList.add("active");
    roadmap.style.setProperty("--active-step", index);
  };
  step.addEventListener("mouseenter", activate);
  step.addEventListener("focus", activate);
  step.addEventListener("click", activate);
});

// Join modal and clipboard helper
const modal = document.querySelector("#join-modal");
document.querySelector("[data-open-modal]").addEventListener("click", () => {
  document.body.classList.add("modal-open");
  modal.showModal();
});
const closeModal = () => {
  modal.close();
  document.body.classList.remove("modal-open");
};
document.querySelector("[data-close-modal]").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.querySelectorAll("[data-copy-text]").forEach((button) => button.addEventListener("click", async () => {
  const label = button.querySelector(".copy-state") || button.querySelector("span:first-child");
  const original = label.textContent;
  try {
    await navigator.clipboard.writeText(button.dataset.copyText);
    label.textContent = "已复制 ✓";
  } catch {
    label.textContent = button.dataset.copyText;
  }
  setTimeout(() => (label.textContent = original), 2200);
}));

// Build the voxel field used by the MC × AI card
const voxelWorld = document.querySelector("#voxel-world");
const path = new Set(["1-6", "2-6", "3-6", "4-6", "4-5", "4-4", "5-4", "6-4", "7-4", "7-3", "7-2"]);
for (let y = 0; y < 9; y += 1) {
  for (let x = 0; x < 9; x += 1) {
    const voxel = document.createElement("span");
    voxel.className = `voxel${path.has(`${x}-${y}`) ? " agent-path" : ""}`;
    voxel.style.left = `${x * 44}px`;
    voxel.style.top = `${y * 44}px`;
    voxel.style.opacity = `${0.5 + ((x * 7 + y * 3) % 5) * 0.09}`;
    voxelWorld.appendChild(voxel);
  }
}

// Small topic cycle in the hero
const topics = ["AI TOOLS", "LARGE LANGUAGE MODELS", "DEEP LEARNING", "MULTI AGENT"];
let topicIndex = 0;
if (!reducedMotion) {
  setInterval(() => {
    topicIndex = (topicIndex + 1) % topics.length;
    document.querySelector("#rotating-topic").textContent = topics[topicIndex];
  }, 2200);
}

// Lightweight pointer-responsive network canvas, no runtime dependencies.
function createNetwork(canvas, options = {}) {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let points = [];
  const pointer = { x: -9999, y: -9999 };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(options.maxPoints || 90, Math.round((width * height) / 17000));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.2 + 0.45,
    }));
  };

  const movePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };
  canvas.parentElement.addEventListener("pointermove", movePointer, { passive: true });
  canvas.parentElement.addEventListener("pointerleave", () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  const render = () => {
    context.clearRect(0, 0, width, height);
    points.forEach((point) => {
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 140 && distance > 0) {
        const force = (140 - distance) / 1400;
        point.vx += (dx / distance) * force;
        point.vy += (dy / distance) * force;
      }
      point.vx *= 0.988;
      point.vy *= 0.988;
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < -10) point.x = width + 10;
      if (point.x > width + 10) point.x = -10;
      if (point.y < -10) point.y = height + 10;
      if (point.y > height + 10) point.y = -10;

      context.beginPath();
      context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      context.fillStyle = options.dot || "rgba(75, 219, 230, .42)";
      context.fill();
    });

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const distance = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        if (distance < 105) {
          context.beginPath();
          context.moveTo(points[i].x, points[i].y);
          context.lineTo(points[j].x, points[j].y);
          context.strokeStyle = `rgba(79, 166, 223, ${(1 - distance / 105) * 0.13})`;
          context.lineWidth = 0.7;
          context.stroke();
        }
      }
    }
    if (!reducedMotion) requestAnimationFrame(render);
  };
  resize();
  render();
  window.addEventListener("resize", resize);
}
createNetwork(document.querySelector("#network-canvas"));
createNetwork(document.querySelector("#join-canvas"), { maxPoints: 55, dot: "rgba(54, 139, 255, .35)" });

// Gentle 3D response on wide screens only.
if (!reducedMotion && window.matchMedia("(pointer:fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1200px) rotateX(${-y * 1.2}deg) rotateY(${x * 1.2}deg)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  });
}
