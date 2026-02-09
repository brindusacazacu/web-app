// =========================
// API + Session (MongoDB Atlas via backend)
// =========================
const API_BASE = "/api";

const SESSION_KEYS = {
    TOKEN: "recipes_token",
    USER: "recipes_user",
};

function getToken() {
    return localStorage.getItem(SESSION_KEYS.TOKEN);
}

function setSession(token, user) {
    const normalized = { ...user, id: user.id || user._id };
    localStorage.setItem(SESSION_KEYS.TOKEN, token);
    localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(normalized));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEYS.TOKEN);
    localStorage.removeItem(SESSION_KEYS.USER);
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEYS.USER));
    } catch {
        return null;
    }
}

function logout() {
    clearSession();
}

/* =========================
   Normalization
========================= */
function normIngredient(s) {
    return String(s || "")
        .toLowerCase()
        .replaceAll("ă", "a")
        .replaceAll("â", "a")
        .replaceAll("î", "i")
        .replaceAll("ș", "s")
        .replaceAll("ş", "s")
        .replaceAll("ț", "t")
        .replaceAll("ţ", "t")
        .trim();
}

function normText(s) {
  return normIngredient(s); // aceeași normalizare (diacritice + lowercase)
}

function parseUserIngredients(input) {
    // Acceptă: "pui, unt, rosii pasate"
    return String(input || "")
        .split(",")
        .map(x => normIngredient(x))
        .filter(Boolean);
}

// Parsează ingrediente principale din textarea: "ingredient - gramaj"
function parseMainIngredients(text) {
    const lines = String(text || "")
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    // fiecare linie: "ingredient - 500 g" (dash optional)
    const items = [];
    for (const line of lines) {
        const parts = line.split("-").map(p => p.trim()).filter(Boolean);
        if (parts.length === 1) {
            items.push({ name: parts[0], qty: "" });
        } else {
            items.push({ name: parts[0], qty: parts.slice(1).join(" - ") });
        }
    }
    return items;
}

function parseSecondaryIngredients(text) {
    // listă simplă separată prin virgulă sau linii
    const raw = String(text || "").trim();
    if (!raw) return [];
    return raw
        .split(/,|\n/g)
        .map(x => x.trim())
        .filter(Boolean);
}

/* =========================
   Recipes data
========================= */
async function fetchRecipes() {
    const r = await fetch(`${API_BASE}/recipes`);
    if (!r.ok) throw new Error("Nu pot încărca rețetele.");
    return await r.json();
}

