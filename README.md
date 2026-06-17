# Vito - Clinic Management System 🏥

Profesjonalny, bezpieczny system do zarządzania przychodnią lekarską, oparty na architekturze mikrousług. Projekt kładzie ogromny nacisk na bezpieczeństwo danych pacjentów, ochronę prywatności (zgodność z RODO) oraz nowoczesne standardy uwierzytelniania, spełniając założenia OWASP Top 10:2025.

---

## 🏗 Architektura Systemu

Aplikacja została podzielona na niezależne mikrousługi w celu zapewnienia skalowalności i separacji odpowiedzialności:

* Frontend: React 18.2.0 + Vite 5.2.8 (serwowany produkcyjnie przez Nginx jako Reverse Proxy)
* Backend Framework: Java 17 + Spring Boot 4.0.5
* Baza Danych: PostgreSQL 16 (dla środowiska produkcyjnego) / H2 (dla testów integracyjnych w pamięci RAM)
* Infrastruktura: Docker & Docker Compose z całkowicie odizolowaną siecią wewnętrzną
* Komunikacja & Autoryzacja: REST API + Stateless JWT (JSON Web Tokens)

### Struktura Modułów:
1. `auth-service` (Port: 8081) - Serwis odpowiedzialny za zarządzanie tożsamością, logowanie, rejestrację, wydawanie tokenów JWT, politykę blokad brute-force oraz weryfikację MFA (Multi-Factor Authentication).
2. `medical-service` (Port: 8082) - Serwis odpowiedzialny za logikę medyczną: zarządzanie kartotekami pacjentów, wizytami lekarskimi oraz notatkami pielęgniarskimi.
3. `frontend` (Port: 3000) - Aplikacja kliencka SPA. Dzięki serwerowi Nginx ruch do API jest wewnętrznie przekierowywany do odpowiednich mikroserwisów.

---

## 🔒 Bezpieczeństwo i Ochrona Danych (Security First)

Projekt implementuje rygorystyczne mechanizmy ochrony danych PII (Personally Identifiable Information) oraz standardy uwierzytelniania:

* Szyfrowanie na poziomie aplikacji (AES/GCM/NoPadding): Wszystkie dane wrażliwe (imiona, nazwiska, PESEL, numery telefonów, diagnozy) są szyfrowane przed zapisem do bazy danych z użyciem losowego wektora inicjującego (IV) per rekord. W razie wycieku zrzutu bazy (dump), dane są nieczytelne bez głównego klucza symetrycznego.
* Haszowanie danych przeszukiwalnych: Aby umożliwić wyszukiwanie np. po numerze PESEL, system przechowuje ich stałe skróty (SHA-512).
* Nginx Reverse Proxy & No-CORS: Całkowite wyeliminowanie podatności i problemów konfiguracyjnych CORS poprzez wystawienie frontendu i API pod tą samą domeną w Nginx.
* Nagłówki Bezpieczeństwa OWASP: Serwer Nginx twardo wymusza nagłówki Content-Security-Policy (CSP), X-Frame-Options: DENY oraz X-Content-Type-Options: nosniff.
* Integracja z "Have I Been Pwned" (HIBP): Podczas rejestracji hasła są sprawdzane pod kątem znanych wycieków z wykorzystaniem modelu k-Anonymity (wysyłane jest tylko 5 pierwszych znaków skrótu SHA-1).
* MFA (TOTP): Natywna obsługa kodów jednorazowych, zgodna np. z Google Authenticator.
* Niezawodna ochrona przed Brute-Force i Timing Attacks: System progresywnie blokuje konto po 5 nieudanych próbach logowania (od 1 do 120 minut). Stan blokad jest trwale zapisywany w bazie PostgreSQL, co czyni go odpornym na restarty instancji. Posiada też ochronę przed Timing Attacks (wyrównywanie czasu odpowiedzi dla nieistniejących kont).
* RBAC i DTO (Mass Assignment Protection): Dostęp do danych medycznych jest ściśle chroniony logiką Owner-Level (np. pacjent widzi tylko swoje dane), a wszystkie przychodzące żądania są filtrowane przez obiekty DTO (Data Transfer Objects), zapobiegając nadpisywaniu ról.

---

## 🚀 Uruchomienie (Środowisko Lokalne - One-Click Setup)

Wdrożenie projektu opiera się o konteneryzację, co zapewnia pełną powtarzalność środowiska.

### 1. Wymagania Wstępne
* Docker & Docker Compose

### 2. Konfiguracja zmiennych środowiskowych
Przed pierwszym uruchomieniem utwórz plik `.env` w głównym katalogu projektu:

DB_PASSWORD=TwojeBardzoTrudneHasloDoBazy123!
JWT_SECRET=TwojSuperTrudnySekretnyKluczDoJWT_Minimum256Bitow
ENCRYPTION_KEY=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=

### 3. Uruchomienie infrastruktury
Użyj narzędzia Docker Compose, aby zbudować aplikację (Frontend + Backend) i podnieść kontenery w izolowanej sieci:

docker compose up --build -d

* Aplikacja Webowa (Frontend) dostępna jest pod adresem: http://localhost:3000
(Wszystkie zapytania API z frontendu są automatycznie przekierowywane przez Nginx do odpowiednich mikroserwisów).

---

## 🧪 Testowanie

Projekt używa bazy H2 w pamięci (profil testowy) w celu przyspieszenia i izolacji testów jednostkowych oraz integracyjnych (JUnit 5 + Mockito).

Uruchamianie testów z poziomu terminala:

cd backend/auth-service
mvn clean test

cd ../medical-service
mvn clean test

---

## 📝 Skrócona Referencja API

Aplikacja kliencka komunikuje się z usługami poprzez Reverse Proxy (port 3000).

Auth Service (http://localhost:3000/api/auth)
* POST /api/auth/register - Rejestracja nowego użytkownika.
* POST /api/auth/login - Logowanie (zwraca token JWT w przypadku sukcesu).

Medical Service (http://localhost:3000/api) - Wymaga nagłówka Authorization: Bearer <token>
* POST /api/patients - Utworzenie profilu medycznego (Każdy użytkownik).
* GET /api/patients - Pobranie listy pacjentów (Dostęp: DOCTOR, NURSE, ADMIN).
* POST /api/appointments - Rezerwacja wizyty.
* GET /api/appointments - Lista wizyt dla zalogowanego użytkownika.
* POST /api/appointments/{id}/records - Dodanie dokumentacji medycznej (Tylko przypisany lekarz prowadzący).