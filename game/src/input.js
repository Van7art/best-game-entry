// Keyboard + mouse input, in canvas (logical 1280x720) coordinates.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 640, y: 300, down: false },
    pressed: new Set(),
    clicked: null,
  };
  const toLogical = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (1280 / r.width), y: (e.clientY - r.top) * (720 / r.height) };
  };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) input.pressed.add(e.code);
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
  canvas.addEventListener('mousemove', (e) => { const p = toLogical(e); input.mouse.x = p.x; input.mouse.y = p.y; });
  canvas.addEventListener('mousedown', (e) => {
    const p = toLogical(e);
    input.mouse.x = p.x; input.mouse.y = p.y; input.mouse.down = true;
    input.clicked = { x: p.x, y: p.y };
  });
  window.addEventListener('mouseup', () => { input.mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  input.consumePressed = (code) => {
    if (input.pressed.has(code)) { input.pressed.delete(code); return true; }
    return false;
  };
  input.consumeClick = () => { const c = input.clicked; input.clicked = null; return c; };
  input.endFrame = () => { input.pressed.clear(); };
  return input;
}
