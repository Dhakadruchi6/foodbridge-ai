<div align="center">
  <img src="https://img.shields.io/badge/FoodBridge-AI-6366f1?style=for-the-badge&logo=next.js&logoColor=white" alt="FoodBridge AI Logo" />

  <h1>🌍 FoodBridge AI</h1>

  <p>
    An intelligent, geospatial food recovery and logistics platform connecting surplus food with verified NGOs, powered by Machine Learning routing.
  </p>

  <p>
    <a href="https://foodbridge-ai-fg5h-git-main-srikars-projects-3ea730ff.vercel.app/" target="_blank">View Live Application</a>
    ·
    <a href="https://github.com/Srikar-Merugu/foodbridge-ai/issues" target="_blank">Report Bug</a>
    ·
    <a href="https://github.com/Srikar-Merugu/foodbridge-ai/issues" target="_blank">Request Feature</a>
  </p>

  <!-- Badges -->
  <p>
    <a href="#"><img src="https://img.shields.io/github/stars/Srikar-Merugu/foodbridge-ai?style=flat-square&color=blue" alt="Stars" /></a>
    <a href="#"><img src="https://img.shields.io/github/forks/Srikar-Merugu/foodbridge-ai?style=flat-square&color=blue" alt="Forks" /></a>
    <a href="#"><img src="https://img.shields.io/github/issues/Srikar-Merugu/foodbridge-ai?style=flat-square&color=red" alt="Issues" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Next.js-14.1-black?style=flat-square&logo=next.js" alt="Next.js" /></a>
    <a href="#"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB" /></a>
  </p>
</div>

---

## 🚀 Overview

**FoodBridge AI** is an enterprise-grade SaaS application designed to eliminate food waste by creating a highly efficient, data-driven bridge between food donors (individuals, restaurants, corporations) and verified Non-Governmental Organizations (NGOs).

By leveraging a custom Machine Learning scoring algorithm and real-time geospatial routing, FoodBridge ensures that highly perishable food is directed to the nearest available NGO with the capacity to handle it, minimizing spoilage and maximizing humanitarian impact.

---

## ✨ Core Features

*   🧠 **AI-Powered Priority Matching**: A bespoke ML engine calculates an urgency score (0-100) based on food type, quantity, expiry timeframe, and NGO capacity.
*   📍 **Geospatial Distance Enforcement**: Strict mathematical routing ensures donations prioritize a 20km "Green Zone" to drastically reduce logistical overhead and carbon footprints.
*   🔒 **Role-Based Access Control (RBAC)**: Distinct, localized dashboards and permissions for:
    *   **Donors**: Resource Orchestration, active ledger, and AI match initiation.
    *   **NGOs**: Operational Visibility, mission pipelines, and rapid acceptance workflows.
    *   **Administrators**: Governance Control Center, user verification, and network-wide analytics.
*   💳 **"Elevated Flat" UI Design**: A premium interface featuring glassmorphism, precise data tables, status badges, and an uncompromising focus on contrast and typography.
*   🗺️ **Live Delivery Tracking**: Donors and NGOs can monitor the status of accepted donations from creation through transit to successful delivery.

---

## 🛠️ Technology Stack

**Frontend Architecture**:
*   [Next.js 14](https://nextjs.org/) (App Router & Server Actions)
*   [React 18](https://reactjs.org/)
*   [Tailwind CSS](https://tailwindcss.com/) (Elevated Flat Design System)
*   [Lucide Icons](https://lucide.dev/)

**Backend & Data Layer**:
*   **Next.js API Routes** (Serverless backend)
*   [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Primary database)
*   [Mongoose](https://mongoosejs.com/) (ODM schema validation)
*   **JSON Web Tokens (JWT)** (Stateless, secure session management)
*   `nominatim.openstreetmap.org` (Reverse geospatial geocoding)

---

## 💻 Local Installation

To run FoodBridge AI locally, follow these steps:

### Prerequisites
*   Node.js (v18.x or later)
*   npm or yarn
*   A MongoDB Atlas cluster (or local MongoDB string)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Srikar-Merugu/foodbridge-ai.git
   cd foodbridge-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   # Database connection
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   
   # Security Key for authentication
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Use Mock DB for testing (Optional, set to false for production)
   NEXT_PUBLIC_MOCK_DB=false
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to `http://localhost:3000` in your browser.

---

## 🎨 Design Philosophy

FoodBridge AI replaces outdated, "clunky" charity portal aesthetics with an **industry-leading SaaS design**. 

Key elements of our "Elevated Flat" design system include:
- **Sophisticated Color Palette**: Slate grays, deep indigos, and contextual alerts (emerald, amber, rose).
- **High Information Density**: Precise typographic tracking, tabular numbers in tables, and concise "Operational Asset" language.
- **Glassmorphism**: Subtle `backdrop-blur` layers that create a grounded, premium feel for navigation and modal hubs.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  <b>Built with ❤️ to bridge the gap between surplus and scarcity.</b>
</div>
