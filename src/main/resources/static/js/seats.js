document.addEventListener('DOMContentLoaded', () => {
    const seatsGrid = document.getElementById('seats-grid');
    const confirmButton = document.getElementById('confirm-seats');
    const flightInfo = document.getElementById('flight-info');
    
    const urlParams = new URLSearchParams(window.location.search);
    const flightId = urlParams.get('flightId');
    console.log('Flight ID:', flightId); // Debug log
    
    let selectedSeats = [];

    // Initialize by loading flight info and seats
    async function initialize() {
        try {
            const flightDetails = await api.getFlightDetails(flightId);
            console.log('Flight details:', flightDetails); // Debug log
            displayFlightInfo(flightDetails);
            await generateSeats();
        } catch (error) {
            console.error('Error initializing seat plan:', error);
        }
    }

    function displayFlightInfo(flight) {
        flightInfo.innerHTML = `
            <h2>${flight.origin} → ${flight.destination}</h2>
            <p>Lend: ${flight.flightNumber}</p>
            <p>Väljumine: ${flight.departureTime}</p>
        `;
    }

    // Generate seat layout
    async function generateSeats() {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        const numRows = 20;

        try {
            // Get seats data from backend
            const seatStatus = await api.getSeats(flightId);
            console.log('Seat status from backend:', seatStatus);

            seatsGrid.innerHTML = '';
            
            // Create header row
            const headerRow = document.createElement('div');
            headerRow.className = 'seat-row header';
            headerRow.innerHTML = '<div class="row-number"></div>' + 
                rows.map(letter => `<div class="seat-letter">${letter}</div>`).join('');
            seatsGrid.appendChild(headerRow);

            // Generate seats
            for (let i = 1; i <= numRows; i++) {
                const row = document.createElement('div');
                row.className = 'seat-row';
                
                const rowNum = document.createElement('div');
                rowNum.className = 'row-number';
                rowNum.textContent = i;
                row.appendChild(rowNum);

                rows.forEach(letter => {
                    const seat = document.createElement('div');
                    const seatNumber = `${i}${letter}`;
                    const seatInfo = seatStatus.find(s => s.seatNumber === seatNumber);
                    const isOccupied = seatInfo?.isBooked || false;
                    
                    seat.className = `seat ${isOccupied ? 'occupied' : 'available'}`;
                    seat.dataset.seatNumber = seatNumber;
                    seat.textContent = seatNumber;
                    
                    if (!isOccupied) {
                        seat.addEventListener('click', () => toggleSeatSelection(seat));
                    }
                    row.appendChild(seat);
                });

                seatsGrid.appendChild(row);
            }
        } catch (error) {
            console.error('Error generating seats:', error);
            seatsGrid.innerHTML = '<p>Error loading seat plan. Please try again later.</p>';
        }
    }

    function toggleSeatSelection(seatElement) {
        if (seatElement.classList.contains('occupied')) return;
        
        const seatNumber = seatElement.dataset.seatNumber;
        if (seatElement.classList.contains('selected')) {
            seatElement.classList.remove('selected');
            selectedSeats = selectedSeats.filter(s => s !== seatNumber);
        } else {
            seatElement.classList.add('selected');
            selectedSeats.push(seatNumber);
        }
        console.log('Selected seats:', selectedSeats); // Debug log
    }

    confirmButton.addEventListener('click', async () => {
        if (selectedSeats.length === 0) {
            alert('Palun vali vähemalt üks istekoht');
            return;
        }

        try {
            console.log('Booking seats:', selectedSeats); // Debug log
            await api.bookSeats(flightId, selectedSeats);
            alert('Kohad edukalt broneeritud!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error booking seats:', error);
            alert('Viga kohtade broneerimisel');
        }
    });

    // Start initialization
    if (flightId) {
        initialize();
    } else {
        seatsGrid.innerHTML = '<p>Error: No flight ID provided</p>';
        console.error('No flight ID provided'); // Debug log
    }
});