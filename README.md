<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg" alt="VaultX Logo" width="100"/>
  <h1>VaultX Enterprise</h1>
  <p><b>Your Secure Digital Document Vault & Smart AI Engine</b></p>
</div>

<br/>

VaultX is an enterprise-grade document management system designed to be highly secure, completely offline-capable, and intelligently powered. It seamlessly blends the file-management ease of Google Drive with the security of a digital locker and the intelligence of an AI assistant.

---

## ✨ Features

- **Secure Document Management**: Upload, preview, organize, and encrypt files effortlessly.
- **Intelligent Document Engine**: Built-in OCR (Apache Tika + Tesseract) to extract text, paired with an offline AI heuristics engine to automatically categorize files (Passports, Invoices, etc.) and extract metadata without expensive cloud API keys.
- **Smart Bundles**: Group files together for specific life events (e.g., "College Admission", "Visa Application") for lightning-fast retrieval.
- **Enterprise Admin Portal**: A dedicated command center with Chart.js analytics, RBAC (Role-Based Access Control), and comprehensive audit logging.
- **Secure Public Sharing**: Generate time-expiring, tokenized public links for your documents.
- **PDF Processing Toolkit**: Native backend generation and manipulation of PDF files.

## 📸 Screenshots

> *(Placeholders for repository images)*
> - `![Dashboard](/docs/dashboard.png)`
> - `![Smart Search](/docs/search.png)`
> - `![Admin Portal](/docs/admin.png)`

## 🛠️ Tech Stack

### Backend
- **Java 21** & **Spring Boot 3**
- **Spring Security** (Stateless JWT)
- **PostgreSQL 16** (Primary DB & Full-Text Search)
- **MinIO** (S3-compatible Object Storage)
- **Apache Tika & Tess4J** (OCR)

### Frontend
- **React 18** (Vite)
- **Tailwind CSS** (Styling)
- **React Router v6**
- **Axios** (API Client)
- **Chart.js** (Admin Analytics)

## 🚀 Installation & Local Development

### 1. Prerequisites
- Docker & Docker Compose
- Java 21+
- Node.js 18+

### 2. Infrastructure Setup
Spin up the required PostgreSQL and MinIO containers:
```bash
docker-compose up -d
```

### 3. Backend Setup
Navigate to the `vaultx-backend` directory and run the Spring Boot application:
```bash
cd vaultx-backend
mvn clean spring-boot:run
```
*Note: Flyway will automatically run the database migrations on startup.*

### 4. Frontend Setup
Navigate to the `vaultx-frontend` directory and start the Vite dev server:
```bash
cd vaultx-frontend
npm install
npm run dev
```

## 🗺️ Roadmap
- Multi-factor Authentication (MFA)
- Real-time collaborative document editing
- Advanced watermark injection for shared documents
- Desktop/Mobile clients using Tauri or React Native


