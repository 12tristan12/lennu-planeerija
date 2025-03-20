package com.CGIpraktika.lennu_planeerija.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

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
        Flight savedFlight = flightRepository.save(flight);
        generateSeatsForFlight(savedFlight, 20); // Changed to 20 rows
        return savedFlight;
    }

    private void generateSeatsForFlight(Flight flight, int numRows) {
        List<Seats> seats = new ArrayList<>();
        String[] letters = {"A", "B", "C", "D", "E", "F"};
        Random random = new Random();
        
        for (int row = 1; row <= numRows; row++) {
            for (String letter : letters) {
                Seats seat = new Seats();
                seat.setSeatNumber(row + letter);
                seat.setIsBooked(random.nextDouble() < 0.3); // 30% chance to be occupied
                
                // Set price based on row
                double price;
                if (row <= 5) {
                    price = 89.0; // First class
                } else if (row <= 10) {
                    price = 69.0; // Business class
                } else {
                    price = 49.0; // Economy class
                }
                seat.setPrice(price);
                seat.setFlight(flight);
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);
    }

    public List<Seats> getSeatsForFlight(Long flightId) {
        return seatRepository.findByFlightId(flightId);
    }
}
