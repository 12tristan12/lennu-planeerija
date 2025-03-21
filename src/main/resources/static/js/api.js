const API_BASE_URL = 'http://localhost:8080/api';

const api = {
    async getFlights() {
        try {
            const response = await fetch('/api/flights');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const flights = await response.json();
            console.log('Loaded flights:', flights);
            return flights;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },

    async getFlightDetails(flightId) {
        try {
            const response = await fetch(`/api/flights/${flightId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const flight = await response.json();
            console.log('Flight details:', flight);
            return flight;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },

    async getSeats(flightId) {
        try {
            const response = await fetch(`/api/flights/${flightId}/seats`);
            if (!response.ok) {
                throw new Error('Failed to fetch seats');
            }
            const seats = await response.json();
            console.log('Loaded seats:', seats);
            return seats;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }
};