document.addEventListener('DOMContentLoaded', () => {
    const flightsList = document.getElementById('flights');
    const searchForm = document.getElementById('flight-search');

    // Load initial flights
    loadFlights();

    // Handle search form submission
    searchForm.addEventListener('submit', handleSearch);

    async function loadFlights() {
        try {
            const flights = await api.getAllFlights();
            displayFlights(flights);
        } catch (error) {
            console.error('Error loading flights:', error);
        }
    }

    async function handleSearch(event) {
        event.preventDefault();
        
        const formData = new FormData(searchForm);
        const searchData = {
            departure: formData.get('departure'),
            arrival: formData.get('arrival'),
            dateFrom: formData.get('dateFrom'),
            classType: formData.get('classType')
        };

        try {
            const flights = await api.searchFlights(searchData);
            displayFlights(flights);
        } catch (error) {
            console.error('Error searching flights:', error);
        }
    }

    function displayFlights(flights) {
        flightsList.innerHTML = '';
        flights.forEach(flight => {
            const li = document.createElement('li');
            li.textContent = `${flight.origin} to ${flight.destination} - ${flight.departureTime} to ${flight.arrivalTime}`;
            flightsList.appendChild(li);
        });
    }
});