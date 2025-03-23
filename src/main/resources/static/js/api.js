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
    
    // Kontrolli getRecommendedSeats funktsiooni
    async getRecommendedSeats(flightId, preferences) {
        const { passengers, windowSeat, extraLegroom, seatClass, excludedSeats } = preferences;
        
        // Lisame rohkem logimist
        console.log("API call getRecommendedSeats with clear details:", {
            flightId,
            passengerCount: passengers,
            windowSeatRequested: windowSeat, // === true? -> " + (windowSeat === true),
            extraLegroomRequested: extraLegroom, // === true? -> " + (extraLegroom === true),
            seatClass
        });
        
        try {
            const params = new URLSearchParams();
            params.append('passengerCount', passengers);
            
            // Kasutame selgelt true/false väärtuseid, mitte objekte
            params.append('windowSeat', Boolean(windowSeat).toString());
            params.append('extraLegroom', Boolean(extraLegroom).toString());
            params.append('seatClass', seatClass || 'ECONOMY');
            
            console.log("Request parameters:", {
                windowSeat: Boolean(windowSeat).toString(),
                extraLegroom: Boolean(extraLegroom).toString()
            });
            
            if (excludedSeats && excludedSeats.length > 0) {
                excludedSeats.forEach(seat => params.append('excludedSeats', seat));
            }
            
            const url = `/api/flights/${flightId}/recommended-seats?${params.toString()}`;
            console.log("Full API URL:", url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
            }
            
            const result = await response.json();
            console.log(`API returned ${result.length} seats, with window seats: ${result.filter(s => s.isWindowSeat).length}`);
            return result;
        } catch (error) {
            console.error("Error in getRecommendedSeats:", error);
            throw error;
        }
    },
    
    // Add method to update a single seat
    async updateSeat(flightId, seatId, seatData) {
        try {
            const response = await fetch(`${API_BASE_URL}/flights/${flightId}/seats/${seatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(seatData)
            });
            
            if (!response.ok) throw new Error('Failed to update seat');
            return await response.json();
        } catch (error) {
            console.error('API error updating seat:', error);
            throw error;
        }
    },
    
    // Add method to update seats by row
    async updateSeatsByRow(flightId, rowNumber, classData) {
        try {
            const queryParams = new URLSearchParams(classData);
            const response = await fetch(
                `${API_BASE_URL}/flights/${flightId}/seats/row/${rowNumber}?${queryParams}`, 
                { method: 'PUT' }
            );
            
            if (!response.ok) throw new Error('Failed to update seats');
            return await response.text();
        } catch (error) {
            console.error('API error updating seats by row:', error);
            throw error;
        }
    }
};

// Verify api object is created
console.log('API module loaded:', Object.keys(api));