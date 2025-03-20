package com.CGIpraktika.lennu_planeerija.service;


import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.CGIpraktika.lennu_planeerija.model.Flight;
import com.CGIpraktika.lennu_planeerija.model.Seats;
import com.CGIpraktika.lennu_planeerija.repository.FlightRepository;
import com.CGIpraktika.lennu_planeerija.repository.SeatRepository;

@Service
public class FlightService {
    private final FlightRepository flightRepository;
    private final SeatRepository seatRepository;

    public FlightService(FlightRepository flightRepository, SeatRepository seatRepository) {
        this.flightRepository = flightRepository;
        this.seatRepository = seatRepository;
    }


    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }


    public Flight addFlight(Flight flight) {
        Flight savedFlight = flightRepository.save(flight);
        generateSeatsForFlight(savedFlight, 150); 
        return savedFlight;
    }

    private void generateSeatsForFlight(Flight flight, int seatCount) {
        List<Seats> seats = new ArrayList<>();
        double suvaline = 0;
        for (int i = 1; i <= seatCount; i++) {
            suvaline = Math.random();
            Seats seat = new Seats();
            seat.setSeatNumber("A" + i); 
            if (suvaline > 0.4){
                seat.setIsBooked(false);
            }
            else{
                seat.setIsBooked(true);
            }
            seat.setFlight(flight); 
            seats.add(seat);
        }
        seatRepository.saveAll(seats);
    }
}
