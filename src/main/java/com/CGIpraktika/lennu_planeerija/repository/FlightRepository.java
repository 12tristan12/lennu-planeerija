package com.CGIpraktika.lennu_planeerija.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.CGIpraktika.lennu_planeerija.model.Flight;

// Võimaldab lennuandmete salvestamist ja pärimist andmebaasist
public interface FlightRepository extends JpaRepository<Flight, Long> {
    // Otsib lende sihtkoha järgi, et võimaldada kasutajal filter sihtkohta
    List<Flight> findByDestination(String destination);
}