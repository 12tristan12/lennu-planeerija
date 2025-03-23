# Lennu Planeerija Rakendus
### Ülevaade
Lennu Planeerija on veebirakendus, mis võimaldab kasutajatel otsida lende, valida istekohti ja broneerida pileteid. Rakendus pakub interaktiivset kasutajaliidest istmekohtade valimiseks, soovitab istekohti vastavalt kasutaja eelistustele ning võimaldab hallata broneeringuid.

### Peamised funktsioonid
Lendude otsimine erinevate kriteeriumide alusel
Istmekohtade visualiseerimine interaktiivsel istmekaardil
Istmekohtade soovitamine vastavalt reisija eelistustele
Istekohtade broneerimine
Erinevate istekohtade klasside tugi (Economy, Business, First Class)
Eripäradega istekohtade märgistamine (aknakoht, lisaruumi koht)
### Tehnilised nõuded
Backend
Java 17 või uuem
Spring Boot 3.x
Maven 3.8.x või uuem
H2 andmebaas (arenduskeskkonnas)
### Frontend
HTML5, CSS3, JavaScript (ES6+)
Modernne veebibrauser (Chrome, Firefox, Safari, Edge)
Paigaldamine ja käivitamine
### Eeltingimused
Installeeritud Java 17+
Installeeritud Maven
Git (valikuline, lähtekoodi kloonimiseks)
### Lähtekoodi hankimine
```
git clone https://github.com/12tristan12/lennu-planeerija.git
```
```
cd lennu-planeerija
```
### Rakenduse ehitamine ja käivitamine
Rakendus käivitub aadressil http://localhost:8080

## Rakenduse arhitektuur
### Backend
Rakendus on ehitatud Spring Boot raamistikul ja kasutab MVC (Model-View-Controller) arhitektuurimustrit:

Model - Java andmeklassid (Flight, Seats jne)
Repository - Andmebaasiga suhtlemise kiht (FlightRepository, SeatRepository)
Service - Äriloogika kiht (FlightService)
Controller - API lõpp-punktid (REST kontrollerid)
Configuration - Rakenduse seadistused (WebConfig)

### Frontend
Frontendi komponendid on struktureeritud järgmiselt:

HTML - Põhilehed (index.html, seatsPlan.html)
CSS - Stiilid (styles.css)
JavaScript - Kliendipoolne loogika
api.js - API suhtluse funktsioonid
app.js - Rakenduse põhiloogika
flights.js - Lendude kuvamine
seats.js - Istekohtade haldus

### API dokumentatsioon
Lendude API
```
GET /api/flights - Kõikide lendude päring
GET /api/flights/{id} - Konkreetse lennu info päring
GET /api/flights/{id}/seats - Lennu istekohtade päring
POST /api/flights - Uue lennu lisamine
DELETE /api/flights/{id} - Lennu kustutamine
```
Istekohtade API
```
GET /api/flights/{flightId}/recommended-seats - Soovitatud istekohtade päring
POST /api/flights/{flightId}/seats - Istekoha broneerimine
PUT /api/flights/{flightId}/seats/{seatId} - Istmekoha info muutmine
PUT /api/flights/{flightId}/seats/row/{rowNumber} - Terve rea klassi muutmine
```
Istekohtade soovitusalgoritm
Rakendus kasutab nutikat algoritmi, mis soovitab kasutajatele istekohti vastavalt järgmistele parameetritele:

### Individuaalreisijad:

Aknakoha eelistus
Lisajalaruumi eelistus
Istmeklass (Economy, Business, First)
### Gruppidele:
Kõrvuti asetsevate istekohtade leidmine samas reas
Lähestikku asetsevate istekohtade leidmine

### Projekti struktuur
lennu-planeerija/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/CGIpraktika/lennu_planeerija/
│   │   │       ├── controller/
│   │   │       ├── model/
│   │   │       ├── repository/
│   │   │       ├── service/
│   │   │       └── WebConfig.java
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/
│   │       │   │   └── styles.css
│   │       │   ├── js/
│   │       │   │   ├── api.js
│   │       │   │   ├── app.js
│   │       │   │   ├── flights.js
│   │       │   │   └── seats.js
│   │       │   ├── index.html
│   │       │   └── seatsPlan.html
│   │       └── application.properties
│   └── test/
└── pom.xml

### Arendusprotsess
Lennu Planeerija rakendus on loodud järgides tänapäevaseid tarkvaraarenduse praktikaid:

SOLID põhimõtted - Koodi kirjutamisel on järgitud häid objektorienteeritud programmeerimise tavasid
RESTful API disain - API on ehitatud REST põhimõtteid järgides
Responsive disain - Kasutajaliides kohandub erinevate ekraanisuurustega
Kasutajakeskne disain - Rakendus on loodud pöörates tähelepanu kasutajakogemusele
Edaspidine arendus

### Abivahendid
Kasutatud Claude mudeleid üleüldise vormistuse ja console.logide vormistamisel 
Kasutatud spring.booti ülesehitamisel ning ja klasside struktuuri ja üleüldise ülesehituse genereerimisel
Kasutatud JavaScripti failide ülesehituse genereerimisel. Osad funktsioonid tehtud Claude AI abiga
CSS failides kasutatud kujundusel Calude AI abi


### Autor
Tristan Imala

### Kontakt
Küsimuste korral, palun kirjutage aadressil tristanimala2004@gmail.com
