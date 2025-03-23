document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing app...');
    
    const flightsList = document.getElementById('flights-list');
    const searchForm = document.getElementById('flight-search');
    const seatsGrid = document.getElementById('seats-grid');
    const preferencesForm = document.getElementById('seat-preferences-form');
    const confirmButton = document.getElementById('confirm-seats');
    const flightInfo = document.getElementById('flight-info');
    
    console.log('Found elements:', {
        flightsList: !!flightsList,
        searchForm: !!searchForm,
        seatsGrid: !!seatsGrid,
        preferencesForm: !!preferencesForm
    });

    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get('flightId');
    console.log('Current page info:', {
        path: window.location.pathname,
        flightId: flightId,
        params: Object.fromEntries(urlParams)
    });

    let selectedSeats = [];

    // Alustamine
    async function loadFlights() {
        console.log('Loading flights...'); 
        try {
            const flights = await api.getFlights();
            console.log('Flights received:', flights); 
            displayFlights(flights);
        } catch (error) {
            console.error('Error loading flights:', error);
            flightsList.innerHTML = '<p>Viga lendude laadimisel</p>';
        }
    }

    // Näitamine
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

    // Vormistamine
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

    loadFlights();

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Search form submitted'); 
            
            const departure = document.getElementById('departure').value;
            const arrival = document.getElementById('arrival').value;
            const dateFrom = document.getElementById('dateFrom').value;
            const classType = document.getElementById('classType').value;
            const passengers = document.getElementById('passengers').value || 1;

            console.log('Search parameters:', {
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
                let seatClassFormat;
                switch(classType.toLowerCase()) {
                    case 'first':
                        seatClassFormat = 'FIRST';
                        break;
                    case 'business':
                        seatClassFormat = 'BUSINESS';
                        break;
                    default:
                        seatClassFormat = 'ECONOMY';
                }
                
                console.log("Otsingu klass teisendatud: " + seatClassFormat);
                
                const flights = await api.getFlights();
                
                const filteredFlights = flights.filter(flight => 
                    flight.origin.toLowerCase() === departure.toLowerCase() &&
                    flight.destination.toLowerCase() === arrival.toLowerCase() &&
                    flight.departureTime.startsWith(dateFrom)
                );
                
                const availableFlights = await Promise.all(
                    filteredFlights.map(async (flight) => {
                        const seats = await api.getSeats(flight.id);
                        const availableSeats = seats.filter(seat => {
                            if (!seat.isBooked) {
                                switch(seatClassFormat) {
                                    case 'FIRST': return seat.isFirstClass;
                                    case 'BUSINESS': return seat.isBusinessClass;
                                    case 'ECONOMY': return seat.isEconomyClass;
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
                console.log('Final available flights:', finalFlights);
                
                sessionStorage.setItem('selectedSeatClass', seatClassFormat);
                
                displayFlights(finalFlights);
            } catch (error) {
                console.error('Error searching flights:', error);
                flightsList.innerHTML = '<p class="error">Lendude otsimine ebaõnnestus. Palun proovige uuesti.</p>';
            };
        });
    }

    // Info
    function displayFlightInfo(flight) {
        flightInfo.innerHTML = `
            <h2>${flight.origin} → ${flight.destination}</h2>
            <p>Lend: ${flight.flightNumber}</p>
            <p>Väljumine: ${flight.departureTime}</p>
        `;
    }

    // Visualiseerimine
    function renderSeats(seats, recommendedSeatNumbers) {
        if (!seatsGrid) return;
        
        seatsGrid.innerHTML = '';
        
        const legendDiv = document.createElement('div');
        legendDiv.className = 'seat-legend';
        legendDiv.innerHTML = `
            <div class="seat-item">
                <div class="seat available"></div>
                <span>Vaba</span>
            </div>
            <div class="seat-item">
                <div class="seat booked"></div>
                <span>Broneeritud</span>
            </div>
            <div class="seat-item">
                <div class="seat available recommended"><span class="recommendation-icon">★</span></div>
                <span>Soovitatud</span>
            </div>
            <div class="seat-item">
                <div class="seat selected"></div>
                <span>Valitud</span>
            </div>
        `;
        seatsGrid.appendChild(legendDiv);
        
        console.log("Renderdame istmed, soovituslikud:", recommendedSeatNumbers);

        const seatsByRow = {};
        seats.forEach(seat => {
            const seatNumber = seat.seatNumber;
            const row = seatNumber.replace(/[A-Za-z]/g, '');
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push(seat);
        });
        
        const header = document.createElement('div');
        header.className = 'seats-header';
        header.textContent = `Leitud ${recommendedSeatNumbers.length} soovitatud istekohta`;
        seatsGrid.appendChild(header);

        const sortedRows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));
        sortedRows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';
            rowDiv.dataset.row = row;
            
            const rowLabel = document.createElement('div');
            rowLabel.className = 'row-label';
            rowLabel.textContent = row;
            rowDiv.appendChild(rowLabel);
            
            const sortedSeats = seatsByRow[row].sort((a, b) => {
                const letterA = a.seatNumber.replace(/[0-9]/g, '');
                const letterB = b.seatNumber.replace(/[0-9]/g, '');
                return letterA.localeCompare(letterB);
            });
            
            let lastSeatLetter = null;
            sortedSeats.forEach(seat => {
                const seatLetter = seat.seatNumber.replace(/[0-9]/g, '');
                
                if (lastSeatLetter === 'C' && seatLetter === 'D') {
                    const aisle = document.createElement('div');
                    aisle.className = 'seat-aisle';
                    rowDiv.appendChild(aisle);
                }
                
                const isRecommended = recommendedSeatNumbers.includes(seat.seatNumber);
                const seatDiv = createSeatElement(seat, isRecommended);
                rowDiv.appendChild(seatDiv);
                
                lastSeatLetter = seatLetter;
            });
            
            seatsGrid.appendChild(rowDiv);
        });
    }

    // Valimine
    function toggleSeatSelection(seatElement, seat) {
        if (seatElement.classList.contains('selected')) {
            seatElement.classList.remove('selected');
            selectedSeats = selectedSeats.filter(s => s !== seat.seatNumber);
        } else {
            seatElement.classList.add('selected');
            selectedSeats.push(seat.seatNumber);
        }

        updateSelectedSeatsInfo();
    }

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

    // Laadimine
    async function loadSeats() {
        console.log('loadSeats function starting...');
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const passengers = parseInt(urlParams.get('passengers')) || 1;
            
            let seatClass = sessionStorage.getItem('selectedSeatClass');
            
            if (!seatClass) {
                seatClass = (urlParams.get('seatClass') || 'ECONOMY').toUpperCase();
            }
            
            console.log('Using seat class from session/URL:', seatClass);
            
            if (document.getElementById('seatClass')) {
                document.getElementById('seatClass').value = seatClass;
            }
            
            if (!flightId) {
                console.error('No flightId provided');
                return;
            }
            
            const seats = await api.getSeats(flightId);
            console.log('All seats loaded:', seats.length);
            
            if (seats.length === 0) {
                console.warn('No seats found for this flight');
                return;
            }
            
            const windowSeat = passengers === 1 ? 
                (document.getElementById('windowSeat')?.checked || false) : 
                false;
            
            const extraLegroom = passengers === 1 ? 
                (document.getElementById('extraLegroom')?.checked || false) : 
                false;
            
            console.log('Preferences for 1 passenger:', { windowSeat, extraLegroom });
            
            console.log('Requesting recommendations with class:', seatClass);
            const recommendedSeats = await api.getRecommendedSeats(flightId, {
                passengers: passengers,
                windowSeat: windowSeat,
                extraLegroom: extraLegroom,
                seatClass: seatClass,
                excludedSeats: []
            });
            console.log('Received recommended seats:', recommendedSeats.length);

            const recommendedSeatNumbers = recommendedSeats.map(seat => seat.seatNumber);
            console.log('Recommended seat numbers:', recommendedSeatNumbers);

            if (seatsGrid) {
                seatsGrid.style.display = 'block';
                renderSeats(seats, recommendedSeatNumbers);
            } else {
                console.error('seatsGrid element not found');
            }
        } catch (error) {
            console.error('Error in loadSeats:', error);
        }
    }

    // Filtreerimine
    async function filterAndDisplaySeats(preferences, flightId) {
        try {
            const seats = await api.getSeats(flightId);
            const numberOfPassengers = parseInt(document.getElementById('passengers').value) || 1;
            
            console.log('Getting seat recommendations with preferences:', preferences);
            
            const validClass = preferences.seatClass.toUpperCase();
            const seatClass = ['ECONOMY', 'BUSINESS', 'FIRST'].includes(validClass) ? validClass : 'ECONOMY';
            
            const useWindowSeat = numberOfPassengers === 1 ? preferences.windowSeat : false;
            const useExtraLegroom = numberOfPassengers === 1 ? preferences.extraLegroom : false;
            
            console.log('Using seat preferences for recommendation:', {
                seatClass,
                passengers: numberOfPassengers,
                windowSeat: useWindowSeat,
                extraLegroom: useExtraLegroom
            });
            
            const recommendedSeats = await api.getRecommendedSeats(flightId, {
                passengers: numberOfPassengers,
                windowSeat: useWindowSeat,
                extraLegroom: useExtraLegroom,
                seatClass: seatClass,
                excludedSeats: []
            });
            
            console.log('Filtered recommended seats:', recommendedSeats.length);
            
            const recommendedSeatNumbers = recommendedSeats.map(seat => seat.seatNumber);
            console.log('Recommended seat numbers:', recommendedSeatNumbers);
            
            renderSeats(seats, recommendedSeatNumbers);
        } catch (error) {
            console.error('Error filtering seats:', error);
            alert('Viga istekohtade filtreerimisel: ' + error.message);
        }
    }

    if (window.location.pathname.includes('seatsPlan.html') && flightId) {
        console.log('Initializing seats page with flightId:', flightId);
        loadSeats();
    }
        
    window.showSeatPreferencesModal = function(flightId) {
        const modal = document.getElementById('seat-preferences-modal');
        if (!modal) return;
           
        modal.style.display = "block";
        modal.dataset.flightId = flightId;

        document.querySelectorAll('.filter-feedback').forEach(el => el.remove());
    };

    if (document.getElementById('seatClass')) {
        document.getElementById('seatClass').addEventListener('change', function() {
            console.log("Istmeklass muudetud: " + this.value);
            
            const seatClass = this.value.toUpperCase();
            console.log("Valitud istmeklass: " + seatClass);
            
            const extraLegroomContainer = document.getElementById('extraLegroom-container');
            if (extraLegroomContainer) {
                extraLegroomContainer.style.display = 
                    seatClass === 'ECONOMY' ? 'block' : 'none';
            }
            
            const modal = document.getElementById('seat-preferences-modal');
            if (modal && modal.style.display === "block") {
                document.querySelectorAll('.class-change-message').forEach(el => el.remove());
                
                const message = document.createElement('div');
                message.className = 'class-change-message';
                message.textContent = "Klikki 'Filtreeri' nuppu, et näha " + seatClass + " klassi istmeid";
                message.style.color = '#4080c0';
                message.style.marginTop = '10px';
                
                const formActions = modal.querySelector('.form-actions') || modal.querySelector('form');
                formActions?.appendChild(message);
                
                setTimeout(() => message.remove(), 5000);
            }
        });
    }

    if (preferencesForm) {
        preferencesForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const modal = document.getElementById('seat-preferences-modal');
            const seatClassElement = document.getElementById('seatClass');
            const extraLegroomElement = document.getElementById('extraLegroom');
            const windowSeatElement = document.getElementById('windowSeat');
            const passengersElement = document.getElementById('passengers');
            
            if (!modal || !seatClassElement) {
                console.error("Ei leia vajalikke elemente");
                return;
            }
            
            const flightId = modal.dataset.flightId;
            const seatClass = seatClassElement.value;
            const numberOfPassengers = parseInt(passengersElement?.value || 1);
            
            const useWindowSeat = numberOfPassengers === 1 && !!windowSeatElement?.checked;
            const useExtraLegroom = numberOfPassengers === 1 && !!extraLegroomElement?.checked;
            
            console.log("SELGELT DEFINEERITUD EELISTUSED:", {
                windowSeatElement: windowSeatElement,
                windowSeatChecked: windowSeatElement?.checked,
                boolWindowSeat: useWindowSeat,
                extraLegroomElement: extraLegroomElement,
                extraLegroomChecked: extraLegroomElement?.checked,
                boolExtraLegroom: useExtraLegroom
            });
                    
            const preferences = {
                seatClass: seatClass,
                extraLegroom: useExtraLegroom,
                windowSeat: useWindowSeat,     
                passengers: numberOfPassengers
            };

            console.log("API-sse saadetavad eelistused:", preferences);
            
            try {
                const loadingMsg = document.createElement('div');
                loadingMsg.className = 'loading-message';
                loadingMsg.textContent = 'Filtreerin istmeid...';
                modal.appendChild(loadingMsg);
                
                await filterAndDisplaySeats(preferences, flightId);
                
                loadingMsg.remove();
                modal.style.display = "none";
                
                if (seatsGrid) {
                    seatsGrid.style.display = 'block';
                }
            } catch (error) {
                console.error("Viga istmete filtreerimisel:", error);
                alert("Probleem istmete filtreerimisel: " + error.message);
            }
        });
    }

    window.onclick = function(event) {
        const modal = document.getElementById('seat-preferences-modal');
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    if (flightsList && !flightId) {
        loadFlights();
    }

    if (window.location.pathname.includes('seatsPlan.html')) {
        const seatClassBtn = document.querySelector('.seat-class-btn');
        if (seatClassBtn) {
            seatClassBtn.style.display = 'none';
        }
        
        const seatClassSection = document.querySelector('.seat-class-section');
        if (seatClassSection) {
            seatClassSection.style.display = 'none';
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (document.body.getAttribute('data-page') === 'seats-plan') {
        const seatClassGroup = document.querySelector('.form-group:has(#seatClass)');
        if (seatClassGroup) {
            seatClassGroup.style.display = 'none';
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const flightId = urlParams.get('flightId');
        
        const filterBtn = document.querySelector('.filter-seats-btn');
        if (filterBtn) {
            filterBtn.onclick = function() {
                showSeatPreferencesModal(flightId);
            };
        }
    }
});

// Loomine
function createSeatElement(seat, isRecommended) {
    const seatDiv = document.createElement('div');
    
    seatDiv.className = seat.isBooked 
        ? 'seat booked' 
        : 'seat available';
    
    if (isRecommended && !seat.isBooked) {
        seatDiv.classList.add('recommended');
        const recommendedIcon = document.createElement('span');
        recommendedIcon.className = 'recommendation-icon';
        recommendedIcon.textContent = '★';
        seatDiv.appendChild(recommendedIcon);
    }
    
    if (seat.isFirstClass) {
        seatDiv.classList.add('first-class');
    } else if (seat.isBusinessClass) {
        seatDiv.classList.add('business-class');
    } else if (seat.isEconomyClass) {
        seatDiv.classList.add('economy-class');
    }
    
    if (seat.isWindowSeat) {
        seatDiv.classList.add('window-seat');
    }
    
    if (seat.isExtraLegRoom) {
        seatDiv.classList.add('extra-legroom');
    }
    
    const seatNumber = document.createElement('span');
    seatNumber.textContent = seat.seatNumber;
    seatDiv.appendChild(seatNumber);
    
    if (!seat.isBooked) {
        seatDiv.addEventListener('click', () => {
            toggleSeatSelection(seatDiv, seat);
        });
    }
    
    return seatDiv;
}

// Valimine
function toggleSeatSelection(seatElement, seat) {
    if (seatElement.classList.contains('selected')) {
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s !== seat.seatNumber);
    } else {
        seatElement.classList.add('selected');
        selectedSeats.push(seat.seatNumber);
    }

    updateSelectedSeatsInfo();
}

// Uuendamine
function updateSelectedSeatsInfo() {
    const selectedSeatsElement = document.getElementById('selectedSeats');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (selectedSeatsElement) {
        selectedSeatsElement.innerHTML = '';
        let totalPrice = 0;
        
        const sortedSeats = [...selectedSeats].sort();
        
        sortedSeats.forEach(seatNumber => {
            const li = document.createElement('li');
            li.textContent = `Istekoht ${seatNumber}`;
            selectedSeatsElement.appendChild(li);
        });

        const confirmButton = document.getElementById('confirm-seats');
        if (confirmButton) {
            confirmButton.disabled = selectedSeats.length === 0;
        }
    }
}

window.renderSeats = function(seats, recommendedSeatNumbers) {
    const seatsGrid = document.getElementById('seats-grid');
    if (!seatsGrid) return;
    
    seatsGrid.innerHTML = '';
    
    const legendDiv = document.createElement('div');
    legendDiv.className = 'seat-legend';
    legendDiv.innerHTML = `
        <div class="seat-item">
            <div class="seat available"></div>
            <span>Vaba</span>
        </div>
        <div class="seat-item">
            <div class="seat booked"></div>
            <span>Broneeritud</span>
        </div>
        <div class="seat-item">
            <div class="seat available recommended"><span class="recommendation-icon">★</span></div>
            <span>Soovitatud</span>
        </div>
        <div class="seat-item">
            <div class="seat selected"></div>
            <span>Valitud</span>
        </div>
    `;
    seatsGrid.appendChild(legendDiv);
    
    const header = document.createElement('div');
    header.className = 'seats-header';
    header.textContent = `Leitud ${recommendedSeatNumbers.length} soovitatud istekohta`;
    seatsGrid.appendChild(header);

    const seatsByRow = {};
    seats.forEach(seat => {
        const seatNumber = seat.seatNumber;
        const row = seatNumber.replace(/[A-Za-z]/g, '');
        if (!seatsByRow[row]) {
            seatsByRow[row] = [];
        }
        seatsByRow[row].push(seat);
    });

    const sortedRows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));
    sortedRows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        rowDiv.dataset.row = row;
        
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.textContent = row;
        rowDiv.appendChild(rowLabel);
        
        const sortedSeats = seatsByRow[row].sort((a, b) => {
            const letterA = a.seatNumber.replace(/[0-9]/g, '');
            const letterB = b.seatNumber.replace(/[0-9]/g, '');
            return letterA.localeCompare(letterB);
        });
        
        let lastSeatLetter = null;
        sortedSeats.forEach(seat => {
            const seatLetter = seat.seatNumber.replace(/[0-9]/g, '');
            
            if (lastSeatLetter === 'C' && seatLetter === 'D') {
                const aisle = document.createElement('div');
                aisle.className = 'seat-aisle';
                rowDiv.appendChild(aisle);
            }
            
            const isRecommended = recommendedSeatNumbers.includes(seat.seatNumber);
            const seatDiv = createSeatElement(seat, isRecommended);
            rowDiv.appendChild(seatDiv);
            
            lastSeatLetter = seatLetter;
        });
        
        seatsGrid.appendChild(rowDiv);
    });
};

