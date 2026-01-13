# How to Run the Project Locally

> A step-by-step guide to clone, set up, and run the project locally for development and testing.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Git** (latest version)
- **Node.js** (v22.x or later recommended)
- **pnpm** (package manager)

#### Tested Versions
This project has been tested with the following software versions:
- **Node.js:** `22.18.0` & `24.12.0`
- **pnpm:** `10.26.2` & `10.20.0`
- **npm:** `11.6.2` (for installing pnpm)

#### Install pnpm
If you don't have `pnpm` installed, you can install it globally via `npm`:
```bash
npm install -g pnpm
```

---

## 2. Setup Instructions

### Step 1: Clone the Repository
Open your terminal, navigate to the directory where you want to store the project, and run the following command:
```bash
git clone https://github.com/Nathanofzion/zi-playground
```

### Step 2: Open in VS Code
Navigate into the newly created project folder and open it in Visual Studio Code:
```bash
cd zi-playground
code .
```

### Step 3: Switch to the Correct Branch
This project's active development happens on the `remote` branch. Switch to it and pull the latest changes:
```bash
git checkout remote
git pull origin remote
```

### Step 4: Install Dependencies
Install all project dependencies using `pnpm`. This may take a few minutes.
```bash
pnpm install
```

### Step 5: Run the Development Server
Start the local Next.js development server.
```bash
pnpm dev
```
Once it starts, your terminal will show that the application is running, usually on `http://localhost:3000`.

---

## 3. Accessing the Application

Open **Google Chrome** (recommended) and navigate to the local URL:
```
http://localhost:3000
```
The application should now be running locally.

---

## 4. Live Demo & Resources

### Live Deployed Version
A live version of the project is deployed and available for testing core functionality like Passkeys and airdrops.
> **URL:** [https://zi-playground.netlify.app/](https://zi-playground.netlify.app/)

### Demo Videos
For a walkthrough of the airdrop flow and project setup, please refer to the demo videos in this Google Drive folder.
> **URL:** [https://drive.google.com/drive/folders/1eOX4H2-43ChM9u0oB7iOAkiUnay6D8x4?usp=sharing](https://drive.google.com/drive/folders/1eOX4H2-43ChM9u0oB7iOAkiUnay6D8x4?usp=sharing)

---

## 5. Important Notes

- **Port Conflict:** Ensure no other application on your machine is using port `3000`.
- **Supabase & Docker:** The backend **Supabase instance is already deployed and configured**. You do not need to run Supabase or Docker locally for this project to work.
- **Wallet Credentials:** Before testing Passkey functionality, it's recommended to delete any previous wallet information stored in your **Google Password Manager** to avoid conflicts.
- **Future Updates:** To get the latest code updates in the future, simply run `git pull origin remote` from within the `remote` branch.