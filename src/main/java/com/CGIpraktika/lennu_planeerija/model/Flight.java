package com.CGIpraktika.lennu_planeerija.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
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
    private double price;
    private String airline;
    @OneToMany(mappedBy = "flight", cascade = CascadeType.ALL)
    private List<Seats> seats = new ArrayList<>();

    public Flight() {}

    public Flight(String airline, String origin, String destination, String arrivalTime, String departureTime, double price) {
        this.airline = airline;
        this.origin = origin;
        this.destination = destination;
        this.departureTime = LocalDateTime.parse(departureTime);
        this.arrivalTime = LocalDateTime.parse(arrivalTime);
        this.price = price;
    }
    public List<Seats> getSeats(){
        return seats;
    }
    public Long getId(){
        return id;
    }
    public String getAirline(){
        return airline;
    }
    public String getOrigin(){
        return origin;
    }
    public String getDestination(){
        return destination;
    }
    public double getPrice(){
        return price;
    }
    public LocalDateTime getDepartureTime(){
        return departureTime;
    }
    public LocalDateTime getArrivalTime(){
        return arrivalTime;
    }
    
}
