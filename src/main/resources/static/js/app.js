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
                classType,  // Debug klassivalik
                passengers
            });

            if (!departure || !arrival || !dateFrom) {
                alert('Palun täitke kõik kohustuslikud väljad');
                return;
            }

            try {
                // Teisendame classType õigesse vormingusse
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
                
                // Lendude otsimine
                const flights = await api.getFlights();
                
                // Filtreerimine vastavalt parameetritele
                const filteredFlights = flights.filter(flight => 
                    flight.origin.toLowerCase() === departure.toLowerCase() &&
                    flight.destination.toLowerCase() === arrival.toLowerCase() &&
                    flight.departureTime.startsWith(dateFrom)
                );
                
                // Istmete kättesaadavuse kontroll
                const availableFlights = await Promise.all(
                    filteredFlights.map(async (flight) => {
                        const seats = await api.getSeats(flight.id);
                        const availableSeats = seats.filter(seat => {
                            if (!seat.isBooked) {
                                // Kasutame õigeid kontrollimise meetodeid vastavalt klassile
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
                
                // Lisame sessiooni storage'isse, et meeles pidada valitud klassi
                sessionStorage.setItem('selectedSeatClass', seatClassFormat);
                
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

    function renderSeats(seats, recommendedSeatNumbers) {
        if (!seatsGrid) return;
        
        // Puhastame eelmised soovitused
        seatsGrid.innerHTML = '';
        
        // Lisa legend
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

        // Organiseerime istmed ridade ja tähtede järgi
        const seatsByRow = {};
        seats.forEach(seat => {
            const seatNumber = seat.seatNumber;
            const row = seatNumber.replace(/[A-Za-z]/g, '');
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push(seat);
        });
        
        // Lisame pealkirja soovitatud istmete arvuga
        const header = document.createElement('div');
        header.className = 'seats-header';
        header.textContent = `Leitud ${recommendedSeatNumbers.length} soovitatud istekohta`;
        seatsGrid.appendChild(header);

        // Renderdame read
        const sortedRows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));
        sortedRows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';
            rowDiv.dataset.row = row;
            
            const rowLabel = document.createElement('div');
            rowLabel.className = 'row-label';
            rowLabel.textContent = row;
            rowDiv.appendChild(rowLabel);
            
            // Sorteeri istmed tähestikulises järjekorras
            const sortedSeats = seatsByRow[row].sort((a, b) => {
                const letterA = a.seatNumber.replace(/[0-9]/g, '');
                const letterB = b.seatNumber.replace(/[0-9]/g, '');
                return letterA.localeCompare(letterB);
            });
            
            // Lisa iga iste selgelt märgistatud soovitusega
            let lastSeatLetter = null;
            sortedSeats.forEach(seat => {
                const seatLetter = seat.seatNumber.replace(/[0-9]/g, '');
                
                // Lisa vahekäik C ja D istmete vahele
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

    function toggleSeatSelection(seatElement, seat) {
        // Kontrolli, kas iste on juba valitud
        if (seatElement.classList.contains('selected')) {
            // Kui on valitud, siis eemaldame valiku
            seatElement.classList.remove('selected');
            selectedSeats = selectedSeats.filter(s => s !== seat.seatNumber);
        } else {
            // Kui pole valitud, lisame valiku, kuid jätame alles "recommended" klassi
            seatElement.classList.add('selected');
            selectedSeats.push(seat.seatNumber);
        }

        // Uuenda valitud istmete infot, kui see element on olemas
        updateSelectedSeatsInfo();
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

    // Muudame loadSeats funktsiooni, et võtta arvesse istme eelistusi ühe reisija puhul
    async function loadSeats() {
        console.log('loadSeats function starting...');
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const passengers = parseInt(urlParams.get('passengers')) || 1;
            
            // Üritame kõigepealt saada sessiooni storage'ist istmeklassi
            let seatClass = sessionStorage.getItem('selectedSeatClass');
            
            // Kui puudub, siis proovime URL-ist või kasutame ECONOMY vaikimisi
            if (!seatClass) {
                seatClass = (urlParams.get('seatClass') || 'ECONOMY').toUpperCase();
            }
            
            console.log('Using seat class from session/URL:', seatClass);
            
            // Seadistame ka UI vastavalt valitud klassile
            if (document.getElementById('seatClass')) {
                document.getElementById('seatClass').value = seatClass;
            }
            
            if (!flightId) {
                console.error('No flightId provided');
                return;
            }
            
            // Võtame kõik istmed
            const seats = await api.getSeats(flightId);
            console.log('All seats loaded:', seats.length);
            
            if (seats.length === 0) {
                console.warn('No seats found for this flight');
                return;
            }
            
            // Loeme eelistusi UI-st, kui reisijaid on ainult üks
            const windowSeat = passengers === 1 ? 
                (document.getElementById('windowSeat')?.checked || false) : 
                false;
            
            const extraLegroom = passengers === 1 ? 
                (document.getElementById('extraLegroom')?.checked || false) : 
                false;
            
            console.log('Preferences for 1 passenger:', { windowSeat, extraLegroom });
            
            // Saame soovitused koos istmeklassiga
            console.log('Requesting recommendations with class:', seatClass);
            const recommendedSeats = await api.getRecommendedSeats(flightId, {
                passengers: passengers,
                windowSeat: windowSeat, // Nüüd kasutab kasutaja eelistust
                extraLegroom: extraLegroom, // Nüüd kasutab kasutaja eelistust
                seatClass: seatClass,
                excludedSeats: []
            });
            console.log('Received recommended seats:', recommendedSeats.length);

            // Eraldame istmenumbrid soovitatud istmetest
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

    // Samuti muudame filterAndDisplaySeats funktsiooni
    async function filterAndDisplaySeats(preferences, flightId) {
        try {
            const seats = await api.getSeats(flightId);
            const numberOfPassengers = parseInt(document.getElementById('passengers').value) || 1;
            
            console.log('Getting seat recommendations with preferences:', preferences);
            
            // Teisendame istmeklassi suurtähtedeks ja teeme kindlaks, et see on üks kolmest õigest väärtusest
            const validClass = preferences.seatClass.toUpperCase();
            const seatClass = ['ECONOMY', 'BUSINESS', 'FIRST'].includes(validClass) ? validClass : 'ECONOMY';
            
            // Kasutame windowSeat ja extraLegroom ainult siis, kui on üks reisija
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
            
            // Eraldame istmenumbrid soovitatud istmetest
            const recommendedSeatNumbers = recommendedSeats.map(seat => seat.seatNumber);
            console.log('Recommended seat numbers:', recommendedSeatNumbers);
            
            // Anname edasi istmenumbrid, mitte istmeobjektid
            renderSeats(seats, recommendedSeatNumbers);
        } catch (error) {
            console.error('Error filtering seats:', error);
            alert('Viga istekohtade filtreerimisel: ' + error.message);
        }
    }

    // Initialize seats only if we're on the seats page
    if (window.location.pathname.includes('seatsPlan.html') && flightId) {
        console.log('Initializing seats page with flightId:', flightId);
        loadSeats();
    }
        
    // **ÜHTLUSTATUD** modaali ja istmeklassi käsitlemine
    window.showSeatPreferencesModal = function(flightId) {
        const modal = document.getElementById('seat-preferences-modal');
        if (!modal) return;
           
        modal.style.display = "block";
        modal.dataset.flightId = flightId;

        // Eemaldame eelnevad tagasisided
        document.querySelectorAll('.filter-feedback').forEach(el => el.remove());
    };

    // **ÜHTLUSTATUD** istmeklassi muutmise käsitlemine - ainult üks event listener
    if (document.getElementById('seatClass')) {
        document.getElementById('seatClass').addEventListener('change', function() {
            console.log("Istmeklass muudetud: " + this.value);
            
            const seatClass = this.value.toUpperCase();
            console.log("Valitud istmeklass: " + seatClass);
            
            // Muudame extraLegroom valikut vastavalt istmeklassile
            const extraLegroomContainer = document.getElementById('extraLegroom-container');
            if (extraLegroomContainer) {
                extraLegroomContainer.style.display = 
                    seatClass === 'ECONOMY' ? 'block' : 'none';
            }
            
            // Anname kasutajale teada, et muudatuste rakendamiseks tuleb klikkida "Filtreeri" nupule
            const modal = document.getElementById('seat-preferences-modal');
            if (modal && modal.style.display === "block") {
                // Eemaldame vanad teated
                document.querySelectorAll('.class-change-message').forEach(el => el.remove());
                
                // Lisame uue teate
                const message = document.createElement('div');
                message.className = 'class-change-message';
                message.textContent = "Klikki 'Filtreeri' nuppu, et näha " + seatClass + " klassi istmeid";
                message.style.color = '#4080c0';
                message.style.marginTop = '10px';
                
                const formActions = modal.querySelector('.form-actions') || modal.querySelector('form');
                formActions?.appendChild(message);
                
                // Eemaldame sõnumi mõne sekundi pärast
                setTimeout(() => message.remove(), 5000);
            }
        });
    }

    // **ÜHTLUSTATUD** preferences vormi submit handler - ainult üks event listener
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const modal = document.getElementById('seat-preferences-modal');
            const seatClassElement = document.getElementById('seatClass');
            const extraLegroomElement = document.getElementById('extraLegroom');
            const windowSeatElement = document.getElementById('windowSeat');
            const passengersElement = document.getElementById('passengers');
            
            // Kontrolli, et elemendid leiti
            if (!modal || !seatClassElement) {
                console.error("Ei leia vajalikke elemente");
                return;
            }
            
            const flightId = modal.dataset.flightId;
            const seatClass = seatClassElement.value;
            const numberOfPassengers = parseInt(passengersElement?.value || 1);
            
            // Veendu, et checkboxide väärtused on tõesti booleanid
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
                extraLegroom: useExtraLegroom,  // Kindlustame et see on boolean
                windowSeat: useWindowSeat,      // Kindlustame et see on boolean
                passengers: numberOfPassengers
            };

            console.log("API-sse saadetavad eelistused:", preferences);
            
            try {
                // Näitame kasutajale, et toimub laadimine
                const loadingMsg = document.createElement('div');
                loadingMsg.className = 'loading-message';
                loadingMsg.textContent = 'Filtreerin istmeid...';
                modal.appendChild(loadingMsg);
                
                // Teeme API päringu ja uuendame istemete vaadet
                await filterAndDisplaySeats(preferences, flightId);
                
                // Eemaldame laadimissõnumi
                loadingMsg.remove();
                modal.style.display = "none";
                
                // Kuvame istmeplaani
                if (seatsGrid) {
                    seatsGrid.style.display = 'block';
                }
            } catch (error) {
                console.error("Viga istmete filtreerimisel:", error);
                alert("Probleem istmete filtreerimisel: " + error.message);
            }
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

    // Peida istmeklassi nupp istmeplaani lehel
    if (window.location.pathname.includes('seatsPlan.html')) {
        // Peida istmeklassi nupp päises (kui see on seal)
        const seatClassBtn = document.querySelector('.seat-class-btn');
        if (seatClassBtn) {
            seatClassBtn.style.display = 'none';
        }
        
        // Peida ka istmeklassi valikuga seotud elemendid, kui need on lehel
        const seatClassSection = document.querySelector('.seat-class-section');
        if (seatClassSection) {
            seatClassSection.style.display = 'none';
        }
    }
});

// Lisa see kood, et filtreerimise nupp töötaks õigesti
document.addEventListener('DOMContentLoaded', function() {
    // Peida istmeklassi valik istmeplaani lehel
    if (document.body.getAttribute('data-page') === 'seats-plan') {
        const seatClassGroup = document.querySelector('.form-group:has(#seatClass)');
        if (seatClassGroup) {
            seatClassGroup.style.display = 'none';
        }
        
        // Lisa flightId muutuja HTMLi
        const urlParams = new URLSearchParams(window.location.search);
        const flightId = urlParams.get('flightId');
        
        // Lisa onclick handler filtreerimise nupule
        const filterBtn = document.querySelector('.filter-seats-btn');
        if (filterBtn) {
            filterBtn.onclick = function() {
                showSeatPreferencesModal(flightId);
            };
        }
    }
});

function createSeatElement(seat, isRecommended) {
    const seatDiv = document.createElement('div');
    
    // Määra peamine klass istme oleku järgi - ainult available/booked
    seatDiv.className = seat.isBooked 
        ? 'seat booked' 
        : 'seat available';
    
    // Lisa recommended märgistus ilma valimata
    if (isRecommended && !seat.isBooked) {
        seatDiv.classList.add('recommended');
        // Lisa tärnike või märk soovitusena
        const recommendedIcon = document.createElement('span');
        recommendedIcon.className = 'recommendation-icon';
        recommendedIcon.textContent = '★';
        seatDiv.appendChild(recommendedIcon);
    }
    
    // Lisa istmeklassi stiil
    if (seat.isFirstClass) {
        seatDiv.classList.add('first-class');
    } else if (seat.isBusinessClass) {
        seatDiv.classList.add('business-class');
    } else if (seat.isEconomyClass) {
        seatDiv.classList.add('economy-class');
    }
    
    // Lisa lisaomadused
    if (seat.isWindowSeat) {
        seatDiv.classList.add('window-seat');
    }
    
    if (seat.isExtraLegRoom) {
        seatDiv.classList.add('extra-legroom');
    }
    
    // Loo sisu konteiner istme numbri jaoks
    const seatNumber = document.createElement('span');
    seatNumber.textContent = seat.seatNumber;
    seatDiv.appendChild(seatNumber);
    
    // Lisa klikkimise sündmus ainult vabadele istmetele
    if (!seat.isBooked) {
        seatDiv.addEventListener('click', () => {
            toggleSeatSelection(seatDiv, seat);
        });
    }
    
    return seatDiv;
}

// Parenda toggleSeatSelection funktsiooni
function toggleSeatSelection(seatElement, seat) {
    // Kontrolli, kas iste on juba valitud
    if (seatElement.classList.contains('selected')) {
        // Kui on valitud, siis eemaldame valiku
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s !== seat.seatNumber);
    } else {
        // Kui pole valitud, lisame valiku, kuid jätame alles "recommended" klassi
        seatElement.classList.add('selected');
        selectedSeats.push(seat.seatNumber);
    }

    // Uuenda valitud istmete infot, kui see element on olemas
    updateSelectedSeatsInfo();
}

// Lisa funktsioon istmete info uuendamiseks
function updateSelectedSeatsInfo() {
    const selectedSeatsElement = document.getElementById('selectedSeats');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (selectedSeatsElement) {
        // Uuendame valitud istmete nimekirja
        selectedSeatsElement.innerHTML = '';
        let totalPrice = 0;
        
        // Sorteeri istmed numbri järgi
        const sortedSeats = [...selectedSeats].sort();
        
        // Lisa iga valitud iste nimekirja
        sortedSeats.forEach(seatNumber => {
            const li = document.createElement('li');
            li.textContent = `Istekoht ${seatNumber}`;
            selectedSeatsElement.appendChild(li);
        });

        // Uuenda "Vali istekohad" nupu olekut
        const confirmButton = document.getElementById('confirm-seats');
        if (confirmButton) {
            confirmButton.disabled = selectedSeats.length === 0;
        }
    }
}

// Loome globaalse renderSeats funktsiooni, mida saab kasutada seatsPlan.html lehel
window.renderSeats = function(seats, recommendedSeatNumbers) {
    const seatsGrid = document.getElementById('seats-grid');
    if (!seatsGrid) return;
    
    // Puhastame eelmised soovitused
    seatsGrid.innerHTML = '';
    
    // Lisa legend
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
    
    // Lisame pealkirja soovitatud istmete arvuga
    const header = document.createElement('div');
    header.className = 'seats-header';
    header.textContent = `Leitud ${recommendedSeatNumbers.length} soovitatud istekohta`;
    seatsGrid.appendChild(header);

    // Organiseerime istmed ridade ja tähtede järgi
    const seatsByRow = {};
    seats.forEach(seat => {
        const seatNumber = seat.seatNumber;
        const row = seatNumber.replace(/[A-Za-z]/g, '');
        if (!seatsByRow[row]) {
            seatsByRow[row] = [];
        }
        seatsByRow[row].push(seat);
    });

    // Renderdame read
    const sortedRows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));
    sortedRows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        rowDiv.dataset.row = row;
        
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.textContent = row;
        rowDiv.appendChild(rowLabel);
        
        // Sorteeri istmed tähestikulises järjekorras
        const sortedSeats = seatsByRow[row].sort((a, b) => {
            const letterA = a.seatNumber.replace(/[0-9]/g, '');
            const letterB = b.seatNumber.replace(/[0-9]/g, '');
            return letterA.localeCompare(letterB);
        });
        
        // Lisa iga iste selgelt märgistatud soovitusega
        let lastSeatLetter = null;
        sortedSeats.forEach(seat => {
            const seatLetter = seat.seatNumber.replace(/[0-9]/g, '');
            
            // Lisa vahekäik C ja D istmete vahele
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

// Lisa see kood search-form submit handleri sisse:
document.getElementById('search-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Salvesta eelistused sessionStorage-isse
    const windowSeat = document.getElementById('windowSeat')?.checked || false;
    const extraLegroom = document.getElementById('extraLegroom')?.checked || false;
    const seatClass = document.getElementById('seatClass')?.value || 'ECONOMY';

    // Salvesta sessionStorage-isse, et neid saaks kasutada seatsPlan.html lehel
    sessionStorage.setItem('windowSeat', windowSeat.toString());
    sessionStorage.setItem('extraLegroom', extraLegroom.toString());
    sessionStorage.setItem('selectedSeatClass', seatClass);
    
    console.log("Salvestatud eelistused:", {
        windowSeat: windowSeat,
        extraLegroom: extraLegroom,
        seatClass: seatClass
    });
    
    // ...ülejäänud kood...
});