// === LOADER ANIM ===
const letters = Array.from(document.querySelectorAll('.loader-text span'));

// Shuffle the letters array for random order
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

shuffle(letters).forEach((letter, index) => {
  setTimeout(() => {
    letter.style.opacity = '1';
    letter.style.filter = 'blur(0px)';
  }, index * 150); // Staggered appearance
});

// Fade out the loader after all letters are visible
setTimeout(() => {
  const loader = document.getElementById('loader');
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.remove();
    setTimeout(startImageSpawning, 1000); // After loading is done, adds extra delay before spawning
  }, 1000); // Matches the CSS transition duration
}, letters.length * 150 + 1000);




// === IMAGE SPAWNING SETUP WITH FOLDER SELECTION ===

function startImageSpawning() {
  spawnImages();
}


const imageCounts = {
  a: 44,
  b: 41,
  c: 49,
  d: 34,
};

const selectedStreets = new Set(["a", "b", "c", "d"]);
let lastImagePath = null;
let animationsPaused = false;

const generatedPDFNames = new Map();


window.addEventListener('DOMContentLoaded', () => {
  const rotationToggle = document.getElementById("rotationToggle");
  const blurToggle = document.getElementById("blurToggle");

  // Blur off by default
  blurToggle.checked = false;
  handleCursorState();

  document.querySelectorAll('.streetCheckbox').forEach(checkbox => {
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedStreets.add(checkbox.value);
      } else {
        selectedStreets.delete(checkbox.value);
      }
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

const activeBlurIntervals = new Map();
const blurredImages = new Set();
const imagesInView = new Set();


function getRandomPosition() {
  return {
    left: `${Math.random() * 100 - 10}vw`,
    transform: `translateY(0vh)`,
  };
}

function getRandomSize() {
  return {
    width: `${Math.random() * 700 + 50}px`,
    height: "auto"
  };
}

function getRandomRotation() {
  const toggle = document.getElementById("rotationToggle");
  const angle = toggle && toggle.checked ? Math.random() * 360 : 0;
  return { transform: `rotate(${angle}deg)` };
}





function getRandomInvert() {
  const invertToggle = document.getElementById("invertToggle");
  return invertToggle && invertToggle.checked && Math.random() < 0.3 ? "invert(1)" : "none";
}

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

  
  const rotation = getRandomRotation();
  img.dataset.rotation = rotation.transform;
  Object.assign(img.style, getRandomPosition(), getRandomSize(), rotation);


  const startTop = Math.random() * 25 + 5;
  img.dataset.top = startTop;
  img.style.top = "0"; // Use translateY instead
  img.style.left = getRandomPosition().left;

  img.dataset.invert = getRandomInvert();
  img.dataset.blur = "none";
  applyFilters(img);

  document.getElementById("container").appendChild(img);
  imagesInView.add(img);
  const currentYvh = parseFloat(img.dataset.top);
  updatePageHeight(currentYvh);


  if (blurToggle.checked) {
    graduallyBlur(img);
  }

  moveImageDown(img);

img.addEventListener("click", (e) => {
  e.stopPropagation();

  if (blurToggle.checked) {
    if (activeBlurIntervals.has(img)) {
      cancelAnimationFrame(activeBlurIntervals.get(img));
      activeBlurIntervals.delete(img);
    }
    blurredImages.delete(img);
    graduallyUnblur(img);
  }
});

}


// === SCROLL SPEED SLIDER ===

const scrollSpeedSlider = document.getElementById("scrollSpeedSlider");
let scrollSpeedMultiplier = 1; // Default speed

scrollSpeedSlider.addEventListener("input", () => {
  // Map slider value (0–100) to 0.5–2
  scrollSpeedMultiplier = Math.map(scrollSpeedSlider.value, 0, 100, 0.5, 2);
});


// === SIZE SLIDER ===
const sizeSlider = document.getElementById("sizeSlider");
let sizeMultiplier = 1; // Default size multiplier

sizeSlider.addEventListener("input", () => {
  sizeMultiplier = Math.map(sizeSlider.value, 0, 100, 0.5, 2);
});

// Override getRandomSize to use dynamic multiplier
function getRandomSize() {
  const baseMin = 50;
  const baseMax = 750;
  const minSize = baseMin * sizeMultiplier;
  const maxSize = baseMax * sizeMultiplier;
  const randomSize = Math.random() * (maxSize - minSize) + minSize;

  return {
    width: `${randomSize}px`,
    height: "auto"
  };
}


// === DYNAMIC PAGE HEIGHT ADJUSTMENT ===

function updatePageHeight(currentYvh) {
  const maxHeightVh = 2000;
  const contentLayer = document.getElementById("contentLayer");
  const currentHeightVh = parseFloat(document.documentElement.style.getPropertyValue('--page-height') || 100);
  const targetHeight = Math.min(Math.max(currentHeightVh, currentYvh), maxHeightVh);

  document.documentElement.style.setProperty('--page-height', targetHeight);
  document.body.style.height = `${targetHeight}vh`;
}

function moveImageDown(img) {
  let y = parseFloat(img.dataset.top || 0); // Initial Y position in vh
  const fadeStart = 1850;
  const fadeEnd = 1900;

  let speed = 0; // Start at rest
  const rotation = img.dataset.rotation || "rotate(0deg)";

  function animate() {
    if (animationsPaused) {
        requestAnimationFrame(animate);
        return; // Pause movement but keep the animation loop alive
    }
    // Dynamically calculate maxSpeed and acceleration based on CURRENT slider value
    const currentMaxSpeed = 0.1 * scrollSpeedMultiplier;
    const currentAcceleration = 1 * scrollSpeedMultiplier;

    speed = Math.min(speed + currentAcceleration, currentMaxSpeed);
    y += speed;

    img.style.transform = `translateY(${y}vh) ${rotation}`;
    updatePageHeight(y);

    if (y >= fadeStart) {
      const fadeProgress = (y - fadeStart) / (fadeEnd - fadeStart);
      img.style.opacity = 1 - fadeProgress;
    }

    if (y >= fadeEnd) {
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
  const sliderValue = document.getElementById('spawnSpeedSlider').value;
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



// === POPUP TOGGLE ===

const popup = document.getElementById("popup");
const popup2 = document.getElementById("popup2");
const popup2ToggleButton = document.getElementById("popup2-close-button");
const menuButton = document.getElementById("menuButton");

let popupVisible = false;
let popup2Visible = true; // kezdetben együtt mozog a popup1-gyel

// popup1 fix setup
gsap.set(popup, {
  opacity: 0,
  scale: 0.9,
  pointerEvents: "none"
});

// popup2 kezdőpozíció (kicsit balra)
gsap.set(popup2, {
  opacity: 0,
  scale: 1,
  x: -100,
  pointerEvents: "none"
});

// === MENU GOMB ===
menuButton.addEventListener("click", () => {
  if (!popupVisible) {
    // === OPEN ===
    gsap.to(popup, {
      duration: 0.2,
      opacity: 1,
      scale: 1,
      ease: "power2.out",
      onStart: () => {
        popup.style.pointerEvents = "auto";
      }
    });

    if (popup2Visible) {
      gsap.to([popup2, popup2ToggleButton], {
        duration: 0.2,
        opacity: 1,
        scale: 1,
        x: 0,
        delay: 0.05,
        ease: "power2.out",
        onStart: () => {
          popup2.style.pointerEvents = "auto";
          popup2ToggleButton.style.pointerEvents = "auto";
          popup2ToggleButton.classList.add("show");
        }
      });


      // Add slide-in animation for the close button explicitly
      gsap.fromTo(popup2ToggleButton, 
        { x: -100, opacity: 0 }, 
        { 
          duration: 0.2, 
          x: 0, 
          opacity: 1, 
          delay: 0.05,
          ease: "power2.out" 
        }
      );
    } else {
      popup2ToggleButton.classList.add("show");
    }

  } else {
    // === CLOSE ===
    gsap.to(popup, {
      duration: 0.2,
      opacity: 0,
      scale: 0.9,
      delay: 0.1,
      ease: "power2.out",
      onComplete: () => {
        popup.style.pointerEvents = "none";
        popup2ToggleButton.classList.remove("show");
      }
    });

    if (popup2Visible) {
      gsap.to([popup2, popup2ToggleButton], {
        duration: 0.2,
        opacity: 0,
        scale: 1,
        x: -100,
        ease: "power2.out",
        onComplete: () => {
          popup2.style.pointerEvents = "none";
          popup2ToggleButton.style.pointerEvents = "auto";
        }
      });
    }
  }

  popupVisible = !popupVisible;
  menuButton.classList.toggle("active");
});


// === popup2 külön gomb ===
popup2ToggleButton.addEventListener("click", () => {
  const currentlyVisible = popup2.style.opacity === "1" && popup2Visible;

  if (currentlyVisible) {
    // külön elrejtés
    popup2Visible = false;
    popup2ToggleButton.classList.remove("active"); // ← reset to hamburger

    gsap.to([popup2, popup2ToggleButton], {
      duration: 0.25,
      opacity: 0,
      scale: 0.9,
      ease: "power2.out",
      onComplete: () => {
        popup2.style.pointerEvents = "none";
        // nem rejtjük el a gombot!
        popup2ToggleButton.style.pointerEvents = "none";
      }
    });

  } else {
    // külön újramegjelenítés és visszacsatlakozás
    popup2Visible = true;
    popup2ToggleButton.classList.add("active"); // ← turn into X

    popup2ToggleButton.classList.add("show"); // biztosan látszik

    gsap.to([popup2, popup2ToggleButton], {
      duration: 0.2,
      opacity: 1,
      scale: 1,
      ease: "power2.out",
      onStart: () => {
        popup2.style.pointerEvents = "auto";
        popup2ToggleButton.style.pointerEvents = "auto";
      }
    });
  }
});




// === PDF EXPORT ===
document.getElementById("save-pdf").addEventListener("click", saveAsPDF);

function saveAsPDF() {
  const contentLayer = document.getElementById("contentLayer");

  // Create export credit lines
const makeLine = (text, position) => {
  const div = document.createElement("div");
  div.textContent = text;

  const baseStyle = {
    position: "absolute",
    background: "black",
    color: "white",
    padding: "4px 8px",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: "14px",
    zIndex: "99999",
    opacity: "0",
    transition: "opacity 0.2s ease",
    display: "inline-block",
  };

  // Positioning logic
  if (position === "position1") {
    baseStyle.right = "30px";
    baseStyle.top = "30px";
  } else if (position === "position2") {
    baseStyle.right = "30px";
    baseStyle.top = "50px";
  } else if (position === "position3") {
    baseStyle.right = "30px";
    baseStyle.top = "70px";
  }

  Object.assign(div.style, baseStyle);
  contentLayer.appendChild(div);
  return div;
};

const line1 = makeLine("EPHEMERA", "position1");
const line2 = makeLine("© 2025", "position2");


  // Fade in lines
  requestAnimationFrame(() => {
    [line1, line2].forEach(line => (line.style.opacity = "1"));
  });

  // Hide menu if open
  if (popupVisible) {
    menuButton.style.opacity = "0";
    menuButton.click();
  }

  animationsPaused = true;

  setTimeout(() => {
    exportCanvas(() => {
      setTimeout(() => {
        [line1, line2].forEach(line => line.remove());
        menuButton.style.opacity = "1";
        if (!popupVisible) menuButton.click();
      }, 500);
    });
  }, 500);
}

function exportCanvas(callback) {
  const contentLayer = document.getElementById("contentLayer");
  const { jsPDF } = window.jspdf;
  const elementsToHide = document.querySelectorAll("#popup, #menuButton, #popup2, #popup2-close-button");
  
  const today = new Date();
  const formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const formattedTime = `${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;
  const baseName = `Ephemera_${formattedDate}${formattedTime}`;

  let counter = generatedPDFNames.get(baseName) || 1;
  const filename = `${baseName}_${String(counter).padStart(2, '0')}.pdf`;

  // Update counter for future exports
  generatedPDFNames.set(baseName, counter + 1);


  elementsToHide.forEach(el => el.classList.add("hide-for-export"));

  // Ensure full height capture
  const requiredHeight = document.body.scrollHeight;
  const originalHeight = contentLayer.style.height;
  contentLayer.style.height = `${requiredHeight}px`;

  setTimeout(() => {
    htmlToImage.toPng(contentLayer, { pixelRatio: 2 })
      .then(dataUrl => {
        const img = new Image();
        img.onload = () => {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? "landscape" : "portrait",
            unit: "px",
            format: [img.width, img.height],
          });

          pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
          pdf.save(filename);

          // Restore original state
          contentLayer.style.height = originalHeight;
          elementsToHide.forEach(el => el.classList.remove("hide-for-export"));
          menuButton.style.opacity = "1"; // Restore visibility
          animationsPaused = false;
          if (callback) callback();
        };
        img.src = dataUrl;
      })
      .catch(err => {
        console.error("Error generating PDF:", err);
        contentLayer.style.height = originalHeight;
        elementsToHide.forEach(el => el.classList.remove("hide-for-export"));
        menuButton.style.opacity = "1"; // Restore visibility even on error
        animationsPaused = false;
        if (callback) callback();
      });
  }, 100);
}








// === FREEZE TOGGLE ===

const freezeToggle = document.getElementById("freezeToggle");
freezeToggle.checked = false; // Freeze off by default

// Freeze-Blur cancel
freezeToggle.addEventListener("change", () => {
  if (freezeToggle.checked && blurToggle.checked) {
    blurToggle.checked = false;
    handleBlurToggle(); // Actively remove blur effect
  }
  handleCursorState(); // Update cursor style properly
});


// Modify createImage click handler to support freeze logic
function createImage() {
  const img = document.createElement("img");
  const imagePath = getRandomImagePath();
  if (!imagePath) return;

  img.src = imagePath;

  const rotation = getRandomRotation();
  img.dataset.rotation = rotation.transform;
  Object.assign(img.style, getRandomPosition(), getRandomSize(), rotation);

  const startTop = Math.random() * 25 + 5;
  img.dataset.top = startTop;
  img.style.top = "0";
  img.style.left = getRandomPosition().left;

  img.dataset.invert = getRandomInvert();
  img.dataset.blur = "none";
  applyFilters(img);

  document.getElementById("container").appendChild(img);
  imagesInView.add(img);
  
  const currentYvh = parseFloat(img.dataset.top);
  updatePageHeight(currentYvh);

  if (blurToggle.checked) {
    graduallyBlur(img);
  }

  moveImageDown(img);

img.addEventListener("click", (e) => {
  e.stopPropagation();

  if (freezeToggle.checked) {
    // Freeze duplication logic
    const rect = img.getBoundingClientRect();
    const containerRect = document.getElementById("container").getBoundingClientRect();

    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;

    const totalSpawns = Math.floor(Math.random() * (100 - 10) + 10); // Between 10 and 100 spawns
    let count = 0;

    const spawnWithRandomDelay = () => {
      if (count >= totalSpawns) return;

      spawnDuplicateAtPosition(img, left, top);
      count++;

      const randomDelay = Math.random() * (200 - 100) + 100; // 100 to 200 ms delay
      setTimeout(spawnWithRandomDelay, randomDelay);
    };

    spawnWithRandomDelay();
  }

  if (blurToggle.checked) {
    if (activeBlurIntervals.has(img)) {
      cancelAnimationFrame(activeBlurIntervals.get(img));
      activeBlurIntervals.delete(img);
    }
    blurredImages.delete(img);
    graduallyUnblur(img);
  }
});
}

// Helper to spawn duplicate at a fixed screen position
function spawnDuplicateAtPosition(originalImg, left, top) {
  const img = document.createElement("img");
  img.src = originalImg.src;

  img.dataset.rotation = originalImg.dataset.rotation || "rotate(0deg)";
  Object.assign(img.style, getRandomSize());
  img.style.position = "absolute";
  img.style.left = `${left}px`;
  img.style.top = `${top}px`;
  img.style.transform = `translateY(0vh) ${img.dataset.rotation}`;

  img.dataset.invert = getRandomInvert();
  img.dataset.blur = "none";
  applyFilters(img);

  document.getElementById("container").appendChild(img);
  imagesInView.add(img);

  moveImageDown(img);
}




// === DARK MODE TOGGLE ===

const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;

darkModeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
});

// === BLUR TOGGLE LOGIC ===

blurToggle.addEventListener("change", () => {
  const isBlurOn = blurToggle.checked;
  
  // Cancel freeze if blur is being turned on
  if (isBlurOn && freezeToggle.checked) {
    freezeToggle.checked = false;
  }
  
  document.body.classList.toggle("blur-on", isBlurOn);
  handleCursorState();

  if (isBlurOn) {
    imagesInView.forEach((img) => {
      if (!activeBlurIntervals.has(img) && !blurredImages.has(img)) {
        graduallyBlur(img);
      }
    });
  } else {
    // Immediately stop all blur animations and unblur everything
    activeBlurIntervals.forEach((interval, img) => {
      cancelAnimationFrame(interval);
      activeBlurIntervals.delete(img);
      graduallyUnblur(img);
    });
    blurredImages.clear();
  }
});




// === BLUR ANIMATION ===

function graduallyBlur(img) {
  if (blurredImages.has(img)) return; // Already blurred, skip further blurring
  
  let blur = 0;
  const maxBlur = Math.random() * 10 + 5; // Between 5px and 15px
  const step = 0.06; // Blur speed

  if (activeBlurIntervals.has(img)) {
    cancelAnimationFrame(activeBlurIntervals.get(img));
    activeBlurIntervals.delete(img);
  }

  const animate = () => {
    if (!blurToggle.checked || !imagesInView.has(img) || !img.isConnected) {
      activeBlurIntervals.delete(img);
      return;
    }

    blur += step;
    if (blur >= maxBlur) {
      blur = maxBlur;
      blurredImages.add(img);
      activeBlurIntervals.delete(img);
    }

    img.dataset.blur = `${blur.toFixed(1)}px`;
    applyFilters(img);

    const frame = requestAnimationFrame(animate);
    activeBlurIntervals.set(img, frame);
  };

  const delay = Math.random() * 1500 + 1500; // Random delay between 1500–3000ms
  setTimeout(() => {
    if (!img.isConnected || !imagesInView.has(img)) return;
    const frame = requestAnimationFrame(animate);
    activeBlurIntervals.set(img, frame);
  }, delay);
}

function graduallyUnblur(img) {
  let blur = parseFloat(img.dataset.blur?.replace("px", "") || 20);
  const step = 0.3;

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



function handleCursorState() {
  const enableCursor = blurToggle.checked || freezeToggle.checked;
  document.body.classList.toggle("cursor-enabled", enableCursor);
}

function handleBlurToggle() {
  if (blurToggle.checked) {
    imagesInView.forEach(img => {
      if (!activeBlurIntervals.has(img) && !blurredImages.has(img)) {
        graduallyBlur(img);
      }
    });
  } else {
    activeBlurIntervals.forEach((interval, img) => {
      cancelAnimationFrame(interval);
      activeBlurIntervals.delete(img);
      graduallyUnblur(img); // Immediately start unblur
    });
    blurredImages.clear();
  }
}

