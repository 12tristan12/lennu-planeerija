package com.CGIpraktika.lennu_planeerija.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.ToString;

@Entity
@AllArgsConstructor
@ToString
public class Flight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    @Column(nullable = false)
    private Double price;
    private String airline;
    @OneToMany(mappedBy = "flight", cascade = CascadeType.ALL)
    private List<Seats> seats = new ArrayList<>();

    // Loob tühja lennuobjekti JPA jaoks
    public Flight() {}

    // Loob lennuobjekti kõigi vajalike lennuandmetega
    public Flight(String airline, String origin, String destination, String arrivalTime, String departureTime, Double price) {
        this.airline = airline;
        this.origin = origin;
        this.destination = destination;
        this.departureTime = LocalDateTime.parse(departureTime);
        this.arrivalTime = LocalDateTime.parse(arrivalTime);
        this.price = price != null ? price : 49.0;
    }

    // Tagastab lennuga seotud istekohad isteplaani kuvamiseks
    public List<Seats> getSeats(){
        return seats;
    }
    
    // Võimaldab lennu identifitseerimist API päringutes
    public Long getId(){
        return id;
    }
    
    // Tagastab lennufirma nime kuvamiseks kasutajaliideses
    public String getAirline(){
        return airline;
    }
    
    // Tagastab lennu lähtekoha broneerimise ja filtreerimise jaoks
    public String getOrigin(){
        return origin;
    }
    
    // Tagastab lennu sihtkoha broneerimise ja filtreerimise jaoks
    public String getDestination(){
        return destination;
    }
    
    // Tagastab lennu baashinna arvestamiseks istekohtade hinnapakkumisel
    public Double getPrice(){
        return price;
    }
    
    // Võimaldab administraatoritel uuendada lennu baashinda
    public void setPrice(Double price) {
        this.price = price != null ? price : 49.0;
    }
    
    // Tagastab väljumisaja reisigraafiku kuvamiseks ja sorteerimiseks
    public LocalDateTime getDepartureTime(){
        return departureTime;
    }
    
    // Tagastab saabumisaja reisigraafiku ja lennu kestuse arvutamiseks
    public LocalDateTime getArrivalTime(){
        return arrivalTime;
    }
}
