package com.CGIpraktika.lennu_planeerija.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.CGIpraktika.lennu_planeerija.model.Flight;
import com.CGIpraktika.lennu_planeerija.model.Seats;
import com.CGIpraktika.lennu_planeerija.repository.FlightRepository;
import com.CGIpraktika.lennu_planeerija.repository.SeatRepository;

import lombok.Data;

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
                double võimalus = 0.3;
                boolean kinnineIste = random.nextDouble() < võimalus;        
                if (kinnineIste) {
                    võimalus += 0.2;
                }
                if (võimalus > 0.5) {
                    võimalus = 0.2;
                }
                Seats seat = new Seats();
                seat.setSeatNumber(row + letter);
                seat.setIsBooked(random.nextDouble() < võimalus);

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

    /**
     * Recommend seats based on preferences and passenger count
     */
    public List<Seats> recommendSeats(Long flightId, SeatPreferences preferences) {
        System.out.println("Finding seats for flight " + flightId + " with preferences: " + preferences);
        
        List<Seats> seats = seatRepository.findByFlightId(flightId).stream()
                .filter(seat -> !seat.getIsBooked())
                .filter(seat -> !preferences.getExcludedSeatNumbers().contains(seat.getSeatNumber()))
                .collect(Collectors.toList());
                
        System.out.println("Found " + seats.size() + " available seats");

        // For single passenger
        if (preferences.getPassengerCount() == 1) {
            Optional<Seats> seatOpt = seats.stream()
                    .filter(s -> !preferences.isWindowSeat() || s.getIsWindowSeat())
                    .filter(s -> !preferences.isExtraLegroom() || s.getIsExtraLegRoom())
                    .findFirst();
                    
            System.out.println("Single passenger recommendation: " + seatOpt.map(Seats::getSeatNumber).orElse("none"));
            return seatOpt.map(Collections::singletonList).orElse(Collections.emptyList());
        }

        // For multiple passengers, find adjacent seats
        Map<Integer, List<Seats>> seatsByRow = seats.stream()
                .collect(Collectors.groupingBy(seat -> {
                    String rowPart = seat.getSeatNumber().replaceAll("[A-Z]", "");
                    return Integer.parseInt(rowPart);
                }));
                
        System.out.println("Grouped seats by row: " + seatsByRow.keySet());

        for (Map.Entry<Integer, List<Seats>> entry : seatsByRow.entrySet()) {
            List<Seats> rowSeats = entry.getValue();
            rowSeats.sort(Comparator.comparing(s -> s.getSeatNumber().replaceAll("[0-9]", "")));
            
            for (int i = 0; i <= rowSeats.size() - preferences.getPassengerCount(); i++) {
                List<Seats> consecutive = rowSeats.subList(i, i + preferences.getPassengerCount());
                
                boolean isConsecutive = true;
                for (int j = 1; j < consecutive.size(); j++) {
                    char prev = consecutive.get(j-1).getSeatNumber().charAt(consecutive.get(j-1).getSeatNumber().length() - 1);
                    char curr = consecutive.get(j).getSeatNumber().charAt(consecutive.get(j).getSeatNumber().length() - 1);
                    if (curr - prev != 1) {
                        isConsecutive = false;
                        break;
                    }
                }

                if (isConsecutive) {
                    System.out.println("Found consecutive seats: " + 
                        consecutive.stream().map(Seats::getSeatNumber).collect(Collectors.joining(", ")));
                    return consecutive;
                }
            }
        }

        System.out.println("No suitable seats found");
        return Collections.emptyList();
    }

    @Data
    public static class SeatPreferences {
        private int passengerCount = 1; // Default to 1
        private List<String> excludedSeatNumbers;
        private boolean windowSeat;
        private boolean extraLegroom;

        public SeatPreferences() {
            this.excludedSeatNumbers = new ArrayList<>();
        }

        public SeatPreferences(int passengerCount, List<String> excludedSeatNumbers, 
                             boolean windowSeat, boolean extraLegroom) {
            this.passengerCount = Math.max(1, passengerCount); // Ensure at least 1 passenger
            this.excludedSeatNumbers = excludedSeatNumbers != null ? 
                                     excludedSeatNumbers : new ArrayList<>();
            this.windowSeat = windowSeat;
            this.extraLegroom = extraLegroom;
        }

        public int getPassengerCount() {
            return passengerCount;
        }
    }

    /**
     * Check if a specific seat is recommended based on preferences
     */
    public boolean isRecommendedSeat(Seats seat, SeatPreferences preferences) {
        if (seat.getIsBooked()) {
            return false;
        }

        List<Seats> recommendedSeats = recommendSeats(
            seat.getFlight().getId(),
            preferences
        );

        return recommendedSeats.stream()
            .map(Seats::getSeatNumber)
            .collect(Collectors.toList())
            .contains(seat.getSeatNumber());
    }
}
