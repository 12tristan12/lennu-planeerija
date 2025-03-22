package com.CGIpraktika.lennu_planeerija.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.CGIpraktika.lennu_planeerija.model.Flight;
import com.CGIpraktika.lennu_planeerija.model.Seats;
import com.CGIpraktika.lennu_planeerija.repository.SeatRepository;
import com.CGIpraktika.lennu_planeerija.service.FlightService;

@RestController
@RequestMapping("/api/flights")
public class FlightController {
    private final FlightService flightService;
    private final SeatRepository seatRepository;

    public FlightController(FlightService flightService, SeatRepository seatRepository) {
        this.flightService = flightService;
        this.seatRepository = seatRepository;
    }

    @GetMapping
    public ResponseEntity<List<Flight>> getAllFlights() {
        List<Flight> flights = flightService.getAllFlights();
        return ResponseEntity.ok(flights);
    }

    @GetMapping("/test")
    public String testEndpoint(){
        return "Töötab";
    }

    @PostMapping
    public ResponseEntity<?> addFlight(@RequestBody Flight flight) {
        try {
            if (flight.getPrice() == null) {
                return ResponseEntity
                    .badRequest()
                    .body("Price is required and must be a valid number");
            }

            Flight savedFlight = flightService.addFlight(flight);
            return ResponseEntity.ok(savedFlight);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                .badRequest()
                .body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Flight> getFlightById(@PathVariable Long id) {
        try {
            Flight flight = flightService.getFlightById(id);
            return ResponseEntity.ok(flight);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{flightId}/seats")
    public ResponseEntity<List<Seats>> getSeatsByFlight(@PathVariable Long flightId) {
        List<Seats> seats = flightService.getSeatsForFlight(flightId);
        return ResponseEntity.ok(seats);
    }

    @PostMapping("/{flightId}/seats")
    public ResponseEntity<?> bookSeat(@PathVariable Long flightId, @RequestParam String seatNumber) {
        Optional<Seats> seatOpt = seatRepository.findBySeatNumberAndFlightId(seatNumber, flightId);
        if (seatOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Koht ei leitud");
        }

        Seats seat = seatOpt.get();
        if (seat.getIsBooked()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Koht on juba broneeritud");
        }
        seat.setIsBooked(true);
        seatRepository.save(seat);
        return ResponseEntity.ok("Koht broneeritud: " + seatNumber);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Flight>> searchFlights(
        @RequestParam(required = false) String origin,
        @RequestParam(required = false) String destination,
        @RequestParam(required = false) String departureDate,
        @RequestParam(required = false) String classType) {
        
        List<Flight> filteredFlights = flightService.searchFlights(origin, destination, departureDate, classType);
        return ResponseEntity.ok(filteredFlights);
    }

    @GetMapping("/{flightId}/recommended-seats")
    public ResponseEntity<List<Seats>> getRecommendedSeats(
            @PathVariable Long flightId,
            @RequestParam(defaultValue = "1") int passengerCount,
            @RequestParam(defaultValue = "false") boolean windowSeat,
            @RequestParam(defaultValue = "false") boolean extraLegroom,
            @RequestParam(required = false) List<String> excludedSeats) {
        
        System.out.println("Received seat recommendation request:");
        System.out.println("- Flight ID: " + flightId);
        System.out.println("- Passenger Count: " + passengerCount);
        System.out.println("- Window Seat: " + windowSeat);
        System.out.println("- Extra Legroom: " + extraLegroom);
        
        try {
            FlightService.SeatPreferences preferences = new FlightService.SeatPreferences(
                passengerCount,
                excludedSeats != null ? excludedSeats : new ArrayList<>(),
                windowSeat,
                extraLegroom
            );
            
            List<Seats> recommendedSeats = flightService.recommendSeats(flightId, preferences);
            System.out.println("Found " + recommendedSeats.size() + " recommended seats");
            return ResponseEntity.ok(recommendedSeats);
        } catch (Exception e) {
            System.err.println("Error getting seat recommendations: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id) {
        flightService.deleteFlight(id);
        return ResponseEntity.noContent().build();
    }
}
