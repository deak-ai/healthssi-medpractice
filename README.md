# MedPractice Reception Agent

## Overview

The MedPractice Reception Agent is an AI-powered reception system for medical practices, built on Flowbite, HUGO, Tailwind CSS and the OpenAI Realtime API.
This application provides an intelligent interface for patient registration using Self-Sovereign Identity (SSI) technology.

The Reception Agent enables patients to share their health information securely with medical practices through the following workflow:

1. An AI assistant engages with the patient to guide them through the registration process
2. The system generates an OpenID4VP (OpenID for Verifiable Presentations) request
3. This request is rendered as a QR code on the reception interface
4. Patients scan the QR code with their [HealthWallet-IPS](https://github.com/deak-ai/healthwallet-ips) mobile application
5. Patients select which health information they want to share with the practice
6. The shared information is securely transmitted and displayed in the reception interface

## Key Features

- **AI-Powered Reception Assistant**: Uses OpenAI's real-time API for natural language interaction with patients
- **Secure Health Information Sharing**: Implements OpenID4VP for verifiable credential presentation
- **QR Code Generation**: Creates QR codes to facilitate mobile wallet interaction
- **Comprehensive Health Information Display**: Presents patient information in an organized, readable format
- **Real-Time Event Logging**: Tracks all system events during patient interaction

## Technologies Used

- **Frontend Framework**: [Flowbite](https://flowbite.com/) components with [Tailwind CSS](https://tailwindcss.com/)
- **Static Site Generator**: [HUGO](https://gohugo.io/)
- **JavaScript Libraries**:
  - [Valtio](https://github.com/pmndrs/valtio) for state management
- **Backend Integration**:
  - [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) for conversational AI
  - [Practice Information System (PIS)](https://github.com/deak-ai/healthwallet/tree/main/server) API for OpenID4VP credential handling
## Prerequisites

- Node.js (v14 or higher)
- npm (v7 or higher)
- OpenAI API key

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/deak-ai/healthssi-medpractice.git
   cd healthssi-medpractice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run start
   ```

5. Access the application in your browser at `http://localhost:1313`

## Usage

1. Navigate to the Reception page in the application
2. Click the "Start Session" button to activate the AI assistant
3. Interact with the assistant to begin the registration process
4. When prompted, a QR code will be displayed on the screen
5. Scan the QR code with the [HealthWallet-IPS](https://github.com/deak-ai/healthwallet-ips) mobile application
6. Select which health information to share with the practice
7. View the shared health information displayed in the interface

## Related Projects

- [HealthWallet IPS](https://github.com/deak-ai/healthwallet-ips): Mobile wallet application for managing and sharing health information
- [Health SSI V2](https://github.com/Abdagon/health-ssi-2): Umbrella project linking to several Digital Health with Self-Sovereign Identity (SSI) initiatives

## License

[MIT License](LICENSE)
