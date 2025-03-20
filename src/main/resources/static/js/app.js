document.addEventListener('DOMContentLoaded', () => {
    const flightsList = document.getElementById('flights');
    const searchForm = document.getElementById('flight-search');
    const seatsGrid = document.getElementById('seats-grid');
    const confirmButton = document.getElementById('confirm-seats');
    const flightInfo = document.getElementById('flight-info');
    
    // Get flight ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get('flightId');
    
    let selectedSeats = [];

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
        
        const departure = document.getElementById('departure').value;
        const arrival = document.getElementById('arrival').value;
        const dateFrom = document.getElementById('dateFrom').value;
        const classType = document.getElementById('classType').value;

        try {
            const flights = await api.getAllFlights();
            const filteredFlights = flights.filter(flight => {
                const matchDeparture = !departure || flight.origin.toLowerCase().includes(departure.toLowerCase());
                const matchArrival = !arrival || flight.destination.toLowerCase().includes(arrival.toLowerCase());
                const matchDate = !dateFrom || flight.departureTime.includes(dateFrom);
                const matchClass = !classType || flight.classType === classType;
                
                return matchDeparture && matchArrival && matchDate && matchClass;
            });
            
            displayFlights(filteredFlights);
        } catch (error) {
            console.error('Error searching flights:', error);
        }
    }

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
    function displayFlightInfo(flight) {
        flightInfo.innerHTML = `
            <h2>${flight.origin} → ${flight.destination}</h2>
            <p>Lend: ${flight.flightNumber}</p>
            <p>Väljumine: ${flight.departureTime}</p>
        `;
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
                    <button class="select-seats-btn" data-flight-id="${flight.id}">
                        Vali kohad
                    </button>
                </div>
            `;
            
            // Add click event listener to the button
            const selectSeatsBtn = li.querySelector('.select-seats-btn');
            selectSeatsBtn.addEventListener('click', () => {
                window.location.href = `seatsPlan.html?flightId=${flight.id}`;
            });
            
            flightsList.appendChild(li);
        });
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
    loadSeats();
});