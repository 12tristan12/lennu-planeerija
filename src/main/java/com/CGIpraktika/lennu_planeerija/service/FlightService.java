package com.CGIpraktika.lennu_planeerija.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
        
        // Alustame booking tõenäosust väljaspool tsüklit, et see säiliks ridade vahel
        double võimalus = 0.3;
        
        for (int row = 1; row <= numRows; row++) {
            for (String letter : letters) {
                // Otsustame, kas iste on kinni või mitte
                boolean kinnineIste = random.nextDouble() < võimalus;
                
                // Kohandame tõenäosust järgmise istme jaoks
                if (kinnineIste) {
                    võimalus += 0.2; // Suurendame tõenäosust kui iste on kinni
                } else {
                    võimalus -= 0.05; // Vähendame veidi tõenäosust, kui iste on vaba
                    if (võimalus < 0.1) võimalus = 0.1; // Ei lase tõenäosusel liiga madalale langeda
                }
                
                // Taastame tasakaalu, kui tõenäosus läheb liiga kõrgeks
                if (võimalus > 0.5) {
                    võimalus = 0.2;
                }
                
                Seats seat = new Seats();
                seat.setSeatNumber(row + letter);
                seat.setIsBooked(kinnineIste); // Kasutame juba arvutatud kinnineIste väärtust

                if (letter.equals("A") || letter.equals("F")) {
                    seat.setIsWindowSeat(true);
                    // Lisa logimine et kontrollida väärtuse määramist
                    System.out.println("Set seat " + seat.getSeatNumber() + " as WINDOW SEAT");
                } else {
                    seat.setIsWindowSeat(false); // Kindlustame, et teistel on false
                }
                
                // Calculate price based on class using price from database
                double seatPrice;
                if (row <= 5) {
                    seatPrice = price + 40.0; // First class (+40€)
                    seat.setIsFirstClass(true);
                    seat.setIsBusinessClass(false);
                    seat.setIsEconomyClass(false);
                    seat.setIsExtraLegRoom(true);
                } else if (row <= 10) {
                    seatPrice = price + 20.0; // Business class (+20€)
                    seat.setIsFirstClass(false);
                    seat.setIsBusinessClass(true);
                    seat.setIsEconomyClass(false);
                    seat.setIsExtraLegRoom(true);
                } else {
                    seatPrice = price; // Economy class (base price)
                    seat.setIsFirstClass(false);
                    seat.setIsBusinessClass(false);
                    seat.setIsEconomyClass(true);
                    if (row == 11) {
                        seat.setIsExtraLegRoom(true);
                    } else {
                        seat.setIsExtraLegRoom(false);    
                    }
                }
                
                seat.setPrice(seatPrice);
                seat.setFlight(flight);
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);
        System.out.println("Generated " + seats.size() + " seats for flight, " + 
                         seats.stream().filter(Seats::getIsBooked).count() + " are booked");
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
    // Lisa rohkem logimist eelistuste kohta
    System.out.println("=== SEAT RECOMMENDATION START ===");
    System.out.println("Flight ID: " + flightId);
    System.out.println("Passenger count: " + preferences.getPassengerCount());
    System.out.println("Window seat requested: " + preferences.isWindowSeat());
    System.out.println("Extra legroom requested: " + preferences.isExtraLegroom());
    System.out.println("Seat class: " + preferences.getSeatClass());
    System.out.println("=============================");
    
    // Filtreeri istmed põhiliste kriteeriumite alusel (vabad istmed, sobiv klass)
    List<Seats> seats = seatRepository.findByFlightId(flightId).stream()
            .filter(seat -> !seat.getIsBooked())
            .filter(seat -> !preferences.getExcludedSeatNumbers().contains(seat.getSeatNumber()))
            .filter(seat -> {
                // Rakenda klassifiltrit rangelt
                boolean matches = false;
                if (preferences.isFirstClass()) {
                    matches = seat.getIsFirstClass();
                    if (matches) System.out.println("Seat " + seat.getSeatNumber() + " matches FIRST class");
                } else if (preferences.isBusinessClass()) {
                    matches = seat.getIsBusinessClass();
                    if (matches) System.out.println("Seat " + seat.getSeatNumber() + " matches BUSINESS class");
                } else if (preferences.isEconomyClass()) {
                    matches = seat.getIsEconomyClass();
                    if (matches) System.out.println("Seat " + seat.getSeatNumber() + " matches ECONOMY class");
                }
                return matches; // Tagasta true ainult siis, kui on täpne vaste
            })
            .filter(seat -> !preferences.isWindowSeat() || seat.getIsWindowSeat())
            .filter(seat -> !preferences.isExtraLegroom() || seat.getIsExtraLegRoom())
            .collect(Collectors.toList());
    
    System.out.println("Found " + seats.size() + " matching seats after filtering");
    
    // Lisame kontrolli aknakohtade ja lisaruumi kohta
    seats.forEach(seat -> {
        System.out.println("Seat " + seat.getSeatNumber() + 
                          " - Window: " + seat.getIsWindowSeat() + 
                          ", Extra legroom: " + seat.getIsExtraLegRoom() + 
                          ", Class: " + 
                          (seat.getIsFirstClass() ? "FIRST" : 
                           seat.getIsBusinessClass() ? "BUSINESS" : "ECONOMY"));
    });
    
    // Kui ühtegi istet ei vasta täpselt kriteeriumitele, teatame kasutajale
    if (seats.isEmpty()) {
        System.out.println("No seats match the exact criteria");
        return new ArrayList<>();
    }
    
    // Ühe reisija puhul kasutame spetsiaalset loogikat
    if (preferences.getPassengerCount() == 1) {
        // Debug - prindi kõikide istmete eelistused
        System.out.println("DEBUG - preferences for single passenger:");
        System.out.println("windowSeat requested: " + preferences.isWindowSeat());
        System.out.println("extraLegroom requested: " + preferences.isExtraLegroom());
        
        // Loome eelistusel põhineva järjestuse
        List<Seats> bestMatchSeats = new ArrayList<>(seats);
        
        // Kui mõlemad eelistused on määratud, leiame istmed, mis rahuldavad mõlemat
        if (preferences.isWindowSeat() && preferences.isExtraLegroom()) {
            List<Seats> perfectMatches = bestMatchSeats.stream()
                .filter(s -> s.getIsWindowSeat() && s.getIsExtraLegRoom())
                .collect(Collectors.toList());
            
            System.out.println("DEBUG - Looking for window seats WITH extra legroom");
            System.out.println("Found " + perfectMatches.size() + " perfect matches");
            
            // Kui leiame perfektse vaste, tagastame selle
            if (!perfectMatches.isEmpty()) {
                Seats bestSeat = perfectMatches.get(0);
                System.out.println("Selected perfect match seat: " + bestSeat.getSeatNumber() + 
                                  ", Extra legroom: " + bestSeat.getIsExtraLegRoom() + ")");
                return Collections.singletonList(bestSeat);
            }
        }
        
        // Kui perfektset vastavust pole või eelistused on eraldi, kasutame juba filtreeritud istmete listi
        if (!seats.isEmpty()) {
            Seats selectedSeat = seats.get(0);
            System.out.println("Selected seat: " + selectedSeat.getSeatNumber() + 
                              " (Window: " + selectedSeat.getIsWindowSeat() + 
                              ", Extra legroom: " + selectedSeat.getIsExtraLegRoom() + ")");
            return Collections.singletonList(selectedSeat);
        }
        
        // Kui ühtegi istet ei leitud, tagastame tühja listi
        System.out.println("No suitable seat found for the single passenger");
        return Collections.emptyList();
    }

    // Mitme reisija jaoks jätkame olemasoleva loogikaga
    List<Seats> recommendedSeats = new ArrayList<>();
    
    // Jätkame olemasoleva grupeerimise loogikaga...
    // [ülejäänud kood jääb samaks]

    // ... [olemasolev kood mitme reisija jaoks]
    
    // Grupeeri istmed rea järgi
    Map<Integer, List<Seats>> seatsByRow = seats.stream()
            .collect(Collectors.groupingBy(seat -> {
                String rowPart = seat.getSeatNumber().replaceAll("[A-Z]", "");
                return Integer.parseInt(rowPart);
            }));
            
    // Sorteeri read numbri järgi
    List<Integer> sortedRows = new ArrayList<>(seatsByRow.keySet());
    Collections.sort(sortedRows);

    // Leia igas reas suurim järjestikuste istmete grupp ja jälgi parimat
    List<Seats> largestConsecutiveGroup = new ArrayList<>();
    Integer largestGroupRow = null;
    
    for (Integer row : sortedRows) {
        List<Seats> rowSeats = new ArrayList<>(seatsByRow.get(row));
        rowSeats.sort(Comparator.comparing(s -> s.getSeatNumber().replaceAll("[0-9]", "")));
        
        List<Seats> consecutiveSeats = findLongestConsecutiveSeats(rowSeats);
        
        if (consecutiveSeats.size() > largestConsecutiveGroup.size()) {
            largestConsecutiveGroup = consecutiveSeats;
            largestGroupRow = row;
        }
    }
    
    // Lisa kõik istmed suurimast järjestikusest grupist
    recommendedSeats.addAll(largestConsecutiveGroup);
    
    int remainingPassengers = preferences.getPassengerCount() - largestConsecutiveGroup.size();
    
    // Kui vajame veel istmeid, otsi lähimad istmed meie suurimale grupile
    if (remainingPassengers > 0 && largestGroupRow != null) {
        // Kõigepealt proovi leida täiendavad istmed samas reas
        List<Seats> remainingInSameRow = seatsByRow.get(largestGroupRow).stream()
                .filter(seat -> !recommendedSeats.contains(seat))
                .collect(Collectors.toList());
        
        int seatsToTakeFromSameRow = Math.min(remainingInSameRow.size(), remainingPassengers);
        if (seatsToTakeFromSameRow > 0) {
            recommendedSeats.addAll(remainingInSameRow.subList(0, seatsToTakeFromSameRow));
            remainingPassengers -= seatsToTakeFromSameRow;
        }
        
        // Seejärel proovi ridu, mis on lähedal meie suurimale grupile
        if (remainingPassengers > 0) {
            // Järgi olemasolevat loogikat...
            List<Integer> rowsByDistance = new ArrayList<>(sortedRows);
            rowsByDistance.remove(largestGroupRow);
            
            final Integer finalLargestGroupRow = largestGroupRow;
            rowsByDistance.sort(Comparator.comparingInt(row -> Math.abs(row - finalLargestGroupRow)));
            
            for (Integer row : rowsByDistance) {
                if (remainingPassengers <= 0) break;
                
                List<Seats> availableInRow = seatsByRow.get(row);
                availableInRow.sort(Comparator.comparing(s -> s.getSeatNumber().replaceAll("[0-9]", "")));
                
                int seatsToTake = Math.min(availableInRow.size(), remainingPassengers);
                if (seatsToTake > 0) {
                    recommendedSeats.addAll(availableInRow.subList(0, seatsToTake));
                    remainingPassengers -= seatsToTake;
                }
            }
        }
    }

    if (!recommendedSeats.isEmpty()) {
        // Veenduge, et tagastame ainult vajaliku arvu istmeid
        if (recommendedSeats.size() > preferences.getPassengerCount()) {
            return recommendedSeats.subList(0, preferences.getPassengerCount());
        }
        return recommendedSeats;
    }

    // Kui ikka istmeid ei leitud, tagasta lihtsalt suvalised vabad istmed
    List<Seats> fallbackSeats = new ArrayList<>(seats);
    if (fallbackSeats.isEmpty()) {
        return Collections.emptyList();
    }
    int seatCount = Math.min(fallbackSeats.size(), preferences.getPassengerCount());
    return fallbackSeats.subList(0, seatCount);
}

    private List<Seats> findLongestConsecutiveSeats(List<Seats> rowSeats) {
        List<Seats> longest = new ArrayList<>();
        List<Seats> current = new ArrayList<>();
        
        for (int i = 0; i < rowSeats.size(); i++) {
            if (i == 0) {
                current.add(rowSeats.get(i));
                continue;
            }

            char prevLetter = rowSeats.get(i-1).getSeatNumber()
                .charAt(rowSeats.get(i-1).getSeatNumber().length() - 1);
            char currLetter = rowSeats.get(i).getSeatNumber()
                .charAt(rowSeats.get(i).getSeatNumber().length() - 1);

            if (currLetter - prevLetter == 1) {
                current.add(rowSeats.get(i));
            } else {
                if (current.size() > longest.size()) {
                    longest = new ArrayList<>(current);
                }
                current = new ArrayList<>();
                current.add(rowSeats.get(i));
            }
        }

        if (current.size() > longest.size()) {
            longest = current;
        }

        return longest;
    }

    @Data
    public static class SeatPreferences {
        private int passengerCount;
        private List<String> excludedSeatNumbers;
        private boolean windowSeat;
        private boolean extraLegroom;
        private boolean isFirstClass;
        private boolean isBusinessClass;
        private boolean isEconomyClass;

        public SeatPreferences() {
            this.passengerCount = 1;
            this.excludedSeatNumbers = new ArrayList<>();
            this.windowSeat = false;
            this.extraLegroom = false;
            // Don't set any default class
        }

        public SeatPreferences(int passengerCount, List<String> excludedSeatNumbers, 
                             boolean windowSeat, boolean extraLegroom,
                             boolean isFirstClass, boolean isBusinessClass, boolean isEconomyClass) {
            this.passengerCount = Math.max(1, passengerCount);
            this.excludedSeatNumbers = excludedSeatNumbers != null ? excludedSeatNumbers : new ArrayList<>();
            this.windowSeat = windowSeat;
            this.extraLegroom = extraLegroom;
            this.isFirstClass = isFirstClass;
            this.isBusinessClass = isBusinessClass;
            this.isEconomyClass = isEconomyClass;
        }

        public String getSeatClass() {
            if (isFirstClass) return "FIRST";
            if (isBusinessClass) return "BUSINESS";
            if (isEconomyClass) return "ECONOMY";
            return "ECONOMY"; // Default if none selected
        }

        public void setSeatClass(String seatClass) {
            // Reset all class flags
            this.isFirstClass = false;
            this.isBusinessClass = false;
            this.isEconomyClass = false;

            // Set only the selected class
            switch (seatClass.toUpperCase()) {
                case "FIRST":
                    this.isFirstClass = true;
                    break;
                case "BUSINESS":
                    this.isBusinessClass = true;
                    break;
                case "ECONOMY":
                default:
                    this.isEconomyClass = true;
                    break;
            }
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
    public Seats updateSeat(Long seatId, Seats updatedSeat) {
    Seats seat = seatRepository.findById(seatId)
        .orElseThrow(() -> new RuntimeException("Seat not found with id: " + seatId));
    
    // Update properties
    seat.setIsFirstClass(updatedSeat.getIsFirstClass());
    seat.setIsBusinessClass(updatedSeat.getIsBusinessClass());
    seat.setIsEconomyClass(updatedSeat.getIsEconomyClass());
    seat.setIsWindowSeat(updatedSeat.getIsWindowSeat());
    seat.setIsExtraLegRoom(updatedSeat.getIsExtraLegRoom());
    seat.setPrice(updatedSeat.getPrice());
    
    return seatRepository.save(seat);
}
}

