document.addEventListener('DOMContentLoaded', () => {
    const flightsList = document.getElementById('flights-list');
    const searchForm = document.getElementById('flight-search');
    const seatsGrid = document.getElementById('seats-grid');
    const confirmButton = document.getElementById('confirm-seats');
    const flightInfo = document.getElementById('flight-info');
    
    // Get flight ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get('flightId');
    
    let selectedSeats = [];

    async function loadFlights() {
        try {
            const response = await fetch('/api/flights');
            if (!response.ok) {
                throw new Error('Failed to fetch flights');
            }
            const flights = await response.json();
            displayFlights(flights);
        } catch (error) {
            console.error('Error loading flights:', error);
            flightsList.innerHTML = '<p class="error">Lendude laadimine ebaõnnestus. Palun proovige uuesti.</p>';
        }
    }

    function displayFlights(flights) {
        if (!flights || flights.length === 0) {
            flightsList.innerHTML = '<p>Ühtegi lendu ei leitud.</p>';
            return;
        }

        const flightsHTML = flights.map(flight => `
            <li class="flight-card">
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
                <button onclick="window.location.href='/seatsPlan.html?flightId=${flight.id}'" class="select-btn">
                    Vali istekohad
                </button>
            </li>
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

    // Handle search form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent form from submitting normally
        
        const departure = document.getElementById('departure').value;
        const arrival = document.getElementById('arrival').value;
        const dateFrom = document.getElementById('dateFrom').value;
        const classType = document.getElementById('classType').value;

        // Build search parameters
        const params = new URLSearchParams();
        if (departure) params.append('origin', departure);
        if (arrival) params.append('destination', arrival);
        if (dateFrom) params.append('departureDate', dateFrom);
        if (classType) params.append('classType', classType);

        try {
            const response = await fetch(`/api/flights/search?${params}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            const flights = await response.json();
            displayFlights(flights);
        } catch (error) {
            console.error('Error searching flights:', error);
            flightsList.innerHTML = '<p class="error">Lendude otsimine ebaõnnestus. Palun proovige uuesti.</p>';
        }
    });

    function displayFlightInfo(flight) {
        flightInfo.innerHTML = `
            <h2>${flight.origin} → ${flight.destination}</h2>
            <p>Lend: ${flight.flightNumber}</p>
            <p>Väljumine: ${flight.departureTime}</p>
        `;
    }

    function renderSeats(seats) {
        seatsGrid.innerHTML = '';
        seats.forEach(seat => {
            const seatElement = document.createElement('div');
            seatElement.className = `seat ${seat.status}`;
            seatElement.textContent = seat.seatNumber;
            
            if (seat.status === 'available') {
                seatElement.addEventListener('click', () => toggleSeatSelection(seatElement, seat));
            }
            
            seatsGrid.appendChild(seatElement);
        });
    }

    function toggleSeatSelection(seatElement, seat) {
        if (seatElement.classList.contains('selected')) {
            seatElement.classList.remove('selected');
            selectedSeats = selectedSeats.filter(s => s !== seat.seatNumber);
        } else {
            seatElement.classList.add('selected');
            selectedSeats.push(seat.seatNumber);
        }
    }

    // Add event listener for seat selection buttons
    confirmButton.addEventListener('click', async () => {
        if (selectedSeats.length === 0) {
            alert('Palun vali vähemalt üks istekoht');
            return;
        }

        try {
            await api.bookSeats(flightId, selectedSeats);
            alert('Kohad broneeritud!');
            window.location.href = '/';
        } catch (error) {
            console.error('Error booking seats:', error);
            alert('Viga kohtade broneerimisel');
        }
    });

    async function loadSeats() {
        try {
            const seats = await api.getSeats(flightId);
            renderSeats(seats);
        } catch (error) {
            console.error('Error loading seats:', error);
        }
    }

    loadSeats();
});