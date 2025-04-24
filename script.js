// === IMAGE SPAWNING SETUP WITH STREET FOLDER SELECTION ===

const imageCounts = {
  a: 10,
  b: 11,
  c: 11,
  // Add more folders and their image counts here
};

const selectedStreets = new Set(["a", "b", "c"]); // default selected
let lastImagePath = null; // to prevent duplicate images

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.streetCheckbox').forEach(checkbox => {
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedStreets.add(checkbox.value);
      } else {
        selectedStreets.delete(checkbox.value);
      }
      console.log("Selected streets:", Array.from(selectedStreets)); // Debug
    });
  });
});

function getRandomImagePath() {
  const streets = Array.from(selectedStreets);
  if (streets.length === 0) return null;

  let newPath;
  let attempt = 0;
  const maxAttempts = 10;

  do {
    const street = streets[Math.floor(Math.random() * streets.length)];
    const maxImages = imageCounts[street] || 0;
    if (maxImages === 0) continue;

    const imgIndex = String(Math.floor(Math.random() * maxImages) + 1).padStart(2, '0');
    newPath = `images/${street}/${imgIndex}.svg`;

    attempt++;
    if (attempt >= maxAttempts) break;
  } while (newPath === lastImagePath);

  lastImagePath = newPath;
  return newPath;
}

// === IMAGE LOGIC ===

const blurToggle = document.getElementById("blurToggle");
blurToggle.checked = true;

const activeBlurIntervals = new Map();
const blurredImages = new Set();
const imagesInView = new Set();

const getRandomPosition = () => ({
  left: Math.random() * 100 - 10 + "vw",
});

const getRandomSize = () => ({
  width: Math.random() * 700 + 50 + "px",
  height: "auto",
});

const getRandomRotation = () => ({
  transform: `rotate(${Math.random() * 360}deg)`,
});

const getRandomInvert = () => {
  const invertToggle = document.getElementById("invertToggle");
  return invertToggle && invertToggle.checked && Math.random() < 0.2 ? "invert(1)" : "none";
};

function applyFilters(img) {
  const blur = img.dataset.blur || "none";
  const invert = img.dataset.invert || "none";
  const filters = [];

  if (invert !== "none") filters.push(invert);
  if (blur !== "none") filters.push(`blur(${blur})`);

  img.style.filter = filters.join(" ");
}

function createImage() {
  const img = document.createElement("img");
  const imagePath = getRandomImagePath();
  if (!imagePath) return;

  img.src = imagePath;

  Object.assign(img.style, getRandomPosition(), getRandomSize(), getRandomRotation());

  const minTop = 5;
  const maxTop = 30;
  img.style.top = `${Math.random() * (maxTop - minTop) + minTop}vh`;

  img.dataset.invert = getRandomInvert();
  img.dataset.blur = "none";
  applyFilters(img);

  document.getElementById("container").appendChild(img);
  imagesInView.add(img);

  if (blurToggle.checked) {
    graduallyBlur(img);
  }

  moveImageDown(img);

  img.addEventListener("click", (e) => {
    if (!blurToggle.checked) return;

    e.stopPropagation();

    if (blurredImages.has(img)) {
      blurredImages.delete(img);
      graduallyUnblur(img);
    } else if (activeBlurIntervals.has(img)) {
      clearInterval(activeBlurIntervals.get(img));
      activeBlurIntervals.delete(img);
      graduallyUnblur(img);
    }
  });
}


// === DYNAMIC PAGE HEIGHT ADJUSTMENT ===

function updatePageHeight(topInVh) {
  const maxHeightVh = 1000;
  const currentHeightVh = parseFloat(document.documentElement.style.getPropertyValue('--page-height') || 100);
  const targetHeight = Math.min(Math.max(currentHeightVh, topInVh), maxHeightVh);

  document.documentElement.style.setProperty('--page-height', targetHeight);
  document.body.style.height = `${targetHeight}vh`;
}

function moveImageDown(img) {
  let topPosition = parseFloat(img.style.top);
  const fadeStartVh = 850;
  const fadeEndVh = 900;

  function animate() {
    topPosition += 0.1;
    img.style.top = `${topPosition}vh`;

    updatePageHeight(topPosition); // Adjust page height as image moves down

    if (topPosition >= fadeStartVh) {
      const progress = (topPosition - fadeStartVh) / (fadeEndVh - fadeStartVh);
      img.style.opacity = 1 - progress;
    }

    if (topPosition >= fadeEndVh) {
      img.remove();
      imagesInView.delete(img);
      blurredImages.delete(img);
      if (activeBlurIntervals.has(img)) {
        cancelAnimationFrame(activeBlurIntervals.get(img));
        activeBlurIntervals.delete(img);
      }
      return;
    }

    requestAnimationFrame(animate);
  }

  animate();
}


// === SPAWNING LOGIC ===

let spawnSpeed = 1000;

const getRandomSpawnTime = () => {
  const sliderValue = document.getElementById('speedSlider').value;
  spawnSpeed = Math.map(sliderValue, 0, 100, 1000, 50);
  return Math.random() * spawnSpeed + 300;
};

