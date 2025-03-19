package com.CGIpraktika.lennu_planeerija.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import com.CGIpraktika.lennu_planeerija.model.Flight;
import java.util.List;

public interface FlightRepository extends JpaRepository<Flight, Long> {
    List<Flight> findByDestination(String destination);
}
