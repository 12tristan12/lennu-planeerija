package com.CGIpraktika.lennu_planeerija.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.CGIpraktika.lennu_planeerija.model.Seats;

// Tagab istmeandmete andmebaasitoimingute teostamise Spring Data raamistiku kaudu
@Repository
public interface SeatRepository extends JpaRepository<Seats, Long> {
    // Loeb kõik konkreetse lennuga seotud istmed isteplaani kuvamiseks
    List<Seats> findByFlightId(Long flightId);
    
    // Leiab konkreetse istme istmenumbri ja lennu ID järgi broneerimise täpseks haldamiseks
    Optional<Seats> findBySeatNumberAndFlightId(String seatNumber, Long flightId);
}