package com.CGIpraktika.lennu_planeerija.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Seats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    

    @SuppressWarnings("FieldMayBeFinal")
    private String seatNumber; 
    @SuppressWarnings("FieldMayBeFinal")
    private boolean isBooked; 

    @ManyToOne
    @JsonIgnore 
    @JoinColumn(name = "flight_id")
    @SuppressWarnings("FieldMayBeFinal")
    private Flight flight;

    @SuppressWarnings("FieldMayBeFinal")
    private Double price;

    public Seats() {
        this.seatNumber ="g";
        this.isBooked = false;
        this.flight = null;
    }

    public String getSeatNumber(){
        return seatNumber;
    }
    public boolean getIsBooked(){
        return isBooked;
    }
    public Flight geFlight(){
        return flight;
    }
    public Long getId(){
        return id;
    }
    public Double getPrice() {
        return price;
    }
    public void setIsBooked(boolean x){
        isBooked = x;
    }
    public void setSeatNumber(String x){
        seatNumber = x;
    }
    public void setFlight(Flight x){
        flight = x;
    }
    public void setPrice(Double price) {
        this.price = price;
    }
}