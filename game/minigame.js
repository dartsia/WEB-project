let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

window.addEventListener("mousedown", function (event) {
    if (phase == "waiting") {
      lastTimestamp = undefined;
      phase = "stretching";
      window.requestAnimationFrame(animate);
    }
  });
  
  window.addEventListener("mouseup", function (event) {
    if (phase == "stretching") {
      phase = "turning";
    }
  });