import { useEffect, useState } from 'react';
import FlightSeats from '../components/FlightSeats';
import './FlightSeats.css';

function FlightDetails({ flightId }) {
  const [flightDetails, setFlightDetails] = useState(null);


  useEffect(() => {
    fetch(`http://localhost:8080/api/flights/${flightId}`)
      .then(response => response.json())
      .then(data => setFlightDetails(data));
  }, [flightId]);

  return (
    <div>
      <h1>Lennu üksikasjad</h1>
      {flightDetails && (
        <div>
          <p>Lennufirma: {flightDetails.airline}</p>
          <p>Lähtekoht: {flightDetails.origin}</p>
        </div>
      )}
      <FlightSeats flightId={flightId} />
    </div>
  );
}

export default FlightDetails;