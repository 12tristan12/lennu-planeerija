document.addEventListener('DOMContentLoaded', () => {
    const flightsList = document.getElementById('flights-list');
    const searchForm = document.getElementById('flight-search');
    const seatsGrid = document.getElementById('seats-grid');
    const preferencesForm = document.getElementById('seat-preferences-form');
    const confirmButton = document.getElementById('confirm-seats');
    const flightInfo = document.getElementById('flight-info');
    
    // Get flight ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get('flightId');
    
    let selectedSeats = [];

    async function loadFlights() {
        try {
            const flights = await api.getFlights();
            displayFlights(flights);
        } catch (error) {
            console.error('Error loading flights:', error);
            flightsList.innerHTML = '<p>Viga lendude laadimisel</p>';
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
            seatElement.className = `seat ${seat.isBooked ? 'occupied' : 'available'}`;
            seatElement.textContent = seat.seatNumber;
            seatElement.dataset.seatNumber = seat.seatNumber;
            
            if (!seat.isBooked) {
                seatElement.addEventListener('click', () => toggleSeatSelection(seatElement, seat));
            }
            
            // Update data attributes to match Java names
            seatElement.dataset.isFirstClass = seat.isFirstClass;
            seatElement.dataset.isBusinessClass = seat.isBusinessClass;
            seatElement.dataset.isEconomyClass = seat.isEconomyClass;
            seatElement.dataset.isWindowSeat = seat.isWindowSeat;
            seatElement.dataset.isExtraLegRoom = seat.isExtraLegRoom;
            
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

    async function filterAndDisplaySeats(preferences, flightId) {
        try {
            const seats = await api.getSeats(flightId);
            const filteredSeats = seats.filter(seat => {
                // Match the Java class property names
                if (preferences.seatClass === 'economy' && !seat.isEconomyClass) {
                    return false;
                }
                if (preferences.seatClass === 'business' && !seat.isBusinessClass) {
                    return false;
                }
                if (preferences.seatClass === 'first' && !seat.isFirstClass) {
                    return false;
                }
                if (preferences.windowSeat && !seat.isWindowSeat) {
                    return false;
                }
                if (preferences.extraLegroom && !seat.isExtraLegRoom) {
                    return false;
                }
                return !seat.isBooked; // Use isBooked instead of status
            });

            // Sort seats by preference matching
            const sortedSeats = filteredSeats.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;

                if (preferences.windowSeat) {
                    scoreA += a.isWindowSeat ? 1 : 0;
                    scoreB += b.isWindowSeat ? 1 : 0;
                }
                if (preferences.extraLegroom && preferences.seatClass === 'economy') {
                    scoreA += a.isExtraLegRoom ? 1 : 0;
                    scoreB += b.isExtraLegRoom ? 1 : 0;
                }

                return scoreB - scoreA;
            });

            renderSeats(sortedSeats);
            
            // Highlight recommended seats
            if (sortedSeats.length > 0) {
                highlightRecommendedSeats(sortedSeats.slice(0, 3)); // Highlight top 3 recommendations
            }
        } catch (error) {
            console.error('Error filtering seats:', error);
        }
    }

    function highlightRecommendedSeats(recommendedSeats) {
        recommendedSeats.forEach((seat, index) => {
            const seatElement = document.querySelector(`[data-seat-number="${seat.seatNumber}"]`);
            if (seatElement) {
                seatElement.classList.add('recommended');
                seatElement.setAttribute('title', `Soovitatud istekoht #${index + 1}`);
            }
        });
    }

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
});