export class GameInput {
  constructor({
    canvas,
    jumpButton,
    onKeyDown,
    onKeyUp,
    onPointerMove,
    onCanvasPointerDown,
    onJumpPointerDown,
    onPointerRelease,
  }) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerup', onPointerRelease);
    window.addEventListener('pointercancel', onPointerRelease);

    canvas.addEventListener('pointermove', (event) => {
      const bounds = canvas.getBoundingClientRect();
      onPointerMove(event.clientX - bounds.left);
    });
    canvas.addEventListener('pointerdown', onCanvasPointerDown);
    jumpButton.addEventListener('pointerdown', onJumpPointerDown);
  }
}
