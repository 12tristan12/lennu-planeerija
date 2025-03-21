document.addEventListener('DOMContentLoaded', () => {
    const flightsList = document.getElementById('flights-list');
    
    async function loadFlights() {
        try {
            const response = await fetch('/api/flights');
            if (!response.ok) {
                throw new Error('Failed to fetch flights');
            }
            const flights = await response.json();
            console.log('Loaded flights:', flights); // Debug log
            displayFlights(flights);
        } catch (error) {
            console.error('Error loading flights:', error);
            flightsList.innerHTML = '<p>Error loading flights. Please try again later.</p>';
        }
    }

    function displayFlights(flights) {
        if (!flights || flights.length === 0) {
            flightsList.innerHTML = '<p>No flights available.</p>';
            return;
        }

        const flightsHTML = flights.map(flight => `
            <div class="flight-card">
                <div class="flight-header">
                    <h3>${flight.airline}</h3>
                    <span class="flight-price">${flight.price}€</span>
                </div>
                <div class="flight-info">
                    <div class="route">
                        <span>${flight.origin}</span>
                        <span class="arrow">→</span>
                        <span>${flight.destination}</span>
                    </div>
                    <div class="times">
                        <div>Väljumine: ${formatDateTime(flight.departureTime)}</div>
                        <div>Saabumine: ${formatDateTime(flight.arrivalTime)}</div>
                    </div>
                </div>
                <button onclick="window.location.href='/seats.html?flightId=${flight.id}'" class="select-btn">
                    Vali kohad
                </button>
            </div>
        `).join('');

        flightsList.innerHTML = flightsHTML;
    }

    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return 'N/A';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('et-EE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Load flights when page loads
    loadFlights();
});