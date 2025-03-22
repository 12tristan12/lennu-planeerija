document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing app...');
    
    const flightsList = document.getElementById('flights-list');
    const searchForm = document.getElementById('flight-search');
    const seatsGrid = document.getElementById('seats-grid');
    const preferencesForm = document.getElementById('seat-preferences-form');
    const confirmButton = document.getElementById('confirm-seats');
    const flightInfo = document.getElementById('flight-info');
    
    // Log found elements to verify DOM queries
    console.log('Found elements:', {
        flightsList: !!flightsList,
        searchForm: !!searchForm,
        seatsGrid: !!seatsGrid,
        preferencesForm: !!preferencesForm
    });

    // Get flight ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get('flightId');
    console.log('Current page info:', {
        path: window.location.pathname,
        flightId: flightId,
        params: Object.fromEntries(urlParams)
    });

    let selectedSeats = [];

    async function loadFlights() {
        console.log('Loading flights...'); // Debug log
        try {
            const flights = await api.getFlights();
            console.log('Flights received:', flights); // Debug log
            displayFlights(flights);
        } catch (error) {
            console.error('Error loading flights:', error);
            flightsList.innerHTML = '<p>Viga lendude laadimisel</p>';
        }
    }

    // Modify the select seats button click handler in displayFlights function
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
                <button onclick="window.location.href='/seatsPlan.html?flightId=${flight.id}&passengers=${document.getElementById('passengers').value || 1}'" class="select-btn">
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
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Search form submitted'); // Debug log
            
            const departure = document.getElementById('departure').value;
            const arrival = document.getElementById('arrival').value;
            const dateFrom = document.getElementById('dateFrom').value;
            const classType = document.getElementById('classType').value;
            const passengers = document.getElementById('passengers').value || 1;

            console.log('Search parameters:', { // Debug log
                departure,
                arrival,
                dateFrom,
                classType,
                passengers
            });

            if (!departure || !arrival || !dateFrom) {
                alert('Palun täitke kõik kohustuslikud väljad');
                return;
            }

            try {
                // First, get all flights
                const flights = await api.getFlights();
                console.log('All flights:', flights); // Debug log

                // Filter flights based on search criteria
                const filteredFlights = flights.filter(flight => 
                    flight.origin.toLowerCase() === departure.toLowerCase() &&
                    flight.destination.toLowerCase() === arrival.toLowerCase() &&
                    flight.departureTime.startsWith(dateFrom)
                );
                console.log('Filtered flights:', filteredFlights); // Debug log

                // Check seat availability
                const availableFlights = await Promise.all(
                    filteredFlights.map(async (flight) => {
                        const seats = await api.getSeats(flight.id);
                        const availableSeats = seats.filter(seat => {
                            if (!seat.isBooked) {
                                switch(classType) {
                                    case 'economy': return seat.isEconomyClass;
                                    case 'business': return seat.isBusinessClass;
                                    case 'first': return seat.isFirstClass;
                                    default: return true;
                                }
                            }
                            return false;
                        });

                        return availableSeats.length >= passengers ? {
                            ...flight,
                            availableSeats: availableSeats.length
                        } : null;
                    })
                );

                const finalFlights = availableFlights.filter(flight => flight !== null);
                console.log('Final available flights:', finalFlights); // Debug log

                displayFlights(finalFlights);
            } catch (error) {
                console.error('Error searching flights:', error);
                flightsList.innerHTML = '<p class="error">Lendude otsimine ebaõnnestus. Palun proovige uuesti.</p>';
            };
        });
    }

    function displayFlightInfo(flight) {
        flightInfo.innerHTML = `
            <h2>${flight.origin} → ${flight.destination}</h2>
            <p>Lend: ${flight.flightNumber}</p>
            <p>Väljumine: ${flight.departureTime}</p>
        `;
    }

    function renderSeats(seats, recommendedSeatNumbers = []) {
        console.log('Rendering seats with recommendations:', recommendedSeatNumbers);
        seatsGrid.innerHTML = '';
        
        // Group seats by row
        const seatRows = {};
        seats.forEach(seat => {
            const row = seat.seatNumber.replace(/[A-Z]/g, '');
            if (!seatRows[row]) {
                seatRows[row] = [];
            }
            seatRows[row].push(seat);
        });
        
        // Render seats row by row
        Object.keys(seatRows).sort((a, b) => a - b).forEach(row => {
            const rowElement = document.createElement('div');
            rowElement.className = 'seat-row';
            
            seatRows[row].forEach(seat => {
                const seatElement = document.createElement('div');
                const isRecommended = recommendedSeatNumbers.includes(seat.seatNumber);
                
                seatElement.className = `seat ${seat.isBooked ? 'occupied' : 'available'} ${isRecommended ? 'recommended' : ''}`;
                
                if (isRecommended) {
                    const index = recommendedSeatNumbers.indexOf(seat.seatNumber) + 1;
                    seatElement.setAttribute('title', `Soovitatud istekoht ${index}/${recommendedSeatNumbers.length}`);
                    console.log(`Marking seat ${seat.seatNumber} as recommended (${index}/${recommendedSeatNumbers.length})`);
                }
                
                seatElement.textContent = seat.seatNumber;
                seatElement.dataset.seatNumber = seat.seatNumber;
                
                if (!seat.isBooked) {
                    seatElement.addEventListener('click', () => toggleSeatSelection(seatElement, seat));
                }
                
                rowElement.appendChild(seatElement);
            });
            
            seatsGrid.appendChild(rowElement);
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
    if (confirmButton) {
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
    }

    async function loadSeats() {
        console.log('loadSeats function starting...');
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const passengers = parseInt(urlParams.get('passengers')) || 1;
            console.log('URL parameters:', { flightId, passengers });
            
            // Get all seats
            const seats = await api.getSeats(flightId);
            console.log('All seats loaded:', seats);
            
            // Get recommendations
            const recommendedSeats = await api.getRecommendedSeats(flightId, {
                passengers: passengers,
                windowSeat: false,
                extraLegroom: false,
                excludedSeats: []
            });
            console.log('Recommended seats:', recommendedSeats);

            // Extract seat numbers from recommended seats
            const recommendedSeatNumbers = recommendedSeats.map(seat => seat.seatNumber);
            console.log('Recommended seat numbers:', recommendedSeatNumbers);

            if (seatsGrid) {
                seatsGrid.style.display = 'block';
                renderSeats(seats, recommendedSeatNumbers); // Pass seat numbers, not objects
            }
        } catch (error) {
            console.error('Error in loadSeats:', error);
        }
    }

    async function filterAndDisplaySeats(preferences, flightId) {
        try {
            const seats = await api.getSeats(flightId);
            const numberOfPassengers = parseInt(document.getElementById('passengers').value) || 1;
            
            const recommendedSeats = await api.getRecommendedSeats(flightId, {
                passengers: numberOfPassengers,
                windowSeat: preferences.windowSeat,
                extraLegroom: preferences.extraLegroom,
                excludedSeats: []
            });
            
            console.log('Filtered recommended seats:', recommendedSeats);
            renderSeats(seats, recommendedSeats);
        } catch (error) {
            console.error('Error filtering seats:', error);
        }
    }

    // Initialize seats only if we're on the seats page
    if (window.location.pathname.includes('seatsPlan.html') && flightId) {
        console.log('Initializing seats page with flightId:', flightId);
        loadSeats();
    }
        
    window.showSeatPreferencesModal = function(flightId) {
        const modal = document.getElementById('seat-preferences-modal');
        if (!modal) return;
           
        modal.style.display = "block";
        modal.dataset.flightId = flightId;

        const seatClass = document.getElementById('seatClass');
        const extraLegroomContainer = document.getElementById('extraLegroom-container');

        // Initial visibility of extra legroom option
        extraLegroomContainer.style.display = 
            seatClass.value === 'economy' ? 'block' : 'none';

        // Update visibility when seat class changes
        seatClass.onchange = function() {
            extraLegroomContainer.style.display = 
                this.value === 'economy' ? 'block' : 'none';
        };
    };

    // Update seat preferences form handler
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', async function(e) {
            e.preventDefault();
                        
            const preferences = {
                seatClass: document.getElementById('seatClass').value,
                extraLegroom: document.getElementById('extraLegroom').checked,
                windowSeat: document.getElementById('windowSeat').checked
            };
            
            const flightId = document.getElementById('seat-preferences-modal').dataset.flightId;
            await filterAndDisplaySeats(preferences, flightId);
            document.getElementById('seat-preferences-modal').style.display = "none";
            
            // Show seats grid after filtering
            document.getElementById('seats-grid').style.display = 'block';
        });
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('seat-preferences-modal');
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    // Initial load of flights
    if (flightsList && !flightId) {
        loadFlights();
    }
});