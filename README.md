<div align="center">

# 🔐 VaultX Enterprise

### Secure Digital Document Vault with Intelligent Document Management

*A modern, enterprise-grade, fully mobile-responsive document management platform built with Java Spring Boot, React, and Python FastAPI, designed to securely store, organize, process, and share digital documents.*

<p>

![Java](https://img.shields.io/badge/Java-21-red?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

</p>

</div>

---

# 📖 Overview

VaultX Enterprise is a full-stack document management platform inspired by enterprise digital locker systems such as DigiLocker, Google Drive, and Dropbox.

It enables users to securely store, organize (Grid/List views), search, process, bundle, and share important documents while providing enterprise-level security, role-based access control, intelligent document analysis, and comprehensive PDF processing capabilities. The entire UI is **fully mobile-responsive**, ensuring a seamless experience across desktops, tablets, and smartphones.

The project demonstrates modern microservices architecture using **Spring Boot**, a dedicated **Python AI Microservice**, **Spring Security**, **JWT Authentication**, **PostgreSQL**, and a responsive **React/Tailwind** frontend.

---

# ✨ Key Features

## 📱 Fully Mobile-Responsive UI
- The entire dashboard, file explorer, and admin portals are tailored for mobile screens.
- Adaptive data tables, hidden non-essential columns on small screens, and mobile-first navigation.
- Accessible touch targets and dynamic layout grids (List & Grid views).

## 🔐 Authentication & Security
- JWT Authentication & Refresh Token Support
- Email OTP Verification
- Face Authentication (Biometric Login)
- Session Management & Device Tracking
- Password Reset & PIN Protection
- BCrypt Password Encryption
- Role-Based Access Control (RBAC)
- Rate Limiting & Request Logging
- Global Exception Handling

---

## 📁 Document Management
- Upload, Download, and Preview Documents
- **Trash Manager**: 30-Day Auto Retention and one-click Restore
- Folder / Collection Management with Grid & List toggles
- Categories, Tags, and Metadata Storage
- Multi-file Batch Operations (Select, Delete, Move)
- Local File System or Cloud Storage Ready

---

## 📄 Advanced PDF Toolkit
Professional PDF utilities built directly into the application.
- **Merge PDFs**: Combine multiple documents.
- **Split PDFs**: Extract specific pages.
- **Protect PDFs**: Add password encryption.
- **Watermark PDFs**: Apply text watermarks.
- **Compress PDFs**: Optimize file size.

---

## 📦 Smart Document Bundles
Create grouped document collections for various use cases (e.g., College Admission, Visa Application).
- Drag & Drop Ordering
- Bundle Settings & Activity Tracking
- Secure sharing of entire bundles via a single link.

---

## 🤖 Intelligent Document Engine
Built-in AI-powered document utilities utilizing a dedicated Python microservice and Google Gemini.
- **EasyOCR-based Text Extraction**
- **Smart Categorization** (Google Gemini Vision AI)
- **AI Chat Assistant** (RAG with contextual document responses)
- Duplicate Detection & Metadata Extraction
- AI Insights Dashboard & Expiring Document Detection

---

## 🔗 Secure Document Sharing
Share documents securely using temporary public links.
- Set Expiration Dates & Passwords
- Public Token Links
- Download & View Tracking Analytics

---

## 👨‍💼 Enterprise Admin Portal
Administrative dashboard with complete platform monitoring (Fully mobile friendly).
- User Management (Suspend, Activate, Delete)
- Dashboard Analytics & System Statistics
- Security Logs & Activity Monitoring
- Global Storage Management

---

# 🏗️ Architecture

```text
                React Frontend (Tailwind + Vite)
                               │
                               ▼
                      Spring Boot REST API
                               │
 ┌───────────────┬─────────────┴────────────┬───────────────┐
 │               │                          │               │
 ▼               ▼                          ▼               ▼
Security      Business                  PDF Engine      Python AI
 Layer         Logic                                  Microservice
 │               │                                          │
 ▼               ▼                                          ▼
PostgreSQL   Local / Cloud Storage                   EasyOCR & Gemini
```

---

# 🛠 Tech Stack

## Backend (Java Spring Boot)
- Java 21 & Spring Boot 3
- Spring Security & JWT Authentication
- Spring Data JPA & PostgreSQL
- Flyway Migration
- MapStruct & Bean Validation
- Maven

## AI Microservice (Python)
- Python 3.11+
- FastAPI & Uvicorn
- EasyOCR (Optical Character Recognition)
- Face Recognition (dlib/face_recognition)
- Google Gemini Vision AI
- PyTorch & OpenCV

## Frontend (React UI)
- React 18 & Vite
- JavaScript & Tailwind CSS
- React Router & Context API
- Chart.js (Analytics & Data Visualization)
- Lucide Icons

## DevOps
- Docker & Docker Compose
- Git & GitHub

---

# 🚀 Getting Started

## 1. Clone Repository
```bash
git clone https://github.com/Hrushi4151/VaultX.git
cd VaultX
```

## 2. Fast Deployment (Docker)
The easiest way to run the entire stack (PostgreSQL, Backend, Frontend, AI Service) is using Docker Compose:
```bash
# First, configure your environment variables
cp .env.example .env

# Build and start all containers
docker compose up -d --build
```
> The application will be available at `http://localhost:3000`

---

## Manual Local Setup

### 1. Database
Run PostgreSQL locally or via Docker:
```bash
docker compose up -d postgres
```

### 2. Backend (Java API)
```bash
cd vaultx-backend
mvn clean install
mvn spring-boot:run
```

### 3. AI Microservice (Python)
```bash
cd vaultx-ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Frontend (React UI)
```bash
cd vaultx-frontend
npm install
npm run dev
```

---

# 📌 Future Enhancements
- Mobile Native Application (Flutter/React Native)
- Document Versioning Control
- Digital Signature Support
- Redis Caching for frequent metadata
- Elasticsearch for advanced search
- Kafka Event Streaming

---

# 👨‍💻 Author
**Hrushikesh More**
GitHub: https://github.com/Hrushi4151

---

# ⭐ Support
If you found this project useful, consider giving it a ⭐ on GitHub.

<div align="center">
### Built with ❤️ using Java Spring Boot, React, and Python
**VaultX Enterprise**
*Secure • Intelligent • Modern*
</div>
