// src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FlightDetails from './FlightDetails/FlightDetails';
import HomePage from './HomePage'; // Näidis avalehest (kui on vaja)

function App() {
  return (
    <Router>
      <Routes>
        {/* Lennu üksikasjade leht */}
        <Route path="/flights/:flightId" element={<FlightDetails />} />

        {/* Avaleht (näidis) */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;