document.addEventListener('DOMContentLoaded', () => {
    const flightsList = document.getElementById('flights');
    const searchForm = document.getElementById('flight-search');

    // Load initial flights
    loadFlights();

    // Handle search form submission
    searchForm.addEventListener('submit', handleSearch);

    async function loadFlights() {
        try {
            const flights = await api.getAllFlights();
            displayFlights(flights);
        } catch (error) {
            console.error('Error loading flights:', error);
        }
    }

    async function handleSearch(event) {
        event.preventDefault();
        
        const formData = new FormData(searchForm);
        const searchData = {
            departure: formData.get('departure'),
            arrival: formData.get('arrival'),
            dateFrom: formData.get('dateFrom'),
            classType: formData.get('classType')
        };

        try {
            const flights = await api.searchFlights(searchData);
            displayFlights(flights);
        } catch (error) {
            console.error('Error searching flights:', error);
        }
    }
    
    function displayFlights(flights) {
        flightsList.innerHTML = '';
        flights.forEach(flight => {
            const li = document.createElement('li');
            li.className = 'flight-item';
            li.innerHTML = `
                <div class="flight-header">
                    <h3>${flight.airline}</h3>
                    <span class="flight-price">${flight.price}€</span>
                </div>
                <div class="flight-details">
                    <p><strong>From:</strong> ${flight.origin} (${flight.departureTime})</p>
                    <p><strong>To:</strong> ${flight.destination} (${flight.arrivalTime})</p>
                    <p><strong>Flight Number:</strong> ${flight.flightNumber}</p>
                    <button class="select-seats-btn" onclick="window.location.href='/flights/${flight.id}/seats'">
                        Vali kohad
                    </button>
                </div>
            `;
            flightsList.appendChild(li);
        });
    }
    
    // Add event listener for seat selection buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('select-seats-btn')) {
            const flightId = e.target.dataset.flightId;
            window.location.href = `/flights/${flightId}/seats`;
        }
    });
});