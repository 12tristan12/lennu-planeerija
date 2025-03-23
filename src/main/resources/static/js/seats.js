document.addEventListener('DOMContentLoaded', async () => {
    const seatsGrid = document.getElementById('seatsGrid');
    const flightInfo = document.getElementById('flightInfo');
    const selectedSeatsList = document.getElementById('selectedSeats');
    const totalPriceElement = document.getElementById('totalPrice');
    const confirmButton = document.getElementById('confirmSeats');
    const selectedSeats = new Set();
    const recommendationControls = document.getElementById('recommendationControls');
    let currentFlightId = null;
    let allSeats = [];

    function getFlightIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const flightId = urlParams.get('flightId');
        return flightId;
    }

    async function initialize() {
        try {
            const flightId = getFlightIdFromUrl();
            if (!flightId) {
                throw new Error('No flight ID provided');
            }
            
            currentFlightId = flightId;
            const flight = await api.getFlightDetails(flightId);
            allSeats = await api.getSeats(flightId);
            
            displayFlightInfo(flight);
            generateSeats(allSeats);
            setupRecommendationControls();
        } catch (error) {
            console.error('Error initializing seat plan:', error);
            seatsGrid.innerHTML = '<p class="error">Error loading seat plan: ' + error.message + '</p>';
        }
    }

    function displayFlightInfo(flight) {
        flightInfo.innerHTML = `
            <div class="flight-header">
                <h2>${flight.origin} → ${flight.destination}</h2>
                <p class="flight-details">
                    <span>Lend: ${flight.airline}</span>
                    <span>Väljumine: ${formatDateTime(flight.departureTime)}</span>
                </p>
            </div>
        `;
    }

    function generateSeats(seatData) {
        if (!seatData || seatData.length === 0) {
            seatsGrid.innerHTML = '<p class="no-seats">No seats available for this flight.</p>';
            return;
        }

        const leftRows = ['A', 'B', 'C'];
        const rightRows = ['D', 'E', 'F'];
        const numRows = 20;

        seatsGrid.innerHTML = '';

        // Add class management controls
        const classManagement = document.createElement('div');
        classManagement.className = 'class-management';
        classManagement.innerHTML = `
            <div class="class-controls">
                <h3>Change Row Class:</h3>
                <div class="row-selector">
                    <label for="rowNumber">Row:</label>
                    <select id="rowNumber">
                        ${Array.from({length: numRows}, (_, i) => i + 1)
                            .map(num => `<option value="${num}">${num}</option>`)
                            .join('')}
                    </select>
                </div>
                <div class="class-selector">
                    <label>Set to class:</label>
                    <button id="setFirstClass" class="class-btn first">First</button>
                    <button id="setBusinessClass" class="class-btn business">Business</button>
                    <button id="setEconomyClass" class="class-btn economy">Economy</button>
                </div>
                <button id="applyClassChange" class="apply-btn">Apply Changes</button>
            </div>
            <div class="class-legend">
                <div class="legend-item"><span class="color-box first"></span> First Class</div>
                <div class="legend-item"><span class="color-box business"></span> Business Class</div>
                <div class="legend-item"><span class="color-box economy"></span> Economy Class</div>
                <div class="legend-item"><span class="color-box occupied"></span> Occupied</div>
                <div class="legend-item"><span class="color-box selected"></span> Selected</div>
            </div>
        `;
        seatsGrid.appendChild(classManagement);

        const headerRow = document.createElement('div');
        headerRow.className = 'seat-row header';
        headerRow.innerHTML = `
            <div class="row-number"></div>
            ${leftRows.map(letter => `<div class="seat-letter">${letter}</div>`).join('')}
            <div class="aisle"></div>
            ${rightRows.map(letter => `<div class="seat-letter">${letter}</div>`).join('')}
        `;
        seatsGrid.appendChild(headerRow);

        for (let i = 1; i <= numRows; i++) {
            const row = document.createElement('div');
            row.className = 'seat-row';
            row.innerHTML = `<div class="row-number">${i}</div>`;

            leftRows.forEach(letter => addSeat(row, i, letter, seatData));
            row.appendChild(document.createElement('div')).className = 'aisle';
            rightRows.forEach(letter => addSeat(row, i, letter, seatData));

            seatsGrid.appendChild(row);
        }

        // Add event listeners for class changes
        document.getElementById('applyClassChange').addEventListener('click', changeRowClass);
    }

    function addSeat(row, i, letter, seatData) {
        const seatNumber = `${i}${letter}`;
        const seatInfo = seatData.find(s => s.seatNumber === seatNumber);
        
        if (!seatInfo) {
            console.warn(`No seat info found for seat ${seatNumber}`);
            return;
        }

        const seat = document.createElement('div');
        seat.className = `seat ${seatInfo.isBooked ? 'occupied' : 'available'}`;
        
        // Add class-specific styling
        if (seatInfo.isFirstClass) {
            seat.classList.add('first');
        } else if (seatInfo.isBusinessClass) {
            seat.classList.add('business');
        } else if (seatInfo.isEconomyClass) {
            seat.classList.add('economy');
        }

        if (seatInfo.isWindowSeat) {
            seat.classList.add('window');
        }
        
        if (seatInfo.isExtraLegRoom) {
            seat.classList.add('extra-legroom');
        }
        
        seat.dataset.seatNumber = seatNumber;
        seat.dataset.price = seatInfo.price;
        seat.dataset.seatId = seatInfo.id;
        seat.dataset.isFirstClass = seatInfo.isFirstClass;
        seat.dataset.isBusinessClass = seatInfo.isBusinessClass;
        seat.dataset.isEconomyClass = seatInfo.isEconomyClass;

        seat.innerHTML = `
            <span class="seat-number">${seatNumber}</span>
            <span class="seat-price">${seatInfo.price}€</span>
        `;

        if (!seatInfo.isBooked) {
            seat.addEventListener('click', () => toggleSeatSelection(seat));
        }

        row.appendChild(seat);
    }

    function toggleSeatSelection(seat) {
        const seatNumber = seat.dataset.seatNumber;
        const price = parseFloat(seat.dataset.price);

        if (selectedSeats.has(seatNumber)) {
            selectedSeats.delete(seatNumber);
            seat.classList.remove('selected');
        } else {
            selectedSeats.add(seatNumber);
            seat.classList.add('selected');
        }

        updateSelectedSeatsDisplay();
    }

    function updateSelectedSeatsDisplay() {
        const seats = Array.from(selectedSeats);
        let totalPrice = 0;

        selectedSeatsList.innerHTML = seats.map(seatNumber => {
            const seat = document.querySelector(`[data-seat-number="${seatNumber}"]`);
            const price = parseFloat(seat.dataset.price);
            totalPrice += price;
            return `<li>${seatNumber} - ${price}€</li>`;
        }).join('');

        totalPriceElement.textContent = totalPrice.toFixed(2);
        confirmButton.disabled = seats.length === 0;
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

    // Function to change the class of an entire row
    async function changeRowClass() {
        try {
            const rowNumber = document.getElementById('rowNumber').value;
            let classData = {};
            
            // Determine which class button was last clicked
            const firstClassBtn = document.getElementById('setFirstClass');
            const businessClassBtn = document.getElementById('setBusinessClass');
            const economyClassBtn = document.getElementById('setEconomyClass');
            
            if (firstClassBtn.classList.contains('selected')) {
                classData.isFirstClass = true;
            } else if (businessClassBtn.classList.contains('selected')) {
                classData.isBusinessClass = true;
            } else if (economyClassBtn.classList.contains('selected')) {
                classData.isEconomyClass = true;
            } else {
                alert('Please select a class to apply');
                return;
            }
            
            // Show loading indicator
            const applyBtn = document.getElementById('applyClassChange');
            const originalText = applyBtn.textContent;
            applyBtn.textContent = 'Updating...';
            applyBtn.disabled = true;
            
            await api.updateSeatsByRow(currentFlightId, rowNumber, classData);
            
            // Refresh seat data after update
            allSeats = await api.getSeats(currentFlightId);
            generateSeats(allSeats);
            
            alert(`Row ${rowNumber} changed to ${Object.keys(classData)[0].replace('is', '')} class`);
        } catch (error) {
            console.error('Error changing row class:', error);
            alert('Error updating seat class. Please try again.');
        } finally {
            const applyBtn = document.getElementById('applyClassChange');
            applyBtn.textContent = 'Apply Changes';
            applyBtn.disabled = false;
        }
    }

    // Set up controls for recommendation system
    function setupRecommendationControls() {
        if (!recommendationControls) return;
        
        recommendationControls.innerHTML = `
            <div class="recommendation-form">
                <h3>Find Seat Recommendations</h3>
                <div class="form-group">
                    <label for="passengerCount">Number of Passengers:</label>
                    <input type="number" id="passengerCount" min="1" max="6" value="1">
                </div>
                <div class="form-group">
                    <label for="seatClass">Preferred Class:</label>
                    <select id="seatClass">
                        <option value="ECONOMY">Economy</option>
                        <option value="BUSINESS">Business</option>
                        <option value="FIRST">First</option>
                    </select>
                </div>
                <div class="form-group checkbox">
                    <input type="checkbox" id="windowSeat">
                    <label for="windowSeat">Window Seat</label>
                </div>
                <div class="form-group checkbox">
                    <input type="checkbox" id="extraLegroom">
                    <label for="extraLegroom">Extra Legroom</label>
                </div>
                <button id="getRecommendations" class="primary-btn">Get Recommendations</button>
            </div>
            <div id="recommendationResults" class="recommendation-results"></div>
        `;
        
        document.getElementById('getRecommendations').addEventListener('click', getRecommendedSeats);
    }

    // Function to get recommended seats
    async function getRecommendedSeats() {
        try {
            const params = {
                passengers: parseInt(document.getElementById('passengerCount').value),
                windowSeat: document.getElementById('windowSeat').checked,
                extraLegroom: document.getElementById('extraLegroom').checked,
                seatClass: document.getElementById('seatClass').value // Add seat class parameter
            };
            
            // Show loading state
            const button = document.getElementById('getRecommendations');
            button.textContent = 'Finding...';
            button.disabled = true;
            
            const recommendedSeats = await api.getRecommendedSeats(currentFlightId, params);
            
            // Clear any previous highlighting
            document.querySelectorAll('.seat.recommended').forEach(seat => {
                seat.classList.remove('recommended');
            });
            
            // Highlight recommended seats
            if (recommendedSeats.length > 0) {
                recommendedSeats.forEach(seat => {
                    const seatElement = document.querySelector(`.seat[data-seat-number="${seat.seatNumber}"]`);
                    if (seatElement) {
                        seatElement.classList.add('recommended');
                    }
                });
                
                // Show recommendation results
                const resultsDiv = document.getElementById('recommendationResults');
                resultsDiv.innerHTML = `
                    <h4>Recommended Seats</h4>
                    <p>We found ${recommendedSeats.length} seats that match your preferences:</p>
                    <ul>
                        ${recommendedSeats.map(seat => `
                            <li>${seat.seatNumber} - ${seat.price}€ 
                                (${seat.isFirstClass ? 'First' : seat.isBusinessClass ? 'Business' : 'Economy'} Class)
                            </li>
                        `).join('')}
                    </ul>
                    <button id="selectRecommended" class="secondary-btn">Select These Seats</button>
                `;
                
                // Add event listener to select recommended seats
                document.getElementById('selectRecommended').addEventListener('click', () => {
                    // Clear current selection
                    selectedSeats.clear();
                    document.querySelectorAll('.seat.selected').forEach(seat => {
                        seat.classList.remove('selected');
                    });
                    
                    // Select recommended seats
                    recommendedSeats.forEach(seat => {
                        const seatElement = document.querySelector(`.seat[data-seat-number="${seat.seatNumber}"]`);
                        if (seatElement && !seatElement.classList.contains('occupied')) {
                            seatElement.classList.add('selected');
                            selectedSeats.add(seat.seatNumber);
                        }
                    });
                    
                    updateSelectedSeatsDisplay();
                });
            } else {
                document.getElementById('recommendationResults').innerHTML = `
                    <p>No seats found matching your preferences. Try changing your criteria.</p>
                `;
            }
        } catch (error) {
            console.error('Error getting seat recommendations:', error);
            document.getElementById('recommendationResults').innerHTML = `
                <p class="error">Error getting recommendations: ${error.message}</p>
            `;
        } finally {
            // Reset button state
            const button = document.getElementById('getRecommendations');
            button.textContent = 'Get Recommendations';
            button.disabled = false;
        }
    }

    // Add event listeners to class buttons to make them selectable
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('class-btn')) {
            // Remove selected class from all buttons
            document.querySelectorAll('.class-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Add selected class to clicked button
            event.target.classList.add('selected');
        }
    });

    confirmButton.addEventListener('click', async () => {
        if (selectedSeats.size === 0) {
            alert('Palun vali vähemalt üks istekoht');
            return;
        }

        const flightId = getFlightIdFromUrl();
        const seatNumbers = Array.from(selectedSeats);

        try {
            await api.bookSeats(flightId, seatNumbers);
            alert('Kohad broneeritud!');
            window.location.href = '/';
        } catch (error) {
            console.error('Error booking seats:', error);
            alert('Viga kohtade broneerimisel');
        }
    });

    initialize();
});