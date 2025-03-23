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
    // Andmepäring lendude kuvamiseks kasutajaliideses
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
    
    // Lennu üksikasjalik info kuvamiseks broneerimislehel
    async getFlightDetails(flightId) {
        try {
            const response = await fetch(`${API_BASE_URL}/flights/${flightId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },
    
    // Istekohtade andmete hankimine lennuplaani kuvamiseks
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
    
    // Istekohtade broneerimine kasutaja valikute salvestamiseks
    async bookSeats(flightId, seatNumbers) {
        console.log(`Booking seats for flight ${flightId}:`, seatNumbers);
        
        try {
            const bookingPromises = seatNumbers.map(seatNumber => 
                fetch(`${API_BASE_URL}/flights/${flightId}/seats?seatNumber=${seatNumber}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            );
            
            const responses = await Promise.all(bookingPromises);
            const anyFailed = responses.some(response => !response.ok);
            
            if (anyFailed) {
                throw new Error('Failed to book one or more seats');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error booking seats:', error);
            throw error;
        }
    },
    
    // Personaalsete istekohasoovituste pärimine reisija eelistuste järgi
    async getRecommendedSeats(flightId, preferences) {
        const { passengerCount = 1, windowSeat = false, extraLegroom = false, seatClass = 'ECONOMY', excludedSeats = [] } = preferences;
        
        console.log('Getting recommended seats with preferences:', {
            flightId,
            passengerCount,
            windowSeat,
            extraLegroom,
            seatClass,
            excludedSeats
        });
        
        try {
            const params = new URLSearchParams();
            params.append('passengerCount', passengerCount);
            params.append('windowSeat', windowSeat.toString());
            params.append('extraLegroom', extraLegroom.toString());
            params.append('seatClass', seatClass || 'ECONOMY');
            
            if (excludedSeats && excludedSeats.length > 0) {
                excludedSeats.forEach(seat => params.append('excludedSeats', seat));
            }
            
            const url = `${API_BASE_URL}/flights/${flightId}/recommended-seats?${params.toString()}`;
            console.log('API call URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
            }
            
            const data = await response.json();
            console.log(`Found ${data.length} recommended seats:`, data.map(s => s.seatNumber));
            return data;
        } catch (error) {
            console.error("Error in getRecommendedSeats:", error);
            throw error;
        }
    },
    
    // Istekohainfo muutmine administraatorite tööriistade jaoks
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
    
    // Terve istekohtade rea klassi massuuendamine lennukonfiguratsiooni seadistamisel
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