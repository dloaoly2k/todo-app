# 🐾 Airtable Environment for Dog Sitting Business

## 🧠 Context

This document outlines the **Airtable environment** used to support a dog-sitting business. It defines the database schema that automation workflows will refer to. This structure serves as the **source of truth** for:

- Where client and booking data is stored
- Where information is pulled **from** and written **to** during workflow operations
- How manual and automated processes (via Rover or internal interfaces) are tracked

This environment is critical for understanding how the data is organized and will be used in any workflow automations related to scheduling, payment tracking, communication, or reporting.

---

## 📁 Tables Overview

The Airtable base consists of two core tables:

1. `ClientList` – Stores all dog and client information.
2. `Bookings` – Manages individual bookings with references to clients and financial data.

---

## 📄 Table: ClientList

Stores individual client profiles and their dogs. Each client may be linked to multiple bookings.

### Fields

| Field Name         | Type             | Description                                                                 |
|--------------------|------------------|-----------------------------------------------------------------------------|
| DogName            | Single line text | The name of the dog *(Primary Field)*                                       |
| Sitter             | Single select    | Person responsible for the dog. Options: `D'Angelo`, `Kiran`              |
| BookingSource      | Single select    | Source of booking. Options: `Rover`, `Direct`<br>• `Rover` = imported via workflow<br>• `Direct` = manually entered via interface |
| OwnerName          | Single line text | Full name of the dog’s owner                                                |
| OwnerPhoneNumber   | Single line text | Contact number for the owner                                                |
| DaycareRate        | Number           | Price charged for daycare service                                           |
| BoardingRate       | Number           | Price charged for overnight boarding                                        |
| Notes              | Long text        | Any additional info about the dog (behavior, feeding, etc.)                 |
| Bookings           | Linked record    | Link to related records in the `Bookings` table                             |
| EmergencyContact   | Single line text | Name and number of backup contact in case of emergency                      |

---

## 📄 Table: Bookings

Logs individual bookings with key service and payment details. Linked to `ClientList`.

### Fields

| Field Name         | Type             | Description                                                                 |
|--------------------|------------------|-----------------------------------------------------------------------------|
| BookingID          | Auto number      | Unique identifier for each booking *(Primary Field)*                        |
| Client             | Linked record    | Link to the corresponding client in the `ClientList` table                  |
| BookingSource      | Lookup           | Source of booking, pulled from `ClientList`                                 |
| BookingType        | Single select    | Type of service. Options: `Boarding`, `Daycare`                             |
| BookingStatus      | Single select    | Status of booking. Options: `Potential`, `Confirmed`, `Canceled`, `Completed` |
| StartDate          | Date             | Date the booking starts                                                     |
| EndDate            | Date             | Date the booking ends                                                       |
| Sitter             | Lookup           | Pulled from `ClientList`, identifies the assigned sitter                    |
| PaymentReceived    | Checkbox         | Whether payment has been received                                           |
| DaycareRate        | Lookup           | Daily rate for daycare, pulled from `ClientList`                            |
| BoardingRate       | Lookup           | Daily rate for boarding, pulled from `ClientList`                           |
| BookingPrice       | Number           | Total price of the booking                                                  |
| RoverFee           | Number           | Platform fee deducted by Rover (if applicable)                              |
| YourPayout         | Number           | Net payout after fees                                                       |
| Notes              | Lookup           | Notes from `ClientList`, copied for quick access                            |
| Duration           | Formula          | Total number of days in the booking<br>**Formula:** `DATETIME_DIFF({EndDate}, {StartDate}, 'days')` |
| EmergencyContact   | Lookup           | Emergency contact, pulled from `ClientList`                                 |
| BookingCreatedAt   | Created time     | Timestamp when the booking record was first created                         |

---

## 🔗 Table Relationships

- **One Client** ➡️ **Many Bookings** via the `Bookings` linked record.
- Lookups in `Bookings` mirror data from the related `ClientList` record.
- Booking source field allows workflows to branch logic depending on whether a booking came from **Rover (automated)** or **Direct (manual input)**.