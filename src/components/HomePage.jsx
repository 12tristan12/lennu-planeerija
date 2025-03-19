// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h1>Tere tulemast lennuplaneerijasse!</h1>
      <Link to="/flights/1">Vaata lennu nr 1 kohti</Link>
    </div>
  );
}

export default HomePage;