window.renderSeats = function(seats, recommendedSeatNumbers) {
    const createSeatElement = (seat, isRecommended) => {
        const seatDiv = document.createElement('div');
        seatDiv.className = seat.isBooked ? 'seat booked' : 'seat available';
        
        seatDiv.dataset.seatNumber = seat.seatNumber;
        
        if (isRecommended && !seat.isBooked) {
            seatDiv.classList.add('recommended');
            const star = document.createElement('span');
            star.className = 'recommendation-icon';
            star.textContent = '★';
            seatDiv.appendChild(star);
        }
        
        const seatNumber = document.createElement('span');
        seatNumber.className = 'seat-number';
        seatNumber.textContent = seat.seatNumber;
        seatDiv.appendChild(seatNumber);
        
        return seatDiv;
    };
}

document.getElementById('search-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const windowSeat = document.getElementById('windowSeat')?.checked || false;
    const extraLegroom = document.getElementById('extraLegroom')?.checked || false;
    const seatClass = document.getElementById('seatClass')?.value || 'ECONOMY';

    sessionStorage.setItem('windowSeat', windowSeat.toString());
    sessionStorage.setItem('extraLegroom', extraLegroom.toString());
    sessionStorage.setItem('selectedSeatClass', seatClass);
    
    console.log("Salvestatud eelistused:", {
        windowSeat: windowSeat,
        extraLegroom: extraLegroom,
        seatClass: seatClass
    });
});

