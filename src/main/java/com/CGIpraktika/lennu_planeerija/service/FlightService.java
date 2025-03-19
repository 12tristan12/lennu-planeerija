package com.CGIpraktika.lennu_planeerija.service;


import java.util.List;

import org.springframework.stereotype.Service;

import com.CGIpraktika.lennu_planeerija.model.Flight;
import com.CGIpraktika.lennu_planeerija.repository.FlightRepository;

@Service
public class FlightService {
    private final FlightRepository flightRepository;

    public FlightService(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }


    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }


    public Flight addFlight(Flight flight) {
        return flightRepository.save(flight);
    }
}
