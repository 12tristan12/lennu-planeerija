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

    // Võimaldab juurdepääsu andmekihile andmete haldamiseks
    public FlightService(FlightRepository flightRepository, SeatRepository seatRepository) {
        this.flightRepository = flightRepository;
        this.seatRepository = seatRepository;
    }

    // Annab kasutajatele ülevaate kõigist saadaolevatest lendudest otsingu teostamiseks
    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    // Võimaldab administraatoritel luua uusi lende süsteemis, mida reisijad saavad broneerida
    public Flight addFlight(Flight flight) {
        if (flight.getPrice() == null) {
            throw new IllegalArgumentException("Price cannot be null");
        }
        
        System.out.println("Saving flight with price: " + flight.getPrice());
        
        Flight savedFlight = flightRepository.save(flight);
        generateSeatsForFlight(savedFlight, 20);
        return savedFlight;
    }

    // Loob lendudele automaatselt istekohad, et reisijad saaksid neid valida
    private void generateSeatsForFlight(Flight flight, int numRows) {
        double price = flight.getPrice();
        System.out.println("Generating seats with price: " + price);
        
        List<Seats> seats = new ArrayList<>();
        String[] letters = {"A", "B", "C", "D", "E", "F"};
        Random random = new Random();
        
        double võimalus = 0.3;
        
        for (int row = 1; row <= numRows; row++) {
            for (String letter : letters) {
                boolean kinnineIste = random.nextDouble() < võimalus;
                
                if (kinnineIste) {
                    võimalus += 0.2;
                } else {
                    võimalus -= 0.05;
                    if (võimalus < 0.1) võimalus = 0.1;
                }
                
                if (võimalus > 0.5) {
                    võimalus = 0.2;
                }
                
                Seats seat = new Seats();
                seat.setSeatNumber(row + letter);
                seat.setIsBooked(kinnineIste);

                if (letter.equals("A") || letter.equals("F")) {
                    seat.setIsWindowSeat(true);
                    System.out.println("Set seat " + seat.getSeatNumber() + " as WINDOW SEAT");
                } else {
                    seat.setIsWindowSeat(false);
                }
                
                double seatPrice;
                if (row <= 5) {
                    seatPrice = price + 40.0;
                    seat.setIsFirstClass(true);
                    seat.setIsBusinessClass(false);
                    seat.setIsEconomyClass(false);
                    seat.setIsExtraLegRoom(true);
                } else if (row <= 10) {
                    seatPrice = price + 20.0;
                    seat.setIsFirstClass(false);
                    seat.setIsBusinessClass(true);
                    seat.setIsEconomyClass(false);
                    seat.setIsExtraLegRoom(true);
                } else {
                    seatPrice = price;
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

    // Võimaldab kuvada kasutajale konkreetse lennu istekohtade plaani broneerimiseks
    public List<Seats> getSeatsForFlight(Long flightId) {
        return seatRepository.findByFlightId(flightId);
    }

    // Võimaldab eemaldada süsteemist lende, mis on aegunud või tühistatud
    public void deleteFlight(Long id) {
        Flight flight = flightRepository.findById(id).orElseThrow(() -> new RuntimeException("Flight not found with id: " + id));
        List<Seats> seats = seatRepository.findByFlightId(id);
        seatRepository.deleteAll(seats);
        flightRepository.deleteById(id);
    }

    // Tagab kasutajatele võimaluse näha lennu täpseid detaile otsustamiseks
    public Flight getFlightById(Long id) {
        return flightRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Flight not found with id: " + id));
    }

    // Võimaldab kasutajatel filtreerida lende nende reisivajaduste järgi
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

    // Aitab reisijatel leida optimaalseid istekohti vastavalt nende eelistustele
    public List<Seats> recommendSeats(Long flightId, SeatPreferences preferences) {
        List<Seats> seats = seatRepository.findByFlightId(flightId).stream()
                .filter(seat -> !seat.getIsBooked())
                .filter(seat -> !preferences.getExcludedSeatNumbers().contains(seat.getSeatNumber()))
                .filter(seat -> {
                    if (preferences.isFirstClass()) return seat.getIsFirstClass();
                    if (preferences.isBusinessClass()) return seat.getIsBusinessClass();
                    if (preferences.isEconomyClass()) return seat.getIsEconomyClass();
                    return seat.getIsEconomyClass();
                })
                .filter(seat -> !preferences.isWindowSeat() || seat.getIsWindowSeat())
                .filter(seat -> !preferences.isExtraLegroom() || seat.getIsExtraLegRoom())
                .collect(Collectors.toList());
        
        if (preferences.getPassengerCount() == 1) {
            if (!seats.isEmpty()) {
                seats.sort((a, b) -> {
                    int scoreA = (preferences.isWindowSeat() && a.getIsWindowSeat() ? 1 : 0) +
                                 (preferences.isExtraLegroom() && a.getIsExtraLegRoom() ? 1 : 0);
                    int scoreB = (preferences.isWindowSeat() && b.getIsWindowSeat() ? 1 : 0) +
                                 (preferences.isExtraLegroom() && b.getIsExtraLegRoom() ? 1 : 0);
                    return Integer.compare(scoreB, scoreA);
                });
                
                return Collections.singletonList(seats.get(0));
            }
            return Collections.emptyList();
        }

        Map<Integer, List<Seats>> seatsByRow = seats.stream()
                .collect(Collectors.groupingBy(seat -> {
                    String rowPart = seat.getSeatNumber().replaceAll("[A-Z]", "");
                    return Integer.parseInt(rowPart);
                }));
        
        List<Seats> largestConsecutiveGroup = findBestConsecutiveGroup(seatsByRow, preferences.getPassengerCount());
        
        if (largestConsecutiveGroup.size() >= preferences.getPassengerCount()) {
            return largestConsecutiveGroup.subList(0, preferences.getPassengerCount());
        }
        
        if (!seats.isEmpty()) {
            int seatCount = Math.min(seats.size(), preferences.getPassengerCount());
            return seats.subList(0, seatCount);
        }
        
        return Collections.emptyList();
    }

    // Aitab leida grupile kokkukuuluvad istekohad sama rea peal
    private List<Seats> findBestConsecutiveGroup(Map<Integer, List<Seats>> seatsByRow, int passengerCount) {
        List<Seats> bestGroup = new ArrayList<>();
        
        List<Integer> sortedRows = new ArrayList<>(seatsByRow.keySet());
        Collections.sort(sortedRows);
        
        for (Integer row : sortedRows) {
            List<Seats> rowSeats = new ArrayList<>(seatsByRow.get(row));
            rowSeats.sort(Comparator.comparing(s -> s.getSeatNumber().replaceAll("[0-9]", "")));
            
            List<Seats> consecutiveSeats = findLongestConsecutiveSeats(rowSeats);
            
            if (consecutiveSeats.size() > bestGroup.size()) {
                bestGroup = consecutiveSeats;
                
                if (bestGroup.size() >= passengerCount) {
                    return bestGroup;
                }
            }
        }
        
        return bestGroup;
    }

    // Tuvastab järjestikused istekohad, et group saaks istuda kõrvuti
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

        // Võimaldab luua vaikimisi seadistustega istmeeelistuste objekti
        public SeatPreferences() {
            this.passengerCount = 1;
            this.excludedSeatNumbers = new ArrayList<>();
            this.windowSeat = false;
            this.extraLegroom = false;
        }

        // Võimaldab luua täpsete parameetritega istmeeelistuste objekti
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

        // Pakub standardiseeritud viisi klassipreferentsi kuvamiseks
        public String getSeatClass() {
            if (isFirstClass) return "FIRST";
            if (isBusinessClass) return "BUSINESS";
            if (isEconomyClass) return "ECONOMY";
            return "ECONOMY";
        }

        // Võimaldab lihtsalt muuta klassivalikut stringi põhjal
        public void setSeatClass(String seatClass) {
            this.isFirstClass = false;
            this.isBusinessClass = false;
            this.isEconomyClass = false;

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

    // Võimaldab kontrollida, kas konkreetne iste kuulub soovitatud istekohtade hulka
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

    // Võimaldab muuta istekohtade omadusi reisikogemuse personaliseerimiseks
    public Seats updateSeat(Long seatId, Seats updatedSeat) {
        Seats seat = seatRepository.findById(seatId)
            .orElseThrow(() -> new RuntimeException("Seat not found with id: " + seatId));
        
        seat.setIsFirstClass(updatedSeat.getIsFirstClass());
        seat.setIsBusinessClass(updatedSeat.getIsBusinessClass());
        seat.setIsEconomyClass(updatedSeat.getIsEconomyClass());
        seat.setIsWindowSeat(updatedSeat.getIsWindowSeat());
        seat.setIsExtraLegRoom(updatedSeat.getIsExtraLegRoom());
        seat.setPrice(updatedSeat.getPrice());
        
        return seatRepository.save(seat);
    }
}

