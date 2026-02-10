🍲 Aplicație Web Rețete

Aplicație web pentru gestionarea rețetelor culinare, care permite utilizatorilor să vizualizeze, filtreze, adauge, editeze și șteargă rețete, cu autentificare și stocare în MongoDB Atlas.

Aplicația poate fi folosită și în mod Guest (fără cont), cu acces doar la vizualizare și filtrare.

# ------------------------------------------------------------------------------------------------------------------------
✨ Funcționalități
🔓 Mod Guest

    Vizualizare rețete
    Filtrare rețete după ingredientele principale disponibile
    Vizualizare detalii rețetă

🔐 Utilizator autentificat

    Creare cont (Signup)
    Autentificare (Login)
    Adăugare rețete noi
    Editare și ștergere doar a rețetelor proprii
    Toate datele sunt salvate în MongoDB Atlas

# ------------------------------------------------------------------------------------------------------------------------
🧠 Logica de filtrare

Utilizatorul introduce ingredientele pe care le are, iar aplicația afișează doar rețetele pentru care nu lipsește niciun ingredient principal.

👉 Sunt acceptate ingrediente în plus, dar nu sunt acceptate rețete care cer ingrediente lipsă.

# ------------------------------------------------------------------------------------------------------------------------
🧾 Structura unei rețete

O rețetă conține obligatoriu:
    Denumire
    Imagine (URL)
    Ingrediente principale (cu gramaje)
    Descriere (mod de preparare)
    Timp de preparare (minute)
    Număr de porții

Opțional:
    Ingrediente secundare (ex: condimente)

# ------------------------------------------------------------------------------------------------------------------------
🛠️ Tehnologii folosite
Frontend

    HTML5
    CSS3
    JavaScript (Vanilla)
    Backend
    Node.js
    Express.js
    JWT (autentificare)
    MongoDB Atlas (bază de date)
    Mongoose

# ------------------------------------------------------------------------------------------------------------------------
📁 Structura proiectului

web-app/
├─ client/
│  ├─ index.html
│  ├─ login.html
│  ├─ signup.html
│  ├─ app.js
│  └─ styles.css
│
└─ server/
   ├─ src/
   │  ├─ server.js
   │  ├─ db.js
   │  ├─ routes/
   │  │  ├─ auth.js
   │  │  └─ recipes.js
   │  ├─ models/
   │  │  ├─ User.js
   │  │  └─ Recipe.js
   │  └─ middleware/
   │     └─ auth.js
   ├─ .env
   └─ package.json

# ------------------------------------------------------------------------------------------------------------------------
⚙️ Configurare și rulare locală

1️⃣ Clonează proiectul
```sh
    git clone <repo-url>
    cd web-app
 ```
2️⃣ Instalează dependențele backend
```sh
    cd server
    npm install
```
3️⃣ Creează fișierul .env
```sh
    PORT=4000
    MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/retete
    JWT_SECRET=super_secret_key
```
4️⃣ Pornește serverul
```sh
    npm run dev
```
5️⃣ Deschide aplicația
    Accesează în browser: http://localhost:4000

# ------------------------------------------------------------------------------------------------------------------------
🔑 Autentificare & securitate

Autentificare bazată pe JWT
Token-ul este salvat în localStorage
Rutele de creare/editare/ștergere sunt protejate
Un utilizator poate modifica doar propriile rețete