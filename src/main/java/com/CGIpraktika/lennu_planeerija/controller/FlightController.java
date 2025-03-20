package com.CGIpraktika.lennu_planeerija.controller;

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

    // ✅ Get all flights
    @GetMapping
    public List<Flight> getAllFlights() {
        return flightService.getAllFlights();
    }

    @GetMapping("/test")
    public String testEndpoint(){
        return "Töötab";
    }

    // ✅ Add a new flight
    @PostMapping
    public Flight addFlight(@RequestBody Flight flight) {
        return flightService.addFlight(flight);
    }

    @GetMapping("/{flightId}/seats")
        public ResponseEntity<List<Seats>> getSeatsByFlight(@PathVariable Long flightId) {
        List<Seats> seats = seatRepository.findByFlightId(flightId); // Kasuta õiget meetodit
        return ResponseEntity.ok(seats);
    }
    @PostMapping("/{flightId}/seats")
    public ResponseEntity<?> bookSeat( @PathVariable Long flightId, @RequestParam String seatNumber) {
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
    
    @GetMapping("/flights/{flightId}/seats")
    public ResponseEntity<List<Seats>> getFlightSeats(@PathVariable Long flightId) {
        List<Seats> seats = flightService.getSeatsForFlight(flightId);
        return ResponseEntity.ok(seats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id) {
        try {
            flightService.deleteFlight(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
