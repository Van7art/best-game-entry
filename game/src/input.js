// Emberfall — keyboard and mouse input. The game reads this one object every
// frame; nothing else in the codebase touches DOM events directly.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 640, y: 300, down: false },
    // Edge-triggered presses, consumed by the game loop once per frame.
    pressed: new Set(),
  };

  const KEYMAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const action = KEYMAP[event.code];
    if (action) input.keys.add(action);
    if (event.code === 'KeyM') input.pressed.add('mute');
    if (event.code === 'KeyP' || event.code === 'Escape') input.pressed.add('pause');
    if (event.code === 'KeyR') input.pressed.add('restart');
    if (event.code === 'Enter' || event.code === 'Space') input.pressed.add('confirm');
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    const action = KEYMAP[event.code];
    if (action) input.keys.delete(action);
  });

  function trackMouse(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  }

  canvas.addEventListener('mousemove', trackMouse);
  canvas.addEventListener('mousedown', (event) => {
    trackMouse(event);
    input.mouse.down = true;
    input.pressed.add('confirm');
  });
  canvas.addEventListener('mouseup', () => {
    input.mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouse.down = false;
  });

  input.endFrame = function endFrame() {
    input.pressed.clear();
  };

  return input;
}
