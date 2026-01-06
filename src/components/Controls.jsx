import { useRef, useEffect } from 'react';
import './Controls.css';

function Controls({ onMoveLeft, onMoveRight, onStopMoving }) {
  const leftIntervalRef = useRef(null);
  const rightIntervalRef = useRef(null);
  const leftButtonRef = useRef(null);
  const rightButtonRef = useRef(null);
  
  // Сохраняем актуальные версии функций в ref для использования в useEffect
  const onMoveLeftRef = useRef(onMoveLeft);
  const onMoveRightRef = useRef(onMoveRight);
  const onStopMovingRef = useRef(onStopMoving);
  
  // Обновляем ref при изменении функций
  useEffect(() => {
    onMoveLeftRef.current = onMoveLeft;
    onMoveRightRef.current = onMoveRight;
    onStopMovingRef.current = onStopMoving;
  }, [onMoveLeft, onMoveRight, onStopMoving]);

  // Обработчики для мыши и touch (работают одинаково)
  const startMovingLeft = () => {
    // Останавливаем движение вправо если оно было
    if (rightIntervalRef.current) {
      clearInterval(rightIntervalRef.current);
      rightIntervalRef.current = null;
    }
    // Очищаем интервал влево если он уже был (на случай повторного нажатия)
    if (leftIntervalRef.current) {
      clearInterval(leftIntervalRef.current);
    }
    onMoveLeftRef.current();
    leftIntervalRef.current = setInterval(() => {
      onMoveLeftRef.current();
    }, 100);
  };

  const stopMovingLeft = () => {
    if (leftIntervalRef.current) {
      clearInterval(leftIntervalRef.current);
      leftIntervalRef.current = null;
    }
    onStopMovingRef.current();
  };

  const startMovingRight = () => {
    // Останавливаем движение влево если оно было
    if (leftIntervalRef.current) {
      clearInterval(leftIntervalRef.current);
      leftIntervalRef.current = null;
    }
    // Очищаем интервал вправо если он уже был (на случай повторного нажатия)
    if (rightIntervalRef.current) {
      clearInterval(rightIntervalRef.current);
    }
    onMoveRightRef.current();
    rightIntervalRef.current = setInterval(() => {
      onMoveRightRef.current();
    }, 100);
  };

  const stopMovingRight = () => {
    if (rightIntervalRef.current) {
      clearInterval(rightIntervalRef.current);
      rightIntervalRef.current = null;
    }
    onStopMovingRef.current();
  };

  // Настройка touch событий с passive: false для возможности preventDefault
  useEffect(() => {
    const leftButton = leftButtonRef.current;
    const rightButton = rightButtonRef.current;

    if (!leftButton || !rightButton) return;

    // Обработчики для touch событий с preventDefault
    const handleLeftTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startMovingLeft();
    };

    const handleLeftTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      stopMovingLeft();
    };

    const handleRightTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startMovingRight();
    };

    const handleRightTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      stopMovingRight();
    };

    // Добавляем обработчики с passive: false
    leftButton.addEventListener('touchstart', handleLeftTouchStart, { passive: false });
    leftButton.addEventListener('touchend', handleLeftTouchEnd, { passive: false });
    leftButton.addEventListener('touchcancel', handleLeftTouchEnd, { passive: false });
    
    rightButton.addEventListener('touchstart', handleRightTouchStart, { passive: false });
    rightButton.addEventListener('touchend', handleRightTouchEnd, { passive: false });
    rightButton.addEventListener('touchcancel', handleRightTouchEnd, { passive: false });

    // Очистка при размонтировании
    return () => {
      leftButton.removeEventListener('touchstart', handleLeftTouchStart);
      leftButton.removeEventListener('touchend', handleLeftTouchEnd);
      leftButton.removeEventListener('touchcancel', handleLeftTouchEnd);
      rightButton.removeEventListener('touchstart', handleRightTouchStart);
      rightButton.removeEventListener('touchend', handleRightTouchEnd);
      rightButton.removeEventListener('touchcancel', handleRightTouchEnd);
      // Очищаем интервалы при размонтировании
      if (leftIntervalRef.current) {
        clearInterval(leftIntervalRef.current);
      }
      if (rightIntervalRef.current) {
        clearInterval(rightIntervalRef.current);
      }
    };
  }, []); // Убираем зависимости, используем функции напрямую

  return (
    <div className="controls">
      <button 
        ref={leftButtonRef}
        className="control-button left-button"
        onMouseDown={startMovingLeft}
        onMouseUp={stopMovingLeft}
        onMouseLeave={stopMovingLeft}
      >
        ←
      </button>
      <button 
        ref={rightButtonRef}
        className="control-button right-button"
        onMouseDown={startMovingRight}
        onMouseUp={stopMovingRight}
        onMouseLeave={stopMovingRight}
      >
        →
      </button>
    </div>
  );
}

export default Controls;

