import { useState, useEffect, useCallback, useRef } from 'react';
import Scene from './Scene';
import Basket from './Basket';
import Unicorn from './Unicorn';
import Controls from './Controls';
import './Game.css';

function Game() {
  // Позиция персонажа в процентах, ограничена от 9% до 91% для предотвращения выхода за экран
  const [basketPosition, setBasketPosition] = useState(50);
  const [unicorns, setUnicorns] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5); // Количество жизней
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMoving, setIsMoving] = useState(false); // движется ли персонаж
  const [direction, setDirection] = useState('idle'); // направление: 'left', 'right', 'idle'
  const [lastSide, setLastSide] = useState('right'); // последняя сторона для поочередности

  // Размер корзины для проверки столкновений
  const BASKET_WIDTH = 18; // процент от ширины экрана (увеличено для большего персонажа)
  const BASKET_HEIGHT = 12; // процент от высоты экрана (увеличено для большего персонажа)
  // Персонаж находится прямо на полу - пол внизу страницы (bottom: 0)
  // Высота пола: 120px (десктоп), 100px (планшет), 90px (мобильный)
  // Персонаж стоит на полу, его bottom = высота пола
  const BASKET_BOTTOM = 12; // процент от высоты экрана (персонаж на полу)

  // Константы для деревьев
  const TREE_HEIGHT = 18; // Высота дерева в процентах от высоты экрана
  const TREE_WIDTH = 25; // Ширина дерева в процентах от ширины экрана (горизонтальная проекция) - увеличено для большего движения в сторону
  
  // Все 4 точки появления пони (выше каждого дерева)
  const SPAWN_POINTS = [
    { side: 'left', treeNumber: 1, treeTop: 20, x: 0 },
    { side: 'left', treeNumber: 2, treeTop: 40, x: 0 },
    { side: 'right', treeNumber: 1, treeTop: 20, x: 100 },
    { side: 'right', treeNumber: 2, treeTop: 40, x: 100 }
  ];
  
  // Создание нового единорога (появляется только в 4 точках выше каждого дерева)
  const createUnicorn = useCallback(() => {
    // Выбираем случайную точку из 4 возможных
    const spawnPoint = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
    
    // Пони появляется ВЫШЕ дерева (на 2-3% выше верхней части дерева)
    const startX = spawnPoint.x;
    const startY = spawnPoint.treeTop - 2; // На 2% выше дерева
    
    const newUnicorn = {
      id: Date.now(),
      x: startX,
      y: startY,
      side: spawnPoint.side,
      onTree: false, // Пони еще не на дереве, падает
      treeNumber: spawnPoint.treeNumber,
      treeTop: spawnPoint.treeTop,
      treeStartX: startX,
      slidingDown: false, // Флаг сползания с дерева
      runningAway: false // Флаг убегания пони
    };
    
    setUnicorns(prev => [...prev, newUnicorn]);
  }, []);

  // Отслеживание пони, которые уже отняли жизнь (чтобы не отнимать повторно)
  const processedUnicornsRef = useRef(new Set());
  // Используем ref для basketPosition, чтобы не пересоздавать интервал при движении персонажа
  const basketPositionRef = useRef(basketPosition);
  
  // Обновляем ref при изменении basketPosition
  useEffect(() => {
    basketPositionRef.current = basketPosition;
  }, [basketPosition]);
  
  // Движение единорогов (спускаются по палкам, потом падают)
  useEffect(() => {
    if (!gameStarted || gameOver) {
      // Очищаем отслеживание при остановке игры
      processedUnicornsRef.current.clear();
      return;
    }

    const interval = setInterval(() => {
      setUnicorns(prev => {
        let livesLost = 0; // Счетчик потерянных жизней в этом кадре
        
        const updated = prev.map(unicorn => {
          // Если пони убегает, двигаем его горизонтально
          if (unicorn.runningAway) {
            // Определяем направление убегания (влево если x < 50, вправо если x >= 50)
            const runSpeed = 4; // Скорость убегания (увеличена для более заметного эффекта)
            const newX = unicorn.x < 50 
              ? unicorn.x - runSpeed // Убегает влево
              : unicorn.x + runSpeed; // Убегает вправо
            
            return {
              ...unicorn,
              x: newX
            };
          }
          
          // Проверяем все деревья для столкновения
          const allTrees = [
            { side: 'left', treeNumber: 1, treeTop: 20, treeStartX: 0 },
            { side: 'left', treeNumber: 2, treeTop: 40, treeStartX: 0 },
            { side: 'right', treeNumber: 1, treeTop: 20, treeStartX: 100 },
            { side: 'right', treeNumber: 2, treeTop: 40, treeStartX: 100 }
          ];
          
          // Находим дерево, на котором пони находится или должен находиться
          const currentTree = allTrees.find(t => 
            t.side === unicorn.side && t.treeNumber === unicorn.treeNumber
          ) || allTrees[0];
          
          const treeTop = currentTree.treeTop;
          const treeBottom = treeTop + TREE_HEIGHT;
          const treeStartX = currentTree.treeStartX;
          const treeEndX = currentTree.side === 'left' 
            ? treeStartX + TREE_WIDTH
            : treeStartX - TREE_WIDTH;
          
          // Проверяем, находится ли пони в зоне текущего дерева
          const isInTreeZone = unicorn.y >= treeTop && unicorn.y <= treeBottom &&
            ((currentTree.side === 'left' && unicorn.x >= treeStartX && unicorn.x <= treeEndX) ||
             (currentTree.side === 'right' && unicorn.x <= treeStartX && unicorn.x >= treeEndX));
          
          // Проверяем столкновение со всеми деревьями
          let hitTree = null;
          if (!unicorn.onTree && !unicorn.slidingDown && !unicorn.runningAway) {
            for (const tree of allTrees) {
              const tTop = tree.treeTop;
              const tBottom = tTop + TREE_HEIGHT;
              const tStartX = tree.treeStartX;
              const tEndX = tree.side === 'left' ? tStartX + TREE_WIDTH : tStartX - TREE_WIDTH;
              
              const willHit = (unicorn.y + 1.5) >= tTop && (unicorn.y + 1.5) <= tBottom &&
                ((tree.side === 'left' && unicorn.x >= tStartX && unicorn.x <= tEndX) ||
                 (tree.side === 'right' && unicorn.x <= tStartX && unicorn.x >= tEndX));
              
              if (willHit) {
                hitTree = tree;
                break;
              }
            }
          }
          
          // Если пони сползает по дереву (движется по контуру)
          if (unicorn.slidingDown || (unicorn.onTree && isInTreeZone)) {
            // Сползание по контуру дерева: сначала в сторону, потом вниз
            // Проверяем, достиг ли пони конца дерева по горизонтали
            const reachedEndX = unicorn.side === 'left'
              ? unicorn.x >= treeEndX
              : unicorn.x <= treeEndX;
            
            if (!reachedEndX) {
              // Сначала двигаемся в сторону (горизонтально) - быстрее и дальше
              const horizontalSpeed = 2.5; // Увеличена скорость движения в сторону
              const newX = unicorn.side === 'left' 
                ? unicorn.x + horizontalSpeed
                : unicorn.x - horizontalSpeed;
              
              // Ограничиваем, чтобы не выйти за границы дерева
              const clampedX = unicorn.side === 'left'
                ? Math.min(treeEndX, newX)
                : Math.max(treeEndX, newX);
              
              return {
                ...unicorn,
                x: clampedX,
                onTree: true,
                slidingDown: true
              };
            } else {
              // Достигли конца дерева по горизонтали - теперь двигаемся вниз
              const verticalSpeed = 1.5;
              const newY = unicorn.y + verticalSpeed;
              
              // Проверяем, сполз ли пони с дерева (достиг нижней границы)
              if (newY >= treeBottom) {
                // Пони сполз с дерева - начинает падать вертикально
                return {
                  ...unicorn,
                  y: treeBottom,
                  onTree: false,
                  slidingDown: false
                };
              }
              
              // Продолжаем сползать вниз
              return {
                ...unicorn,
                y: newY,
                onTree: true,
                slidingDown: true
              };
            }
          }
          
          // Если пони попал на дерево при падении - начинает сползать
          if (hitTree) {
            const tTop = hitTree.treeTop;
            const tBottom = tTop + TREE_HEIGHT;
            const tStartX = hitTree.treeStartX;
            const tEndX = hitTree.side === 'left' ? tStartX + TREE_WIDTH : tStartX - TREE_WIDTH;
            
            // Ограничиваем позицию X, чтобы пони был на дереве
            const clampedX = hitTree.side === 'left'
              ? Math.max(tStartX, Math.min(tEndX, unicorn.x))
              : Math.min(tStartX, Math.max(tEndX, unicorn.x));
            
            // Ставим пони на верх дерева
            return {
              ...unicorn,
              y: tTop,
              x: clampedX,
              onTree: true,
              slidingDown: true,
              side: hitTree.side,
              treeTop: tTop,
              treeStartX: tStartX,
              treeNumber: hitTree.treeNumber
            };
          }
          
          // Проверяем, нужно ли начать убегать (упал ниже корзины)
          const currentBasketPosition = basketPositionRef.current;
          const basketLeft = currentBasketPosition - BASKET_WIDTH / 2;
          const basketRight = currentBasketPosition + BASKET_WIDTH / 2;
          const basketTop = 100 - BASKET_BOTTOM - BASKET_HEIGHT;
          const basketBottom = 100 - BASKET_BOTTOM;
          
          // Если единорог упал ниже корзины и не пойман - начинаем убегать
          if (!unicorn.runningAway && unicorn.y >= basketBottom) {
            // Устанавливаем пони на уровень пола и начинаем убегать
            const floorLevel = 100 - BASKET_BOTTOM; // Уровень пола (примерно 88%)
            return {
              ...unicorn,
              y: floorLevel,
              runningAway: true
            };
          }
          
          // Пони падает вертикально (не попал на дерево и не убегает)
          const newY = unicorn.y + 1.5;
          
          // Пони падает вертикально (не на дереве и не попал на дерево)
          return {
            ...unicorn,
            y: newY,
            onTree: false,
            slidingDown: false
          };
        }).filter(unicorn => {
          // Проверка столкновения с корзиной (используем ref для актуального значения)
          const currentBasketPosition = basketPositionRef.current;
          const basketLeft = currentBasketPosition - BASKET_WIDTH / 2;
          const basketRight = currentBasketPosition + BASKET_WIDTH / 2;
          // Персонаж находится примерно на 20% от низа экрана
          const basketTop = 100 - BASKET_BOTTOM - BASKET_HEIGHT;
          const basketBottom = 100 - BASKET_BOTTOM;

          // Если единорог в зоне корзины - пойман
          if (!unicorn.runningAway && unicorn.y >= basketTop && unicorn.y <= basketBottom) {
            if (unicorn.x >= basketLeft && unicorn.x <= basketRight) {
              // Пойман единорог
              setScore(prev => prev + 1);
              return false; // удаляем единорога
            }
          }

          // Если единорог упал ниже корзины и начал убегать - отнимаем жизнь
          if (unicorn.runningAway) {
            // Проверяем, не отнял ли уже этот пони жизнь (по ID)
            if (!processedUnicornsRef.current.has(unicorn.id)) {
              livesLost++; // Увеличиваем счетчик потерянных жизней
              // Помечаем пони, чтобы он не отнял жизнь повторно
              processedUnicornsRef.current.add(unicorn.id);
            }
            
            // Удаляем единорогов, которые убежали за экран (влево или вправо)
            return unicorn.x > -10 && unicorn.x < 110; // Оставляем небольшой запас
          }

          // Удаляем единорогов, которые упали за экран сверху
          return unicorn.y < 100;
        });
        
        // Отнимаем жизни после обработки всех пони (только один раз за кадр)
        if (livesLost > 0) {
          // Удаляем ID обработанных пони из отслеживания (они уже удалены)
          // Очищаем старые ID (старше 5 секунд) чтобы не накапливать память
          const now = Date.now();
          if (processedUnicornsRef.current.size > 100) {
            processedUnicornsRef.current.clear();
          }
          
          setLives(prev => {
            const newLives = Math.max(0, prev - livesLost); // Отнимаем все потерянные жизни
            return newLives;
          });
        }
        
        return updated;
      });
    }, 50); // обновление каждые 50мс

    return () => clearInterval(interval);
  }, [gameStarted, gameOver]); // Убрали basketPosition из зависимостей - он не влияет на движение пони
  
  // Отдельный эффект для проверки окончания игры когда жизни = 0
  useEffect(() => {
    if (lives <= 0 && gameStarted && !gameOver) {
      setGameOver(true);
    }
  }, [lives, gameStarted, gameOver]);

  // Создание новых единорогов
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(() => {
      createUnicorn();
    }, 1500); // новый единорог каждые 1.5 секунды

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, createUnicorn]);

  // Отслеживание движения персонажа
  const movementTimeoutRef = useRef(null);
  const isMovingRef = useRef(false);
  const currentDirectionRef = useRef('idle');

  const handleMoveLeft = useCallback(() => {
    isMovingRef.current = true;
    currentDirectionRef.current = 'left';
    setIsMoving(true);
    setDirection('left');
    // Увеличиваем границы движения, чтобы персонаж не уходил за экран
    // Учитываем ширину персонажа (примерно 9% от ширины экрана)
    setBasketPosition(prev => {
      const newPos = prev - 5;
      // Минимальная позиция: половина ширины персонажа от левого края
      return Math.max(9, newPos);
    });
    
    // Сбрасываем таймер если он уже есть
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }
    
    // Устанавливаем таймер для остановки движения только если движение действительно остановилось
    movementTimeoutRef.current = setTimeout(() => {
      // Проверяем, что движение действительно остановилось
      if (!isMovingRef.current || currentDirectionRef.current !== 'left') {
        setIsMoving(false);
        setDirection('idle');
      }
    }, 200);
  }, []);

  const handleMoveRight = useCallback(() => {
    isMovingRef.current = true;
    currentDirectionRef.current = 'right';
    setIsMoving(true);
    setDirection('right');
    // Увеличиваем границы движения, чтобы персонаж не уходил за экран
    // Учитываем ширину персонажа (примерно 9% от ширины экрана)
    setBasketPosition(prev => {
      const newPos = prev + 5;
      // Максимальная позиция: 100% минус половина ширины персонажа
      return Math.min(91, newPos);
    });
    
    // Сбрасываем таймер если он уже есть
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }
    
    // Устанавливаем таймер для остановки движения только если движение действительно остановилось
    movementTimeoutRef.current = setTimeout(() => {
      // Проверяем, что движение действительно остановилось
      if (!isMovingRef.current || currentDirectionRef.current !== 'right') {
        setIsMoving(false);
        setDirection('idle');
      }
    }, 200);
  }, []);

  const handleStopMoving = useCallback(() => {
    isMovingRef.current = false;
    currentDirectionRef.current = 'idle';
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
      movementTimeoutRef.current = null;
    }
    // Немедленно останавливаем движение без задержки
    setIsMoving(false);
    setDirection('idle');
  }, []);

  const handleStart = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(5); // Сбрасываем жизни
    setUnicorns([]);
    // Убеждаемся, что персонаж начинается в центре
    setBasketPosition(50);
    // Сбрасываем состояние движения
    setIsMoving(false);
    setDirection('idle');
    isMovingRef.current = false;
    currentDirectionRef.current = 'idle';
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
      movementTimeoutRef.current = null;
    }
  };

  const handleRestart = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLives(5); // Сбрасываем жизни
    setUnicorns([]);
    // Убеждаемся, что персонаж возвращается в центр
    setBasketPosition(50);
    // Сбрасываем состояние движения
    setIsMoving(false);
    setDirection('idle');
    isMovingRef.current = false;
    currentDirectionRef.current = 'idle';
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
      movementTimeoutRef.current = null;
    }
  };

  return (
    <div className="game-container">
      <div className="game-background">
        <Scene />
        
        {gameStarted && !gameOver && (
          <>
            {unicorns.map(unicorn => (
              <Unicorn key={unicorn.id} x={unicorn.x} y={unicorn.y} />
            ))}
            <Basket position={basketPosition} isMoving={isMoving} direction={direction} />
          </>
        )}

        {!gameStarted && (
          <div className="start-screen">
            <h1>Ловец Единорогов</h1>
            <p>Ловите падающих единорогов!</p>
            <button onClick={handleStart} className="start-button">
              Начать игру
            </button>
          </div>
        )}

        {gameOver && (
          <div className="game-over-screen">
            <h2>Игра окончена!</h2>
            <p>Ваш счет: {score}</p>
            <button onClick={handleRestart} className="restart-button">
              Играть снова
            </button>
          </div>
        )}

        {gameStarted && !gameOver && (
          <>
            <div className="lives">
              {Array.from({ length: 5 }).map((_, index) => (
                <span 
                  key={index} 
                  className={`heart ${index < lives ? 'active' : 'inactive'}`}
                >
                  ❤️
                </span>
              ))}
            </div>
            <div className="score">Счет: {score}</div>
          </>
        )}
      </div>

      {gameStarted && !gameOver && (
        <Controls 
          onMoveLeft={handleMoveLeft} 
          onMoveRight={handleMoveRight}
          onStopMoving={handleStopMoving}
        />
      )}
    </div>
  );
}

export default Game;

