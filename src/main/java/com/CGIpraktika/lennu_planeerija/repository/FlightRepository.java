package com.CGIpraktika.lennu_planeerija.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.CGIpraktika.lennu_planeerija.model.Flight;

public interface FlightRepository extends JpaRepository<Flight, Long> {
    List<Flight> findByDestination(String destination);


}