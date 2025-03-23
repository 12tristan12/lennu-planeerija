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

    // Loob uue standardse istekoha objekti JPA jaoks
    public Seats() {
        this.seatNumber ="g";
        this.isBooked = false;
        this.flight = null;
    }
    
    // Võimaldab kontrollida, kas tegemist on esimese klassi istekohaga filtreerimiseks
    public boolean getIsFirstClass() {
        return isFirstClass;
    }
    
    // Võimaldab kontrollida, kas tegemist on äriklassi istekohaga filtreerimiseks
    public boolean getIsBusinessClass() {
        return isBusinessClass;
    }
    
    // Võimaldab kontrollida, kas tegemist on turistiklassi istekohaga filtreerimiseks
    public boolean getIsEconomyClass() {
        return isEconomyClass;
    }
    
    // Võimaldab filtreerida aknakohtade järgi kasutaja eelistuste põhjal
    public boolean getIsWindowSeat() {
        return isWindowSeat;
    }
    
    // Võimaldab filtreerida lisaruumiga kohtade järgi kasutaja eelistuste põhjal
    public boolean getIsExtraLegRoom() {
        return isExtraLegRoom;
    }

    // Tagastab istekoha identifitseerimiseks vajaliku numbrikombinatsiooni
    public String getSeatNumber(){
        return seatNumber;
    }
    
    // Võimaldab kontrollida istekoha saadavust broneerimiseks
    public boolean getIsBooked(){
        return isBooked;
    }
    
    // Tagastab lennu, millele istekoht kuulub andmete sidumiseks
    public Flight getFlight(){
        return flight;
    }
    
    // Tagastab istekoha unikaalse identifikaatori andmebaasis
    public Long getId(){
        return id;
    }
    
    // Tagastab istekoha hinna kuvamiseks kasutajale
    public Double getPrice() {
        return price;
    }
    
    // Võimaldab märkida istekoha broneerituks või tühistada broneeringu
    public void setIsBooked(boolean x){
        isBooked = x;
    }
    
    // Võimaldab määrata istekoha numbrikombinatsioon koha loomise ajal
    public void setSeatNumber(String x){
        seatNumber = x;
    }
    
    // Võimaldab määrata lennu, millele istekoht kuulub seose loomiseks
    public void setFlight(Flight x){
        flight = x;
    }
    
    // Võimaldab uuendada istekoha hinda sõltuvalt klassi muutustest
    public void setPrice(Double price) {
        this.price = price;
    }

    // Võimaldab määrata istekoha esimesse klassi kuuluvuse
    public void setIsFirstClass(boolean isFirstClass) {
        this.isFirstClass = isFirstClass;
    }
    
    // Võimaldab määrata istekoha äriklassi kuuluvuse
    public void setIsBusinessClass(boolean isBusinessClass) {
        this.isBusinessClass = isBusinessClass;
    }
    
    // Võimaldab määrata istekoha turistiklassi kuuluvuse
    public void setIsEconomyClass(boolean isEconomyClass) {
        this.isEconomyClass = isEconomyClass;
    }
    
    // Võimaldab määrata, kas tegemist on aknaistmega
    public void setIsWindowSeat(boolean isWindowSeat) {
        this.isWindowSeat = isWindowSeat;
    }
    
    // Võimaldab määrata, kas istekohale on lisaruumi jalgadele
    public void setIsExtraLegRoom(boolean isExtraLegRoom) {
        this.isExtraLegRoom = isExtraLegRoom;
    }
}