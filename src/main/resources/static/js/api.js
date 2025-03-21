const API_BASE_URL = 'http://localhost:8080/api';

const api = {
    async getFlights() {
        try {
            const response = await fetch(`${API_BASE_URL}/flights`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },

    async getFlightDetails(flightId) {
        try {
            const response = await fetch(`${API_BASE_URL}/flights/${flightId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },

    async getSeats(flightId) {
        try {
            const response = await fetch(`${API_BASE_URL}/flights/${flightId}/seats`);
            if (!response.ok) throw new Error('Failed to fetch seats');
            const seats = await response.json();
            return seats.map(seat => ({
                ...seat,
                isFirstClass: Boolean(seat.isFirstClass),
                isBusinessClass: Boolean(seat.isBusinessClass),
                isEconomyClass: Boolean(seat.isEconomyClass),
                isWindowSeat: Boolean(seat.isWindowSeat),
                isExtraLegRoom: Boolean(seat.isExtraLegRoom),
                isBooked: Boolean(seat.isBooked)
            }));
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },

    async bookSeats(flightId, seatNumbers) {
        try {
            const response = await fetch(`${API_BASE_URL}/flights/${flightId}/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ seatNumbers })
            });
            if (!response.ok) throw new Error('Failed to book seats');
            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }
};