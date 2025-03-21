package com.CGIpraktika.lennu_planeerija.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.CGIpraktika.lennu_planeerija.model.Flight;
import com.CGIpraktika.lennu_planeerija.model.Seats;
import com.CGIpraktika.lennu_planeerija.repository.FlightRepository;
import com.CGIpraktika.lennu_planeerija.repository.SeatRepository;

@Service
public class FlightService {
    private final FlightRepository flightRepository;
    private final SeatRepository seatRepository;
    private final Random random = new Random();

    public FlightService(FlightRepository flightRepository, SeatRepository seatRepository) {
        this.flightRepository = flightRepository;
        this.seatRepository = seatRepository;
    }

    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    public Flight addFlight(Flight flight) {
        if (flight.getPrice() == null) {
            throw new IllegalArgumentException("Price cannot be null");
        }
        
        // Log the price before saving
        System.out.println("Saving flight with price: " + flight.getPrice());
        
        Flight savedFlight = flightRepository.save(flight);
        generateSeatsForFlight(savedFlight, 20); // Changed to 20 rows
        return savedFlight;
    }

    private void generateSeatsForFlight(Flight flight, int numRows) {
        double price = flight.getPrice();
        System.out.println("Generating seats with price: " + price);
        
        List<Seats> seats = new ArrayList<>();
        String[] letters = {"A", "B", "C", "D", "E", "F"};
        Random random = new Random();
        
        for (int row = 1; row <= numRows; row++) {
            for (String letter : letters) {
                Seats seat = new Seats();
                seat.setSeatNumber(row + letter);
                seat.setIsBooked(random.nextDouble() < 0.3);
                if (letter.equals("A") || letter.equals("F")) {
                    seat.setIsWindowSeat(true);
                }
                
                // Calculate price based on class using price from database
                double seatPrice;
                if (row <= 5) {
                    seatPrice = price + 40.0; // First class (+40€)
                    seat.setIsFirstClass(true);
                    seat.setIsExtraLegRoom(true);
                } else if (row <= 10) {
                    seatPrice = price + 20.0; // Business class (+20€)
                    seat.setIsBusinessClass(true);
                    seat.setIsExtraLegRoom(true);
                } else {
                    if (row == 11){
                        seat.setIsExtraLegRoom(true);
                    }    
                    else{
                        seat.setIsExtraLegRoom(false);    
                    }     
                    seatPrice = price; // Economy class (base price)
                    seat.setIsEconomyClass(true);
                }
                
                seat.setPrice(seatPrice);
                seat.setFlight(flight);
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);
    }

    public List<Seats> getSeatsForFlight(Long flightId) {
        return seatRepository.findByFlightId(flightId);
    }

    public void deleteFlight(Long id) {
        // First find the flight to ensure it exists
        Flight flight = flightRepository.findById(id).orElseThrow(() -> new RuntimeException("Flight not found with id: " + id));
            
        // Delete associated seats first
        List<Seats> seats = seatRepository.findByFlightId(id);
        seatRepository.deleteAll(seats);
        
        // Then delete the flight
        flightRepository.deleteById(id);
    }

    public Flight getFlightById(Long id) {
        return flightRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Flight not found with id: " + id));
    }

    public List<Flight> searchFlights(String origin, String destination, String departureDate, String classType) {
        List<Flight> allFlights = getAllFlights();
        
        return allFlights.stream()
            .filter(flight -> origin == null || origin.isEmpty() || 
                    flight.getOrigin().toLowerCase().contains(origin.toLowerCase()))
            .filter(flight -> destination == null || destination.isEmpty() || 
                    flight.getDestination().toLowerCase().contains(destination.toLowerCase()))
            .filter(flight -> departureDate == null || departureDate.isEmpty() || 
                    flight.getDepartureTime().toLocalDate().toString().equals(departureDate))
            .collect(Collectors.toList());
    }
}
