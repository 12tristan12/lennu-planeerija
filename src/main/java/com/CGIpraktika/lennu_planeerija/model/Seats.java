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
    private boolean isFirstClass;
    private boolean isBusinessClass;
    private boolean isEconomyClass;
    private boolean isWindowSeat;
    private boolean isExtraLegRoom;

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
    
    public boolean getIsFirstClass() {
        return isFirstClass;
    }
    public boolean getIsBusinessClass() {
        return isBusinessClass;
    }
    public boolean getIsEconomyClass() {
        return isEconomyClass;
    }
    public boolean getIsWindowSeat() {
        return isWindowSeat;
    }
    public boolean getIsExtraLegRoom() {
        return isExtraLegRoom;
    }

    public String getSeatNumber(){
        return seatNumber;
    }
    public boolean getIsBooked(){
        return isBooked;
    }
    public Flight getFlight(){
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

    public void setIsFirstClass(boolean isFirstClass) {
        this.isFirstClass = isFirstClass;
    }
    public void setIsBusinessClass(boolean isBusinessClass) {
        this.isBusinessClass = isBusinessClass;
    }
    public void setIsEconomyClass(boolean isEconomyClass) {
        this.isEconomyClass = isEconomyClass;
    }
    public void setIsWindowSeat(boolean isWindowSeat) {
        this.isWindowSeat = isWindowSeat;
    }
    public void setIsExtraLegRoom(boolean isExtraLegRoom) {
        this.isExtraLegRoom = isExtraLegRoom;
    }
}