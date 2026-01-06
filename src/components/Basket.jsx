import './Basket.css';

function Basket({ position, isMoving, direction }) {
  // Определяем какое изображение показывать
  const getImageSrc = () => {
    if (isMoving) {
      return '/oscarrun.png';
    }
    return '/oscar.png';
  };

  // Определяем нужно ли зеркалить изображение
  const shouldMirror = isMoving && direction === 'right';

  return (
    <div 
      className="basket"
      style={{ left: `${position}%` }}
    >
      <div className="character-wrapper">
        <img 
          src={getImageSrc()} 
          alt="Персонаж" 
          className={`basket-character ${shouldMirror ? 'mirrored' : ''}`}
        />
      </div>
    </div>
  );
}

export default Basket;

