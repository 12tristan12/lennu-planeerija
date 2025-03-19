import React, { useState, useEffect } from 'react';
import './FlightDetails.css';

function FlightSeats({ flightId }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Laadi kohad API-st
  useEffect(() => {
    fetch(`http://localhost:8080/api/flights/${flightId}/seats`)
      .then(response => {
        if (!response.ok) throw new Error('Viga andmete laadimisel');
        return response.json();
      })
      .then(data => {
        setSeats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [flightId]);

  // Broneeri koht
  const handleSeatClick = (seatNumber) => {
    fetch(`http://localhost:8080/api/flights/${flightId}/seats?seatNumber=${seatNumber}`, {
      method: 'POST',
    })
      .then(response => {
        if (response.ok) {
          // Uuenda kohtade olekut
          setSeats(seats.map(seat => 
            seat.seatNumber === seatNumber ? { ...seat, isBooked: true } : seat
          ));
          alert('Koht broneeritud!');
        } else {
          alert('Broneerimine ebaõnnestus');
        }
      });
  };

  if (loading) return <div className="loading">Laeb...</div>;
  if (error) return <div className="error">Viga: {error}</div>;

  return (
    <div className="seats-container">
      <h2>Vali koht</h2>
      <div className="seats-grid">
        {seats.map(seat => (
          <button
            key={seat.id}
            className={`seat ${seat.isBooked ? 'booked' : 'available'}`}
            onClick={() => handleSeatClick(seat.seatNumber)}
            disabled={seat.isBooked}
          >
            {seat.seatNumber}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FlightSeats;