Math.map = function (value, in_min, in_max, out_min, out_max) {
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function spawnImages() {
  createImage();
  setTimeout(spawnImages, getRandomSpawnTime());
}

spawnImages();


// === POPUP TOGGLE ===

const popup = document.getElementById("popup");
const menuButton = document.getElementById("menuButton");
let popupVisible = false;

gsap.set(popup, {
  opacity: 0,
  scale: 0.9,
  pointerEvents: "none"
});

menuButton.addEventListener("click", () => {
  if (!popupVisible) {
    gsap.to(popup, {
      duration: 0.2,
      opacity: 1,
      scale: 1,
      ease: "power2.out",
      onStart: () => {
        popup.style.pointerEvents = "auto";
      }
    });
  } else {
    gsap.to(popup, {
      duration: 0.2,
      opacity: 0,
      scale: 0.9,
      ease: "power2.out",
      onComplete: () => {
        popup.style.pointerEvents = "none";
      }
    });
  }
  popupVisible = !popupVisible;
  menuButton.classList.toggle("active");
});


// === EXPORT ===

document.getElementById("save-pdf").addEventListener("click", saveAsPDF);

function exportCanvas(callback) {
  const elementsToHide = document.querySelectorAll("#popup, #menuButton");

  elementsToHide.forEach(el => el.classList.add("hide-for-export"));

  const element = document.body;
  const { jsPDF } = window.jspdf;

  setTimeout(() => {
    htmlToImage.toPng(element, { pixelRatio: 2 })
      .then(dataUrl => {
        const img = new Image();
        img.onload = () => {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? "landscape" : "portrait",
            unit: "px",
            format: [img.width, img.height],
          });

          pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
          pdf.save("full-page.pdf");

          elementsToHide.forEach(el => el.classList.remove("hide-for-export"));

          if (callback) callback(); // Continue flow after export
        };
        img.src = dataUrl;
      })
      .catch(err => {
        console.error("Error generating PDF:", err);
        elementsToHide.forEach(el => el.classList.remove("hide-for-export"));
        if (callback) callback(); // Still run callback on error
      });
  }, 100); // Ensure styles apply
}

// export animation for popup and button
function saveAsPDF() {
  const tl = gsap.timeline();

  // Step 1: Close popup
  tl.to(popup, {
    duration: 0.2,
    opacity: 0,
    scale: 0.9,
    ease: "power2.out",
    onComplete: () => {
      popup.style.pointerEvents = "none";
    }
  });

  // Step 2: Move menu button out slightly before popup fully closes
  tl.to(menuButton, {
    duration: 0.3,
    x: "-60px",
    ease: "power2.out"
  }, "-=0.15"); // ← starts 0.15s before previous finishes

  // Step 3: Screenshot/export
  tl.add(() => {
    exportCanvas(() => {
      // Step 4 + 5: Smooth return – button in and popup open with overlap
      const tlBack = gsap.timeline();

      tlBack.to(menuButton, {
        duration: 0.3,
        x: "0%",
        ease: "power2.out"
      });

      tlBack.to(popup, {
        duration: 0.2,
        opacity: 1,
        scale: 1,
        ease: "power2.out",
        onStart: () => {
          popup.style.pointerEvents = "auto";
        }
      }, "-=0.15"); // ← overlap again
    });
  });
}


// === DARK MODE ===

const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;

darkModeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
});

// === BLUR TOGGLE ===

blurToggle.addEventListener("change", () => {
  document.body.classList.toggle("blur-on", blurToggle.checked);

  if (blurToggle.checked) {
    imagesInView.forEach((img) => {
      if (!activeBlurIntervals.has(img) && !blurredImages.has(img)) {
        graduallyBlur(img);
      }
    });
  } else {
    activeBlurIntervals.forEach((interval, img) => {
      cancelAnimationFrame(interval);
      if (!blurredImages.has(img)) {
        graduallyUnblur(img);
      }
    });
    activeBlurIntervals.clear();
    blurredImages.forEach((img) => graduallyUnblur(img));
  }
});


// === BLUR ANIMATION ===

function graduallyBlur(img) {
  let blur = 0;
  const maxBlur = Math.random() * 10 + 10;
  const step = 0.05;

  function animate() {
    if (!blurToggle.checked) {
      img.dataset.blur = "none";
      applyFilters(img);
      activeBlurIntervals.delete(img);
      return;
    }

    blur += step;
    img.dataset.blur = `${blur.toFixed(1)}px`;
    applyFilters(img);

    if (parseFloat(blur) >= maxBlur) {
      blurredImages.add(img);
      activeBlurIntervals.delete(img);
      return;
    }

    const frame = requestAnimationFrame(animate);
    activeBlurIntervals.set(img, frame);
  }

  if (activeBlurIntervals.has(img)) {
    cancelAnimationFrame(activeBlurIntervals.get(img));
  }

  animate();
}

function graduallyUnblur(img) {
  let blur = parseFloat(img.dataset.blur?.replace("px", "") || 20);
  const step = 0.1;

  function animate() {
    blur -= step;
    if (blur <= 0) {
      img.dataset.blur = "none";
      applyFilters(img);
      blurredImages.delete(img);
      return;
    }

    img.dataset.blur = `${blur.toFixed(1)}px`;
    applyFilters(img);
    requestAnimationFrame(animate);
  }

  animate();
}
