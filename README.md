# Vito - Clinic Management System 🏥

Profesjonalny, bezpieczny system do zarządzania przychodnią lekarską, oparty na architekturze mikrousług. Projekt kładzie ogromny nacisk na bezpieczeństwo danych pacjentów, ochronę prywatności (zgodność z RODO) oraz nowoczesne standardy uwierzytelniania.

---

## 🏗 Architektura Systemu

Aplikacja została podzielona na niezależne mikrousługi w celu zapewnienia skalowalności i separacji odpowiedzialności:

* **Backend Framework:** Java 17 + Spring Boot 4.0.6
* **Baza Danych:** PostgreSQL (dla środowiska produkcyjnego) / H2 (dla testów integracyjnych w pamięci RAM)
* **Infrastruktura:** Docker & Docker Compose
* **Komunikacja & Autoryzacja:** REST API + Stateless JWT (JSON Web Tokens)

### Struktura Modułów:
1. **`auth-service` (Port: 8081)** - Serwis Odpowiedzialny za zarządzanie tożsamością, logowanie, rejestrację, wydawanie tokenów JWT oraz weryfikację MFA (Multi-Factor Authentication).
2. **`medical-service` (Port: 8082)** - Serwis Odpowiedzialny za logikę medyczną: zarządzanie kartotekami pacjentów, wizytami lekarskimi oraz notatkami pielęgniarskimi.

---

## 🔒 Bezpieczeństwo i Ochrona Danych (Security First)

Projekt implementuje rygorystyczne mechanizmy ochrony danych PII (Personally Identifiable Information) oraz standardy uwierzytelniania:

* **Szyfrowanie na poziomie aplikacji (AES/GCM/NoPadding):** Wszystkie dane wrażliwe (imiona, nazwiska, PESEL, numery telefonów, diagnozy) są szyfrowane przed zapisem do bazy danych. W razie wycieku zrzutu bazy (dump), dane są nieczytelne bez głównego klucza symetrycznego.
* **Haszowanie danych przeszukiwalnych:** Aby umożliwić wyszukiwanie np. po numerze PESEL, system przechowuje ich stałe skróty (np. `SHA-512`).
* **Integracja z "Have I Been Pwned" (HIBP):** Podczas rejestracji hasła są sprawdzane pod kątem znanych wycieków z wykorzystaniem modelu k-Anonymity (wysyłane jest tylko 5 pierwszych znaków skrótu SHA-1).
* **MFA (TOTP):** Natywna obsługa kodów jednorazowych, zgodna np. z Google Authenticator.
* **Ochrona przed atakami Brute-Force:** System blokuje konto po 5 nieudanych próbach logowania z narastającym czasem blokady (od 1 do 120 minut). Posiada też ochronę przed *Timing Attacks* (stały czas porównywania hasha).
* **RBAC (Role-Based Access Control):** Dostęp do danych medycznych (np. edycja dokumentacji po wizycie) jest ściśle chroniony adnotacjami Spring Security na podstawie roli (`PATIENT`, `DOCTOR`, `NURSE`, `ADMIN`).

---

## 🚀 Uruchomienie (Środowisko Lokalne)

Wdrożenie projektu opiera się o konteneryzację, co zapewnia zasadę "One-Click Setup".

### 1. Wymagania Wstępne
* Docker & Docker Compose
* Środowisko Java 17 (do lokalnego developmentu)

### 2. Konfiguracja zmiennych środowiskowych
Przed pierwszym uruchomieniem utwórz plik `.env` w głównym katalogu projektu:

DB_PASSWORD=TwojeBardzoTrudneHasloDoBazy123!
JWT_SECRET=TwojSuperTrudnySekretnyKluczDoJWT_Minimum256Bitow
ENCRYPTION_KEY=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI= # Przykładowy 32-bajtowy klucz Base64

### 3. Uruchomienie infrastruktury
Użyj narzędzia Docker Compose, aby skompilować kod za pomocą Mavena i podnieść kontenery (Baza Danych + Mikroserwisy):

docker-compose up --build -d

* Serwis autoryzacji dostępny jest pod adresem: http://localhost:8081
* Serwis medyczny dostępny jest pod adresem: http://localhost:8082

---

## 🧪 Testowanie

Projekt używa bazy **H2** w pamięci (profil testowy) w celu przyspieszenia i izolacji testów jednostkowych oraz integracyjnych.

### Uruchamianie testów z poziomu terminala:
Aby uruchomić wszystkie testy z pominięciem środowiska graficznego:

cd backend/auth-service
mvn clean test

cd ../medical-service
mvn clean test

---

## 📝 Skrócona Referencja API

### Auth Service (http://localhost:8081)
* `POST /api/auth/register` - Rejestracja nowego użytkownika.
* `POST /api/auth/login` - Logowanie (zwraca token JWT w przypadku sukcesu).

### Medical Service (http://localhost:8082) - Wymaga nagłówka `Authorization: Bearer <token>`
* `POST /api/patients` - Utworzenie profilu medycznego (Każdy użytkownik).
* `GET /api/patients` - Pobranie listy pacjentów (Dostęp: `DOCTOR`, `NURSE`, `ADMIN`).
* `POST /api/appointments` - Rezerwacja wizyty.
* `GET /api/appointments` - Lista wizyt.
* `POST /api/records` - Dodanie dokumentacji medycznej (Tylko przypisany lekarz prowadzący).
