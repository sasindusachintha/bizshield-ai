# 🧠 BizShield AI — Project Workspace System

BizShield AI is an AI-powered business platform that helps users generate ideas, create business plans, marketing strategies, and manage everything inside structured **Projects**.

Each user can create multiple projects, and every AI output is saved inside that project for easy tracking and management.

---

## 🚀 Features

### 🟢 Growth Mode
- Generate business ideas
- Create business plans
- Generate marketing content
- Save everything into projects

### 📁 Project Workspace
- Each idea becomes a Project
- All AI outputs are saved as documents
- Full history of work is stored per project
- Easy project-based organization

### 📊 Dashboard
- View total projects
- Track generated ideas
- View activity history
- Monitor all AI outputs

---

## 🧠 How It Works (Simple Flow)

1. User enters idea or business details  
2. AI generates outputs (ideas, plans, marketing, analysis)  
3. System automatically stores everything inside a **Project**  
4. Each output is saved as a **Project Document**  
5. User can open a project anytime and view full history  

---

## 📁 Project Structure

- Each user has multiple **Projects**
- Each Project contains:
  - Idea documents
  - Business plans
  - Marketing content
  - Analysis reports

---

## ⚙️ How to Run the Project

### 1. Clone the repository
```bash
git clone https://github.com/your-username/bizshield-ai.git
cd bizshield-ai
2. Install dependencies
Backend
cd backend
npm install
Frontend
cd ../frontend
npm install
3. Setup environment variables

Create .env file in backend:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key

4. Run the project
Start backend
cd backend
npm run dev
Start frontend
cd frontend
npm start

 ```

💾 Database
MongoDB is used to store:
Users
Projects
Project Documents
Activity Logs

📌 Important Notes
Every AI output is automatically saved inside a Project
Nothing is lost — full history is preserved
Old "My Ideas" system is replaced by Project Workspace
System is backward compatible with existing data
🏆 Purpose of This System

BizShield AI helps users:

Turn ideas into structured projects.
Track business growth steps.
Organize AI-generated business intelligence.
Manage everything in one workspace.

👨‍💻 Developed For
Final Year IT Project — AI Business Intelligence System
