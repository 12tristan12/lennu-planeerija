console.log('API module initializing...');

const API_BASE_URL = 'http://localhost:8080/api';

// Verify API_BASE_URL is accessible
try {
    fetch(`${API_BASE_URL}/test`)
        .then(response => console.log('API connection test:', response.ok))
        .catch(error => console.error('API connection test failed:', error));
} catch (error) {
    console.error('API initialization error:', error);
}

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
    },

    async getRecommendedSeats(flightId, params) {
        try {
            console.log('Requesting recommended seats with params:', params);
            
            const queryParams = new URLSearchParams({
                passengerCount: params.passengers.toString(),
                windowSeat: params.windowSeat.toString(),
                extraLegroom: params.extraLegroom.toString()
            });
            
            const url = `${API_BASE_URL}/flights/${flightId}/recommended-seats?${queryParams}`;
            console.log('Requesting URL:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to get recommendations: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received recommended seats:', data);
            return data;
        } catch (error) {
            console.error('Error getting recommended seats:', error);
            throw error;
        }
    }
};

// Verify api object is created
console.log('API module loaded:', Object.keys(api));