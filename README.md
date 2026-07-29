<div align="center">

# 🔐 VaultX Enterprise

### Secure Digital Document Vault with Intelligent Document Management

*A modern enterprise-grade document management platform built with Java Spring Boot & React, designed to securely store, organize, process, and share digital documents.*

<p>

![Java](https://img.shields.io/badge/Java-21-red?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)

</p>

</div>

---

# 📖 Overview

VaultX Enterprise is a full-stack document management platform inspired by enterprise digital locker systems such as DigiLocker and Google Drive.

It enables users to securely store, organize, search, process, bundle, and share important documents while providing enterprise-level security, role-based access control, intelligent document analysis, and PDF processing capabilities.

The project demonstrates modern backend architecture using **Spring Boot**, **Spring Security**, **JWT Authentication**, **PostgreSQL**, **MinIO Object Storage**, and a responsive **React** frontend.

---

# ✨ Key Features

## 🔐 Authentication & Security

- JWT Authentication
- Refresh Token Support
- Email OTP Verification
- Password Reset
- Session Management
- Device Session Tracking
- PIN Protection
- BCrypt Password Encryption
- Role-Based Access Control (RBAC)
- Rate Limiting
- Request Logging
- Correlation ID Tracking
- Global Exception Handling

---

## 📁 Document Management

- Upload Documents
- Download Documents
- Delete & Restore Documents
- Trash Management
- Folder / Collection Management
- Categories & Tags
- Metadata Storage
- File Preview
- Version Ready Architecture
- MinIO Object Storage

---

## 📦 Smart Document Bundles

Create grouped document collections for various use cases.

Examples:

- College Admission
- Visa Application
- Passport Renewal
- Job Applications
- Government Verification

Features

- Drag & Drop Ordering
- Bundle Settings
- Bundle Activity Tracking
- Document Reordering
- Multiple Documents per Bundle

---

## 📄 PDF Toolkit

Professional PDF utilities built directly into the application.

- Merge PDFs
- Export Documents to PDF
- Password Protected PDFs
- Watermark PDFs
- PDF Templates
- PDF Settings

---

## 🤖 Intelligent Document Engine

Built-in AI-powered document utilities.

- OCR Processing
- Smart Categorization
- Duplicate Detection
- Metadata Extraction
- AI Insights Dashboard
- Expiring Document Detection
- Intelligent Search

---

## 🔎 Smart Search

Search documents using

- File Name
- Category
- Tags
- OCR Extracted Text
- Metadata
- Collections

---

## 🔗 Secure Document Sharing

Share documents securely using temporary public links.

Features include

- Expiration Date
- Public Token Links
- Download Tracking
- View Tracking
- Access Analytics

---

## 👨‍💼 Enterprise Admin Portal

Administrative dashboard with complete platform monitoring.

Includes

- User Management
- Dashboard Analytics
- System Statistics
- Security Logs
- Activity Monitoring
- Admin Logs

---

## 🔔 Notifications

- In-App Notifications
- Security Alerts
- Document Alerts
- Expiry Notifications

---

## 📊 Dashboard

Interactive dashboard displaying

- Total Documents
- Storage Usage
- Categories
- Recent Activity
- AI Insights
- Shared Documents
- Bundles
- Notifications

---

# 🏗️ Architecture

```
                React Frontend
                       │
                       ▼
              Spring Boot REST API
                       │
 ┌──────────────┬──────────────┬──────────────┐
 │              │              │              │
 ▼              ▼              ▼              ▼
Security     Business      PDF Engine     AI Engine
 Layer         Logic
 │              │
 ▼              ▼
 PostgreSQL   MinIO Object Storage
```

---

# 🛠 Tech Stack

## Backend

- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway Migration
- JWT Authentication
- MapStruct
- Bean Validation
- MinIO Object Storage
- Apache Tika
- Tess4J OCR
- Maven

---

## Frontend

- React 18
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- Context API
- Chart.js

---

## DevOps

- Docker
- Docker Compose
- Git
- GitHub

---

# 📂 Project Structure

```
vaultx/

├── vaultx-backend/
│
├── vaultx-frontend/
│
├── docker-compose.yml
│
└── README.md
```

---

# 🗄 Database

- PostgreSQL
- Flyway Versioned Migrations
- Entity Relationships
- Optimized Indexes

Major entities include

- User
- Role
- Session
- RefreshToken
- Document
- Collection
- Category
- Bundle
- Share
- Notification
- SecurityLog
- PDF Export
- OCR Result

---

# 🔒 Security Features

- Stateless JWT Authentication
- Refresh Token Rotation
- BCrypt Password Encryption
- Secure Password Reset
- Email Verification
- Request Rate Limiting
- Role-Based Authorization
- Correlation IDs
- Request Logging
- Exception Handling
- Input Validation

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Hrushi4151/VaultX.git

cd VaultX
```

---

## Backend

```bash
cd vaultx-backend

mvn clean install

mvn spring-boot:run
```

---

## Frontend

```bash
cd vaultx-frontend

npm install

npm run dev
```

---

## Docker

```bash
docker compose up -d
```

---

# 📌 Future Enhancements

- Face Authentication
- Biometric Login
- Mobile Application
- Document Versioning
- Digital Signature Support
- OCR Accuracy Improvements
- AI Chat Assistant
- Redis Caching
- Elasticsearch
- Kafka Event Streaming
- Multi-language Support

---

# 🎯 Learning Outcomes

This project demonstrates practical experience with

- Enterprise Backend Development
- Clean Architecture
- REST API Design
- Authentication & Authorization
- Object Storage
- PDF Processing
- OCR Integration
- Spring Security
- Database Design
- React Application Development
- Docker Deployment

---

# 👨‍💻 Author

**Hrushikesh More**

GitHub: https://github.com/Hrushi4151

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

---

<div align="center">

### Built with ❤️ using Java Spring Boot & React

**VaultX Enterprise**

*Secure • Intelligent • Modern*

</div>
