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
        
        for (int row = 1; row <= numRows; row++) {
            for (String letter : letters) {
                Seats seat = new Seats();
                seat.setSeatNumber(row + letter);
                // 30% chance for a seat to be occupied
                seat.setIsBooked(random.nextDouble() < 0.3);
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
