package com.CGIpraktika.lennu_planeerija.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.CGIpraktika.lennu_planeerija.model.Seats;

@Repository
public interface SeatRepository extends JpaRepository<Seats, Long> {
    List<Seats> findByFlightId(Long flightId);
    Optional<Seats> findBySeatNumberAndFlightId(String seatNumber, Long flightId);
}