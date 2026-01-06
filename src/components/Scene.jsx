import './Scene.css';

function Scene() {
  return (
    <div className="scene">
      {/* Небо */}
      <div className="sky"></div>
      
      {/* Облака */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      
      {/* Деревья слева (2 штуки) */}
      <div className="tree tree-left tree-left-1">
        <img src="/drevo.png" alt="Дерево" className="tree-image" />
      </div>
      <div className="tree tree-left tree-left-2">
        <img src="/drevo.png" alt="Дерево" className="tree-image" />
      </div>
      
      {/* Деревья справа (2 штуки) - зеркально отражены */}
      <div className="tree tree-right tree-right-1">
        <img src="/drevo.png" alt="Дерево" className="tree-image mirrored" />
      </div>
      <div className="tree tree-right tree-right-2">
        <img src="/drevo.png" alt="Дерево" className="tree-image mirrored" />
      </div>
      
      {/* Пол/Трава */}
      <div className="grass"></div>
    </div>
  );
}

export default Scene;

