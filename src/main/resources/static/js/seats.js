document.addEventListener('DOMContentLoaded', async () => {
    const seatsGrid = document.getElementById('seatsGrid');
    const flightInfo = document.getElementById('flightInfo');
    const selectedSeatsList = document.getElementById('selectedSeats');
    const totalPriceElement = document.getElementById('totalPrice');
    const confirmButton = document.getElementById('confirmSeats');
    const selectedSeats = new Set();

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

            const flight = await api.getFlightDetails(flightId);
            const seats = await api.getSeats(flightId);
            
            displayFlightInfo(flight);
            generateSeats(seats);
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
        seat.dataset.seatNumber = seatNumber;
        seat.dataset.price = seatInfo.price;

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