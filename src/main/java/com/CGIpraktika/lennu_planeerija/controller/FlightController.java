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
import org.springframework.web.bind.annotation.PutMapping;
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

    // Kontrollerit alustab vajalike sõltuvustega
    public FlightController(FlightService flightService, SeatRepository seatRepository) {
        this.flightService = flightService;
        this.seatRepository = seatRepository;
    }

    // Pakub täieliku nimekirja saadaolevatest lendudest UI-s kuvamiseks
    @GetMapping
    public ResponseEntity<List<Flight>> getAllFlights() {
        List<Flight> flights = flightService.getAllFlights();
        return ResponseEntity.ok(flights);
    }

    // Võimaldab kiiresti kontrollida, et API on ligipääsetav ja töötab
    @GetMapping("/test")
    public String testEndpoint(){
        return "Töötab";
    }

    // Võimaldab administraatoritel süsteemis uusi lende lisada
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

    // Hangib üksikasjalikku teavet konkreetse lennu kohta broneerimiseks
    @GetMapping("/{id}")
    public ResponseEntity<Flight> getFlightById(@PathVariable Long id) {
        try {
            Flight flight = flightService.getFlightById(id);
            return ResponseEntity.ok(flight);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Pakub konkreetsele lennule istekohtade skeemi, et võimaldada istekohtade valikut
    @GetMapping("/{flightId}/seats")
    public ResponseEntity<List<Seats>> getSeatsByFlight(@PathVariable Long flightId) {
        List<Seats> seats = flightService.getSeatsForFlight(flightId);
        return ResponseEntity.ok(seats);
    }

    // Võimaldab reisijatel lennul konkreetset istekohta broneerida
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

    // Võimaldab uuendada üksikute istekohtade omadusi hoolduse või hinnamuudatuste jaoks
    @PutMapping("/{flightId}/seats/{seatId}")
    public ResponseEntity<?> updateSeat(
            @PathVariable Long flightId,
            @PathVariable Long seatId,
            @RequestBody Seats updatedSeat) {
        try {
            Optional<Seats> seatOpt = seatRepository.findById(seatId);
            if (seatOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Koht ei leitud");
            }

            Seats seat = seatOpt.get();
            
            if (!seat.getFlight().getId().equals(flightId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Koht ei kuulu määratud lennule");
            }
            
            seat.setIsFirstClass(updatedSeat.getIsFirstClass());
            seat.setIsBusinessClass(updatedSeat.getIsBusinessClass());
            seat.setIsEconomyClass(updatedSeat.getIsEconomyClass());
            
            seat.setIsWindowSeat(updatedSeat.getIsWindowSeat());
            seat.setIsExtraLegRoom(updatedSeat.getIsExtraLegRoom());
            if (updatedSeat.getPrice() != null) {
                seat.setPrice(updatedSeat.getPrice());
            }
            
            Seats savedSeat = seatRepository.save(seat);
            return ResponseEntity.ok(savedSeat);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Viga koha uuendamisel: " + e.getMessage());
        }
    }
    
    // Võimaldab tõhusalt muuta terve rea istekohtade klasse ja omadusi korraga
    @PutMapping("/{flightId}/seats/row/{rowNumber}")
    public ResponseEntity<?> updateSeatsByRow(
            @PathVariable Long flightId,
            @PathVariable int rowNumber,
            @RequestParam(required = false) Boolean isFirstClass,
            @RequestParam(required = false) Boolean isBusinessClass,
            @RequestParam(required = false) Boolean isEconomyClass,
            @RequestParam(required = false) Boolean isExtraLegRoom) {
        try {
            List<Seats> flightSeats = flightService.getSeatsForFlight(flightId);
            List<Seats> updatedSeats = new ArrayList<>();
            
            for (Seats seat : flightSeats) {
                String seatNumber = seat.getSeatNumber();
                String rowPart = seatNumber.replaceAll("[A-Za-z]", "");
                
                if (Integer.parseInt(rowPart) == rowNumber) {
                    if (isFirstClass != null) {
                        seat.setIsFirstClass(isFirstClass);
                        if (isFirstClass) {
                            seat.setIsBusinessClass(false);
                            seat.setIsEconomyClass(false);
                        }
                    }
                    
                    if (isBusinessClass != null) {
                        seat.setIsBusinessClass(isBusinessClass);
                        if (isBusinessClass) {
                            seat.setIsFirstClass(false);
                            seat.setIsEconomyClass(false);
                        }
                    }
                    
                    if (isEconomyClass != null) {
                        seat.setIsEconomyClass(isEconomyClass);
                        if (isEconomyClass) {
                            seat.setIsFirstClass(false);
                            seat.setIsBusinessClass(false);
                        }
                    }
                    
                    if (isExtraLegRoom != null) {
                        seat.setIsExtraLegRoom(isExtraLegRoom);
                    }
                    
                    Double basePrice = seat.getFlight().getPrice();
                    if (seat.getIsFirstClass()) {
                        seat.setPrice(basePrice + 40.0);
                    } else if (seat.getIsBusinessClass()) {
                        seat.setPrice(basePrice + 20.0);
                    } else {
                        seat.setPrice(basePrice);
                    }
                    
                    updatedSeats.add(seat);
                }
            }
            
            if (updatedSeats.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Ühtegi kohta reas " + rowNumber + " ei leitud");
            }
            
            seatRepository.saveAll(updatedSeats);
            return ResponseEntity.ok("Uuendatud " + updatedSeats.size() + " kohta reas " + rowNumber);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Viga kohtade uuendamisel: " + e.getMessage());
        }
    }

    // Võimaldab kasutajatel leida konkreetseid lende, mis vastavad nende reisikriteeriumidele
    @GetMapping("/search")
    public ResponseEntity<List<Flight>> searchFlights(
        @RequestParam(required = false) String origin,
        @RequestParam(required = false) String destination,
        @RequestParam(required = false) String departureDate,
        @RequestParam(required = false) String classType) {
        
        List<Flight> filteredFlights = flightService.searchFlights(origin, destination, departureDate, classType);
        return ResponseEntity.ok(filteredFlights);
    }

    // Pakub isikupärastatud istekohtade soovitusi reisija eelistuste põhjal
    @GetMapping("/{flightId}/recommended-seats")
    public ResponseEntity<List<Seats>> getRecommendedSeats(
            @PathVariable Long flightId,
            @RequestParam(defaultValue = "1") int passengerCount,
            @RequestParam(defaultValue = "false") boolean windowSeat,
            @RequestParam(defaultValue = "false") boolean extraLegroom,
            @RequestParam(defaultValue = "ECONOMY") String seatClass,
            @RequestParam(required = false) List<String> excludedSeats) {
        
        try {
            List<String> excludedSeatsList = excludedSeats != null ? excludedSeats : new ArrayList<>();
            
            String normalizedSeatClass = seatClass.toUpperCase().trim();
            
            boolean isFirstClass = normalizedSeatClass.equals("FIRST");
            boolean isBusinessClass = normalizedSeatClass.equals("BUSINESS");
            boolean isEconomyClass = normalizedSeatClass.equals("ECONOMY") || 
                                  (!isFirstClass && !isBusinessClass);
            
            FlightService.SeatPreferences preferences = new FlightService.SeatPreferences(
                passengerCount,
                excludedSeatsList,
                windowSeat,
                extraLegroom,
                isFirstClass,
                isBusinessClass,
                isEconomyClass
            );
            
            List<Seats> recommendedSeats = flightService.recommendSeats(flightId, preferences);
            return ResponseEntity.ok(recommendedSeats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Võimaldab administraatoritel eemaldada lende, mida enam ei pakuta
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id) {
        flightService.deleteFlight(id);
        return ResponseEntity.noContent().build();
    }
}