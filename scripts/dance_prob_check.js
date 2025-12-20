// Simple simulation to verify dancing probability (independent of pathfinding)
const TRIALS = 100000;
const DANCE_PROB = 0.5;
let count = 0;
for (let i = 0; i < TRIALS; i++) {
  if (Math.random() < DANCE_PROB) count++;
}
console.log(`Trials: ${TRIALS}, Danced: ${count}, ratio: ${ (count / TRIALS).toFixed(4) }`);
// Also simulate capacity effect
const CAPACITY = 8;
let dancers = 0;
let dancedWithCapacity = 0;
for (let i = 0; i < TRIALS; i++) {
  // simulate random current dancers (0..CAPACITY*2)
  dancers = Math.floor(Math.random() * (CAPACITY * 2));
  const choice = (Math.random() < DANCE_PROB && dancers < CAPACITY);
  if (choice) dancedWithCapacity++;
}
console.log(`With random current dancers and capacity ${CAPACITY}, danced: ${dancedWithCapacity}, ratio: ${(dancedWithCapacity / TRIALS).toFixed(4)}`);