window.renderSeats = function(seats, recommendedSeatNumbers) {
    const seatsGrid = document.getElementById('seats-grid');
    if (!seatsGrid) {
        console.error('Seats grid element not found');
        return;
    }
    
    const rowsMap = {};
    seats.forEach(seat => {
        if (!rowsMap[seat.row]) {
            rowsMap[seat.row] = [];
        }
        rowsMap[seat.row].push(seat);
    });
    
    const sortedRows = Object.keys(rowsMap).sort((a, b) => parseInt(a) - parseInt(b));
    
    seatsGrid.innerHTML = '';
    
    window.selectedSeats = window.selectedSeats || new Set();
    
    sortedRows.forEach(rowNum => {
        const row = rowsMap[rowNum];
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        
        row.sort((a, b) => a.col - b.col);
        
        row.forEach(seat => {
            const isRecommended = recommendedSeatNumbers && recommendedSeatNumbers.includes(seat.seatNumber);
            
            const seatDiv = document.createElement('div');
            seatDiv.className = seat.isBooked ? 'seat booked' : 'seat available';
            
            seatDiv.dataset.seatNumber = seat.seatNumber;
            
            if (isRecommended && !seat.isBooked) {
                seatDiv.classList.add('recommended');
                const star = document.createElement('span');
                star.className = 'recommendation-icon';
                star.textContent = '★';
                seatDiv.appendChild(star);
            }
            
            const seatNumber = document.createElement('span');
            seatNumber.className = 'seat-number';
            seatNumber.textContent = seat.seatNumber;
            seatDiv.appendChild(seatNumber);
            
            rowDiv.appendChild(seatDiv);
        });
        
        seatsGrid.appendChild(rowDiv);
    });
    
    console.log('Seats rendered successfully');
    
    setupSeatSelection();
};

