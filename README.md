<div align="center">

# VaultX

### Enterprise Secure Digital Document Management Platform

*A production-ready full-stack document management platform built with **Java 21**, **Spring Boot 3**, **React.js**, **PostgreSQL**, and **MinIO**.*

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-success)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![MinIO](https://img.shields.io/badge/MinIO-Object%20Storage-C72E29)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

# 📖 Overview

VaultX is a **production-ready enterprise document management platform** designed to securely store, organize, process, and share digital documents through a modern SaaS experience.

Inspired by **DigiLocker, Google Drive, Dropbox, and Adobe Acrobat**, VaultX combines secure object storage, intelligent document organization, advanced PDF processing, OCR-powered document search, reusable document bundles, and enterprise-grade security into a single application.

The project demonstrates modern software engineering practices including **Clean Architecture**, **RESTful API design**, **JWT Authentication**, **Role-Based Access Control (RBAC)**, **Dockerized deployment**, and scalable backend development using Spring Boot.

---

# ✨ Features

## 🔐 Authentication & Security

- JWT Authentication
- Refresh Token Authentication
- Email Verification
- Forgot Password
- Reset Password
- Change Password
- BCrypt Password Encryption
- Role-Based Access Control (RBAC)
- Vault PIN Security
- Session Management
- Login History
- Multi-device Login
- Security Audit Logs

---

## 📂 Secure Document Management

- Single & Multiple File Upload
- Drag & Drop Upload
- Secure Object Storage using MinIO
- File Preview
- Rename Documents
- Archive & Restore
- Soft Delete & Recycle Bin
- Favorites
- Categories
- Tags
- Collections
- Duplicate Detection
- SHA-256 File Integrity Verification
- Search & Filtering

---

## 🎓 Smart Student Toolkit

Organize documents into reusable bundles for common workflows.

### Built-in Templates

- Placement
- Internship
- Scholarship
- Higher Education
- Government Verification
- Visa Application
- Job Application
- Personal Documents

### Features

- Create Custom Bundles
- Drag & Drop Document Ordering
- Bundle Templates
- Bundle Preview
- Favorite Bundles
- Bundle History

---

## 📄 PDF Toolkit

- Merge PDFs
- Merge Images into PDF
- Split PDF
- Rearrange Pages
- Rotate Pages
- Extract Pages
- Delete Pages
- Watermark
- Cover Page Generation
- Automatic Table of Contents
- Page Numbering
- Password Protected PDFs
- PDF Compression
- Export History

---

## 🔍 OCR & Document Intelligence

- OCR Text Extraction
- Search Inside Scanned Documents
- Metadata Extraction
- Smart Document Categorization
- Duplicate Detection
- Document Type Recognition
- Expiry Detection
- Smart Tags
- Smart Search

---

## 🔗 Secure Sharing

- Public Share Links
- Password Protected Links
- QR Code Sharing
- Download Limits
- Link Expiration
- View Only Mode
- Email Sharing
- Share Analytics
- Document Verification Page

---

## 👨‍💼 Enterprise Admin Portal

- User Management
- Document Management
- Category Management
- Storage Analytics
- Audit Logs
- Security Dashboard
- System Settings
- Platform Monitoring

---

# 🏗 System Architecture

```text
                    React.js Frontend
                           │
                           ▼
                  Spring Boot REST API
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
 PostgreSQL Database                 MinIO Object Storage
```

---

# 📦 Tech Stack

## Backend

- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Hibernate
- PostgreSQL
- MinIO
- JWT Authentication
- BCrypt Password Encoder
- Apache PDFBox
- Apache Tika
- Tess4J (Tesseract OCR)
- MapStruct
- Bean Validation
- Swagger / OpenAPI
- Maven

---

## Frontend

- React.js
- JavaScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- React DnD
- PDF.js
- Lucide React

---

## DevOps & Tools

- Docker
- Docker Compose
- Git
- GitHub
- IntelliJ IDEA
- Postman

---

# 📁 Project Structure

```text
VaultX
│
├── vaultx-backend
│   ├── src
│   │   ├── config
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── exception
│   │   ├── mapper
│   │   ├── repository
│   │   ├── security
│   │   ├── service
│   │   └── util
│   ├── Dockerfile
│   └── pom.xml
│
├── vaultx-frontend
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── context
│   │   ├── hooks
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── styles
│   │   └── utils
│   └── package.json
│
├── docs
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   └── screenshots
│
├── docker-compose.yml
└── README.md
```

---

# 📸 Screenshots

> Screenshots will be added after the UI implementation.

- Landing Page
- Authentication
- Dashboard
- Document Explorer
- PDF Toolkit
- Smart Bundles
- OCR Search
- Secure Sharing
- Admin Portal

---

# 🚀 Getting Started

## Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL
- Docker
- Docker Compose
- Maven

---

## Clone Repository

```bash
git clone https://github.com/<your-username>/vaultx.git

cd vaultx
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

## Run using Docker

```bash
docker-compose up --build
```

---

# 📚 API Documentation

Swagger UI

```
http://localhost:8080/swagger-ui/index.html
```

OpenAPI JSON

```
http://localhost:8080/v3/api-docs
```

---

# 🎯 Project Highlights

- Enterprise-grade architecture
- Clean Architecture
- SOLID Principles
- RESTful API Design
- JWT Authentication
- Object Storage with MinIO
- OCR-powered Document Search
- Advanced PDF Processing
- Secure Document Sharing
- Responsive React.js UI
- Dockerized Deployment
- Modular Codebase
- Production-ready Backend

---

# 🚀 Future Enhancements

- Multi-Factor Authentication (MFA)
- AI-powered Document Assistant
- Digital Signature Integration
- Mobile Application
- Workflow Automation
- Version Comparison
- Real-time Notifications
- Cloud Storage Integrations
- Desktop Client

---

# 📖 Learning Outcomes

This project demonstrates practical experience with:

- Enterprise Java Development
- Spring Boot
- Spring Security
- JWT Authentication
- REST API Development
- PostgreSQL
- Object Storage
- OCR Processing
- PDF Processing
- React.js
- Tailwind CSS
- Docker
- Clean Architecture
- SOLID Principles
- Full Stack Development

---

# 👨‍💻 Author

**Hrushikesh More**

## ⭐ Support

If you found this project useful, consider giving it a **⭐ Star** on GitHub.
