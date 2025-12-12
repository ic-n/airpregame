import type { CameraAngles, MousePosition, InputHandlers } from "../types";
import { CONFIG } from "../config";
import { clamp } from "../utils";

export const createInputHandlers = (
  isDraggingRef: React.MutableRefObject<boolean>,
  previousMouseRef: React.MutableRefObject<MousePosition>,
  cameraAngleRef: React.MutableRefObject<CameraAngles>,
  lastInteractionRef: React.MutableRefObject<number>,
  cameraDistanceRef: React.MutableRefObject<number> // Add this new ref
): InputHandlers => {
  let initialPinchDistance = 0;
  let initialDistance = 0;

  const updateCameraAngles = (deltaX: number, deltaY: number) => {
    cameraAngleRef.current.theta -= deltaX * CONFIG.CAMERA.DRAG_SENSITIVITY;
    cameraAngleRef.current.phi = clamp(
      cameraAngleRef.current.phi + deltaY * CONFIG.CAMERA.DRAG_SENSITIVITY,
      CONFIG.CAMERA.MIN_PHI,
      CONFIG.CAMERA.MAX_PHI
    );
    lastInteractionRef.current = Date.now();
  };

  const handleMouseDown = (e: MouseEvent) => {
    isDraggingRef.current = true;
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
    lastInteractionRef.current = Date.now();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMouseRef.current.x;
    const deltaY = e.clientY - previousMouseRef.current.y;

    updateCameraAngles(deltaX, deltaY);
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // NEW: Mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.002;
    cameraDistanceRef.current = clamp(
      cameraDistanceRef.current + e.deltaY * zoomSpeed,
      5, // min distance
      50 // max distance
    );
    lastInteractionRef.current = Date.now();
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      initialDistance = cameraDistanceRef.current;
    } else if (e.touches.length === 1) {
      // Rotation start
      isDraggingRef.current = true;
      previousMouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    lastInteractionRef.current = Date.now();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const zoomFactor = initialPinchDistance / distance;
      cameraDistanceRef.current = clamp(
        initialDistance * zoomFactor,
        5, // min distance
        50 // max distance
      );
    } else if (isDraggingRef.current && e.touches.length === 1) {
      // Rotation
      const deltaX = e.touches[0].clientX - previousMouseRef.current.x;
      const deltaY = e.touches[0].clientY - previousMouseRef.current.y;

      updateCameraAngles(deltaX, deltaY);
      previousMouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    initialPinchDistance = 0;
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export const attachInputHandlers = (
  element: HTMLElement,
  handlers: InputHandlers
): (() => void) => {
  element.addEventListener("mousedown", handlers.handleMouseDown);
  window.addEventListener("mousemove", handlers.handleMouseMove);
  window.addEventListener("mouseup", handlers.handleMouseUp);
  element.addEventListener("wheel", handlers.handleWheel, { passive: false });
  element.addEventListener("touchstart", handlers.handleTouchStart, {
    passive: false,
  });
  window.addEventListener("touchmove", handlers.handleTouchMove, {
    passive: false,
  });
  window.addEventListener("touchend", handlers.handleTouchEnd);

  return () => {
    element.removeEventListener("mousedown", handlers.handleMouseDown);
    window.removeEventListener("mousemove", handlers.handleMouseMove);
    window.removeEventListener("mouseup", handlers.handleMouseUp);
    element.removeEventListener("wheel", handlers.handleWheel);
    element.removeEventListener("touchstart", handlers.handleTouchStart);
    window.removeEventListener("touchmove", handlers.handleTouchMove);
    window.removeEventListener("touchend", handlers.handleTouchEnd);
  };
};
