import confetti from "canvas-confetti";

export function softFirework() {
  confetti({
    particleCount: 70,
    spread: 60,
    startVelocity: 25,
    gravity: 0.9,
    ticks: 180,
    origin: { y: 0.75 },
    scalar: 0.9,
  });
}

export function doubleFirework() {
  softFirework();

  setTimeout(() => {
    softFirework();
  }, 350);
}
