const API_BASE_URL = 'http://localhost:8080/api';

const api = {
    async getAllFlights() {
        try {
            const response = await fetch(`${API_BASE_URL}/flights`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching flights:', error);
            throw error;
        }
    },

    async getFlightDetails(flightId) {
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}`);
        return await response.json();
    },

    async getSeats(flightId) {
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}/seats`);
        if (!response.ok) {
            throw new Error('Failed to fetch seats');
        }
        const data = await response.json();
        console.log('API response:', data); // Debug log
        return data;
    },
    async bookSeats(flightId, seatNumbers) {
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}/seats/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ seatNumbers })
        });
        return await response.json();
    }
};