async function createRecipeAPI(recipe) {
    const token = getToken();
    const r = await fetch(`${API_BASE}/recipes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(recipe),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Eroare la creare rețetă.");
    return data;
}

async function updateRecipeAPI(id, recipe) {
    const token = getToken();
    const r = await fetch(`${API_BASE}/recipes/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(recipe),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Eroare la update rețetă.");
    return data;
}

async function deleteRecipeAPI(id) {
    const token = getToken();
    if (!token) throw new Error("Trebuie să fii logată.");
    const r = await fetch(`${API_BASE}/recipes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Eroare la ștergere rețetă.");
    return data;
}

/* =========================
   Filtering logic
   - recipe is match if ALL required main ingredients are in user's list
========================= */
function recipeMatches(recipe, userHaveList) {
    const haveSet = new Set(userHaveList.map(normIngredient));
    const required = recipe.mainIngredients.map(mi => normIngredient(mi.name));

    // dacă utilizatorul nu a introdus nimic, nu filtrăm
    if (haveSet.size === 0) return true;

    // match dacă fiecare ingredient principal din rețetă e prezent la utilizator
    return required.every(req => haveSet.has(req));
}

/* =========================
   UI rendering (index)
========================= */
function el(id) { return document.getElementById(id); }
let editingRecipeId = null;

function updateAddFormAccess() {
    const user = getCurrentUser();
    const form = el("addRecipeForm");
    const notice = el("addRecipeNotice");
    const seedBtn = el("seedBtn");

    if (!form || !notice) return;

    const controls = form.querySelectorAll("input, textarea, button[type='submit']");
    const isGuest = !user;

    // Guest: blochează postarea
    controls.forEach(c => (c.disabled = isGuest));
    if (seedBtn) seedBtn.disabled = true;

    if (isGuest) {
        notice.style.display = "block";
        notice.textContent = "Trebuie să fii logată ca să poți posta sau modifica rețete. Poți folosi aplicația ca Guest doar pentru vizualizare/filtrare.";
    } else {
        notice.style.display = "none";
        notice.textContent = "";
    }
}

function renderUserHeader() {
    const user = getCurrentUser();
    const hello = el("helloUser");
    const loginBtn = el("loginBtn");
    const signupBtn = el("signupBtn");
    const logoutBtn = el("logoutBtn");

    if (!hello) return;

    if (user) {
        hello.textContent = `Salut, ${user.name || user.email}!`;
        loginBtn && (loginBtn.style.display = "none");
        signupBtn && (signupBtn.style.display = "none");
        logoutBtn && (logoutBtn.style.display = "inline-flex");
    } else {
        hello.textContent = "Mod: Guest";
        loginBtn && (loginBtn.style.display = "inline-flex");
        signupBtn && (signupBtn.style.display = "inline-flex");
        logoutBtn && (logoutBtn.style.display = "none");
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            logout();
            location.reload();
        };
    }
}

function recipeCard(recipe) {
    const div = document.createElement("div");
    div.className = "recipe-card";
    div.innerHTML = `
    <img class="recipe-thumb" src="${escapeAttr(recipe.imageUrl)}" alt="${escapeAttr(recipe.name)}">
    <div class="recipe-card-body">
      <div class="recipe-title">${escapeHTML(recipe.name)}</div>
      <div class="recipe-meta">
        <span class="badge">⏱ ${recipe.timeMinutes} min</span>
        <span class="badge">🍽 ${recipe.servings} porții</span>
        ${recipe.category ? `<span class="badge">🏷 ${escapeHTML(recipe.category)}</span>` : ""}
      </div>
    </div>
  `;
    div.addEventListener("click", () => openRecipeModal(recipe));
    return div;
}

function escapeHTML(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function escapeAttr(str) {
    return escapeHTML(str).replaceAll("\n", " ");
}

function setResultsMeta(total, shown, filtered) {
    const title = el("resultsTitle");
    const meta = el("resultsMeta");
    if (!title || !meta) return;

    title.textContent = filtered ? "Rețete potrivite" : "Toate rețetele";
    meta.textContent = `${shown} din ${total}`;
}

function renderFilterChips(list) {
    const chips = el("activeFilterChips");
    if (!chips) return;
    chips.innerHTML = "";
    list.forEach(x => {
        const c = document.createElement("span");
        c.className = "chip";
        c.textContent = x;
        chips.appendChild(c);
    });
}

function renderRecipes(recipes) {
  const grid = el("recipesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  // opțional: sortează după nr de ingrediente
  const list = [...recipes].sort((a, b) => a.mainIngredients.length - b.mainIngredients.length);

  list.forEach(r => grid.appendChild(recipeCard(r)));
}

function openRecipeModal(recipe) {
    const modal = el("recipeModal");
    const body = el("modalBody");
    const title = el("modalTitle");
    if (!modal || !body || !title) return;

    document.body.classList.add("modal-open");

    title.textContent = recipe.name;

    const user = getCurrentUser();
    const ownerEmail = recipe.createdBy?.email || recipe.createdByEmail || null;
    const ownerId = recipe.createdBy?._id || recipe.createdBy || null;

    const isOwner = !!user && (
        (ownerEmail && ownerEmail === user.email) ||
        (user.id && ownerId && String(ownerId) === String(user.id))
    );


    const mainList = recipe.mainIngredients
        .map(i => `<li><b>${escapeHTML(i.name)}</b>${i.qty ? ` — ${escapeHTML(i.qty)}` : ""}</li>`)
        .join("");

    const secondary = (recipe.secondaryIngredients || []).length
        ? `<h4>Ingrediente secundare</h4>
       <ul class="list">${recipe.secondaryIngredients.map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ul>`
        : `<p class="muted">Fără ingrediente secundare.</p>`;

    body.innerHTML = `
    <div class="modal-grid">
      <div>
        <img class="modal-img" src="${escapeAttr(recipe.imageUrl)}" alt="${escapeAttr(recipe.name)}">
        <div class="small-actions">
            <button class="btn ghost" id="useIngredientsBtn">Folosește ingredientele din rețetă la filtrare</button>
            ${isOwner ? `<button class="btn ghost" id="editRecipeBtn">Editează rețeta</button>` : ``}
            ${isOwner ? `<button class="btn danger" id="deleteRecipeBtn">Șterge rețeta</button>` : ``}
        </div>

        ${!isOwner ? `<p class="muted tiny">Doar autorul rețetei poate edita/șterge.</p>` : ``}

        <p class="muted tiny">Ștergerea este definitivă.</p>
      </div>

      <div>
        <div class="card">
          <div class="recipe-meta" style="margin-top:0">
            <span class="badge">⏱ ${recipe.timeMinutes} min</span>
            <span class="badge">🍽 ${recipe.servings} porții</span>
          </div>
          ${recipe.category ? `<p class="muted">Categorie: <b>${escapeHTML(recipe.category)}</b></p>` : ""}

          <h4>Ingrediente principale</h4>
          <ul class="list">${mainList}</ul>

          ${secondary}

          <h4>Preparare</h4>
          <p>${escapeHTML(recipe.description).replaceAll("\n", "<br>")}</p>
        </div>
      </div>
    </div>
  `;

    modal.setAttribute("aria-hidden", "false");

    // Events inside modal
    el("useIngredientsBtn")?.addEventListener("click", () => {
        const names = recipe.mainIngredients.map(i => i.name).join(", ");
        const input = el("haveInput");
        if (input) {
            input.value = names;
            applyFilter();
            closeModal();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    if (isOwner) {
        el("editRecipeBtn")?.addEventListener("click", () => {
            // umple formularul cu datele rețetei
            editingRecipeId = recipe._id || recipe.id;

            el("rName").value = recipe.name || "";
            el("rImage").value = recipe.imageUrl || "";
            el("rTime").value = recipe.timeMinutes || "";
            el("rServings").value = recipe.servings || "";
            el("rCategory").value = recipe.category || "";

            el("rMain").value = (recipe.mainIngredients || [])
                .map(i => `${i.name}${i.qty ? " - " + i.qty : ""}`)
                .join("\n");

            el("rSecondary").value = (recipe.secondaryIngredients || []).join(", ");
            el("rDesc").value = recipe.description || "";

            el("saveRecipeBtn").textContent = "Actualizează rețeta";
            el("cancelEditBtn").style.display = "inline-flex";

            closeModal();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        el("deleteRecipeBtn")?.addEventListener("click", async () => {
            if (!confirm("Sigur vrei să ștergi rețeta?")) return;

            try {
                await deleteRecipeAPI(recipe._id || recipe.id);
                closeModal();
                await applyFilter();
            } catch (err) {
                alert(err.message || "Eroare la ștergere.");
            }
        });
    }
}

function closeModal() {
    const modal = el("recipeModal");
    modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

async function applyFilter() {
  const input = el("haveInput");
  const list = parseUserIngredients(input?.value || "");

  const nameQ = normText(el("nameInput")?.value || ""); // <-- nou

  renderFilterChips(list);

  try {
    const recipes = await fetchRecipes();

    // 1) filtrare după ingrediente (cum ai deja)
    let filtered = recipes.filter(r => recipeMatches(r, list));

    // 2) filtrare după nume (nou)
    if (nameQ) {
      filtered = filtered.filter(r => normText(r.name).includes(nameQ));
    }

    // randare + meta corect
    renderRecipes(filtered, []); // randăm lista deja filtrată
    setResultsMeta(recipes.length, filtered.length, (list.length > 0 || !!nameQ));

  } catch (err) {
    alert(err.message || "Nu pot încărca rețetele. Verifică serverul.");
    renderRecipes([], []);
    setResultsMeta(0, 0, true);
  }
}

/* =========================
   Add recipe
========================= */
async function addRecipeFromForm(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        alert("Trebuie să fii logată ca să postezi sau să modifici rețete.");
        return;
    }

    const name = el("rName").value.trim();
    const imageUrl = el("rImage").value.trim();
    const timeMinutes = Number(el("rTime").value);
    const servings = Number(el("rServings").value);
    const category = el("rCategory").value.trim();

    const mainIngredients = parseMainIngredients(el("rMain").value);
    const secondaryIngredients = parseSecondaryIngredients(el("rSecondary").value);
    const description = el("rDesc").value.trim();

    if (!name || !imageUrl || !description) {
        alert("Completează toate câmpurile obligatorii.");
        return;
    }
    if (!Number.isFinite(timeMinutes) || timeMinutes <= 0) return;
    if (!Number.isFinite(servings) || servings <= 0) return;
    if (!mainIngredients.length) {
        alert("Adaugă cel puțin un ingredient principal.");
        return;
    }

    const payload = {
        name,
        imageUrl,
        timeMinutes,
        servings,
        category,
        mainIngredients,
        secondaryIngredients,
        description,
    };

    try {
        if (editingRecipeId) {
            await updateRecipeAPI(editingRecipeId, payload);
            editingRecipeId = null;
            el("saveRecipeBtn").textContent = "Salvează rețeta";
            el("cancelEditBtn").style.display = "none";
        } else {
            await createRecipeAPI(payload);
        }

        e.target.reset();
        await applyFilter();
    } catch (err) {
        alert(err.message || "Eroare.");
    }
}

/* =========================
   Page init
========================= */
function initIndexPage() {
  renderUserHeader();
  updateAddFormAccess();
  applyFilter();

  // Filtrare (buton)
  el("applyFilterBtn")?.addEventListener("click", () => applyFilter());

  // Filtrare live (tastezi și se aplică automat)
  el("nameInput")?.addEventListener("input", () => applyFilter());
  el("haveInput")?.addEventListener("input", () => applyFilter());

  // Reset filtre (curăță și numele și ingredientele)
  el("clearFilterBtn")?.addEventListener("click", () => {
    const have = el("haveInput");
    if (have) have.value = "";

    const name = el("nameInput");
    if (name) name.value = "";

    applyFilter();
  });

  // Adăugare / editare rețetă (submit form)
  el("addRecipeForm")?.addEventListener("submit", addRecipeFromForm);

  // Modal close (buton X)
  el("closeModalBtn")?.addEventListener("click", closeModal);

  // Modal close (click pe backdrop)
  el("recipeModal")?.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t && t.dataset && t.dataset.close === "true") closeModal();
  });

  // Modal close (ESC)
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeModal();
  });

  // Anulează editarea
  el("cancelEditBtn")?.addEventListener("click", () => {
    editingRecipeId = null;

    el("addRecipeForm")?.reset();

    const saveBtn = el("saveRecipeBtn");
    if (saveBtn) saveBtn.textContent = "Salvează rețeta";

    const cancelBtn = el("cancelEditBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
  });
}

function initLoginPage() {
    const form = document.getElementById("loginForm");
    const err = document.getElementById("loginError");

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.style.display = "none";

        const email = form.querySelector("#email").value;
        const password = form.querySelector("#password").value;

        try {
            const r = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || "Eroare la login.");

            setSession(data.token, data.user);
            location.href = "index.html";
        } catch (ex) {
            err.textContent = ex.message || "Eroare la login.";
            err.style.display = "block";
        }
    });
}

function initSignupPage() {
    const form = document.getElementById("signupForm");
    const err = document.getElementById("signupError");

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.style.display = "none";

        const name = form.querySelector("#name").value;
        const email = form.querySelector("#email").value;
        const password = form.querySelector("#password").value;

        try {
            const r = await fetch(`${API_BASE}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || "Eroare la signup.");

            setSession(data.token, data.user);
            location.href = "index.html";
        } catch (ex) {
            err.textContent = ex.message || "Eroare la signup.";
            err.style.display = "block";
        }
    });
}

/* =========================
   Boot
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const page = window.__PAGE__ || "index";
    if (page === "login") initLoginPage();
    else if (page === "signup") initSignupPage();
    else initIndexPage();
});
