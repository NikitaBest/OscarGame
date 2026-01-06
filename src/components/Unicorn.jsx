import './Unicorn.css';

function Unicorn({ x, y }) {
  return (
    <div 
      className="unicorn"
      style={{ 
        left: `${x}%`,
        top: `${y}%`
      }}
    >
      <img 
        src="/poni.png" 
        alt="Единорог" 
        className="unicorn-image"
      />
    </div>
  );
}

export default Unicorn;

