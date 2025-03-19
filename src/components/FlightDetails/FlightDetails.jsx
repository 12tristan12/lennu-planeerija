import React from 'react';
import FlightDetailsComponent from './FlightDetails'; 
import { useParams } from 'react-router-dom';

function FlightDetails() {
  const { flightId } = useParams(); // Loeb flightId URL-st

  return (
    <div>
      <h1>Lennu üksikasjad</h1>
      <FlightSeats flightId={flightId} />
    </div>
  );
}

export default FlightDetails;