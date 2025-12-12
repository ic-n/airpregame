import type { CameraAngles, MousePosition, InputHandlers } from "../types";
import { CONFIG } from "../config";
import { clamp } from "../utils";

export const createInputHandlers = (
  isDraggingRef: React.MutableRefObject<boolean>,
  previousMouseRef: React.MutableRefObject<MousePosition>,
  cameraAngleRef: React.MutableRefObject<CameraAngles>,
  lastInteractionRef: React.MutableRefObject<number>
): InputHandlers => {
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

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingRef.current = true;
    previousMouseRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    lastInteractionRef.current = Date.now();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - previousMouseRef.current.x;
    const deltaY = e.touches[0].clientY - previousMouseRef.current.y;

    updateCameraAngles(deltaX, deltaY);
    previousMouseRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
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
  element.addEventListener("touchstart", handlers.handleTouchStart);
  window.addEventListener("touchmove", handlers.handleTouchMove);
  window.addEventListener("touchend", handlers.handleTouchEnd);

  return () => {
    element.removeEventListener("mousedown", handlers.handleMouseDown);
    window.removeEventListener("mousemove", handlers.handleMouseMove);
    window.removeEventListener("mouseup", handlers.handleMouseUp);
    element.removeEventListener("touchstart", handlers.handleTouchStart);
    window.removeEventListener("touchmove", handlers.handleTouchMove);
    window.removeEventListener("touchend", handlers.handleTouchEnd);
  };
};