// Seadistamine
function setupSeatSelection() {
    console.log('Setting up seat selection handlers');
    const seatsGrid = document.getElementById('seats-grid');
    const confirmButton = document.getElementById('confirm-seats');
    const selectedSeatsList = document.getElementById('selectedSeats');
    
    if (!seatsGrid || !confirmButton || !selectedSeatsList) {
        console.error('Missing required elements for seat selection');
        return;
    }
    
    window.selectedSeats = window.selectedSeats || new Set();
    
    const newSeatsGrid = seatsGrid.cloneNode(true);
    seatsGrid.parentNode.replaceChild(newSeatsGrid, seatsGrid);
    
    newSeatsGrid.addEventListener('click', function(e) {
        const seat = e.target.closest('.seat.available');
        if (!seat) return;
        
        const seatNumber = seat.dataset.seatNumber;
        
        if (seatNumber) {
            console.log('Clicked on seat:', seatNumber);
            
            if (seat.classList.contains('selected')) {
                seat.classList.remove('selected');
                window.selectedSeats.delete(seatNumber);
                console.log('Unselected seat:', seatNumber, 'Selected seats:', Array.from(window.selectedSeats));
            } else {
                seat.classList.add('selected');
                window.selectedSeats.add(seatNumber);
                console.log('Selected seat:', seatNumber, 'Selected seats:', Array.from(window.selectedSeats));
            }
            
            updateSelectedSeatsList();
            
            confirmButton.disabled = window.selectedSeats.size === 0;
            console.log('Button enabled:', !confirmButton.disabled);
        }
    });
    
    confirmButton.addEventListener('click', async function() {
        if (window.selectedSeats.size === 0) {
            alert('Palun vali vähemalt üks istekoht');
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const flightId = urlParams.get('flightId');
        const seatNumbers = Array.from(window.selectedSeats);
        
        try {
            console.log('Booking seats:', seatNumbers);
            await api.bookSeats(flightId, seatNumbers);
            alert('Istekohad on broneeritud!');
            window.location.href = '/';
        } catch (error) {
            console.error('Error booking seats:', error);
            alert('Viga istekohtade broneerimisel');
        }
    });
    
    console.log('Seat selection handlers set up successfully');
}

// Värskendamine
function updateSelectedSeatsList() {
    const selectedSeatsList = document.getElementById('selectedSeats');
    if (selectedSeatsList) {
        selectedSeatsList.innerHTML = Array.from(window.selectedSeats).map(seatNum => 
            `<li>${seatNum}</li>`
        ).join('');
    }
}

document.getElementById('flight-search').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const windowSeat = document.getElementById('windowSeat').checked;
    const extraLegroom = document.getElementById('extraLegroom').checked;
    const seatClass = document.getElementById('classType').value;
    const passengers = document.getElementById('passengers').value || '1';
    
    sessionStorage.setItem('windowSeat', windowSeat);
    sessionStorage.setItem('extraLegroom', extraLegroom);
    sessionStorage.setItem('selectedSeatClass', seatClass);
    sessionStorage.setItem('passengers', passengers);
    
    console.log('Saved preferences to sessionStorage:', { windowSeat, extraLegroom, seatClass, passengers });
});