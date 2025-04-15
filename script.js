const images = Array.from({ length: 32 }, (_, i) => `/images/svg/image_${String(i + 1).padStart(2, "0")}.svg`);

const blurToggle = document.getElementById("blurToggle");
const activeBlurIntervals = new Map();
const blurredImages = new Set();

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

const getRandomInvert = () => (Math.random() > 1 ? "invert(1)" : "none");

const imagesInView = new Set();

function createImage() {
  const img = document.createElement("img");
  const randomIndex = Math.floor(Math.random() * images.length);
  img.src = images[randomIndex];
  
  Object.assign(img.style, getRandomPosition(), getRandomSize(), getRandomRotation(), { filter: getRandomInvert() });

  const minTop = 5;
  const maxTop = 30;
  img.style.top = `${Math.random() * (maxTop - minTop) + minTop}vh`;
  
  document.getElementById("container").appendChild(img);
  imagesInView.add(img);
  
  if (blurToggle.checked) {
    graduallyBlur(img);
  }

  moveImageDown(img);

  // Click event to unblur the image
  img.addEventListener("click", (e) => {
    if (!blurToggle.checked) return; // Only unblur if blur is on

    e.stopPropagation(); // Prevent other listeners from triggering

    if (blurredImages.has(img)) {
      blurredImages.delete(img);
      graduallyUnblur(img);
    } else if (activeBlurIntervals.has(img)) {
      // If it's still being blurred, stop the blur animation
      clearInterval(activeBlurIntervals.get(img));
      activeBlurIntervals.delete(img);
      // Then unblur it
      graduallyUnblur(img);
    }
  });
}

function moveImageDown(img) {
  let topPosition = parseFloat(img.style.top);
  
  function animate() {
    topPosition += 0.1;
    img.style.top = `${topPosition}vh`; 

    requestAnimationFrame(animate);
  }

  animate();
}

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

const popup = document.getElementById("popup");
const menuButton = document.getElementById("menuButton");

let popupVisible = false;

// Set initial hidden state
gsap.set(popup, {
  opacity: 0,
  scale: 0.8,
  pointerEvents: "none"
});

menuButton.addEventListener("click", () => {
  if (!popupVisible) {
    // SHOW animation
    gsap.to(popup, {
      duration: 0.4,
      opacity: 1,
      scale: 1,
      ease: "power2.out",
      onStart: () => {
        popup.style.pointerEvents = "auto";
      }
    });
  } else {
    // HIDE animation
    gsap.to(popup, {
      duration: 0.3,
      opacity: 0,
      scale: 0.8,
      ease: "power2.in",
      onComplete: () => {
        popup.style.pointerEvents = "none";
      }
    });
  }

  popupVisible = !popupVisible;
  menuButton.classList.toggle("active");
});


/*
menuButton.addEventListener("click", () => {
  popup.classList.toggle("hidden");
  menuButton.classList.toggle("active");
});
*/

function exportToPDF() {
  html2canvas(document.body).then((canvas) => {
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10);
    pdf.save("exported-image.pdf");
  });
}

const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;

darkModeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
});

blurToggle.addEventListener("change", () => {
  if (blurToggle.checked) {
    imagesInView.forEach((img) => {
      if (!activeBlurIntervals.has(img) && !blurredImages.has(img)) {
        graduallyBlur(img);
      }
    });
  } else {
    activeBlurIntervals.forEach((interval, img) => {
      clearInterval(interval);
      if (!blurredImages.has(img)) {
        graduallyUnblur(img);
      }
    });
    activeBlurIntervals.clear();

    blurredImages.forEach((img) => {
      graduallyUnblur(img);
    });
  }
});

function graduallyBlur(img) {
  let blur = 0;
  const maxBlur = 20;
  const step = 0.05;
  const interval = 60;

  const blurInterval = setInterval(() => {
    if (!blurToggle.checked) {
      clearInterval(blurInterval);
      img.style.filter = "none";
      activeBlurIntervals.delete(img);
      return;
    }

    blur += step;
    img.style.filter = `blur(${blur}px)`;
    if (blur >= maxBlur) {
      clearInterval(blurInterval);
      activeBlurIntervals.delete(img);
      blurredImages.add(img);
    }
  }, interval);

  activeBlurIntervals.set(img, blurInterval);
}

function graduallyUnblur(img) {
  let blur = parseFloat(img.style.filter.match(/blur\(([\d.]+)px\)/)?.[1]) || 20;
  const step = 0.5;
  const interval = 60;

  const unblurInterval = setInterval(() => {
    blur -= step;
    if (blur <= 0) {
      clearInterval(unblurInterval);
      img.style.filter = "none";
      blurredImages.delete(img);
    } else {
      img.style.filter = `blur(${blur}px)`;
    }
  }, interval);
}
