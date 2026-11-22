
const app = document.getElementById("app");

const SERVICES = [
  ["🛣️", "सड़क निर्माण", "sadak"],
  ["🏠", "प्रधानमंत्री आवास", "awas"],
  ["🚰", "नाली एवं जल निकासी", "nali"],
  ["💧", "पेयजल व्यवस्था", "pani"],
  ["💡", "स्ट्रीट लाइट", "street-light"],
  ["👷", "मनरेगा कार्य", "mnrega"],
  ["📋", "सरकारी योजनाएं", "yojana"],
  ["🌳", "ग्राम विकास कार्य", "vikas-karya"],
  ["🍚", "राशन कार्ड", "ration-card"],
  ["👴", "पेंशन योजना", "pension"],
  ["📚", "शिक्षा", "education"],
  ["🏥", "स्वास्थ्य", "health"],
  ["💰", "बजट एवं खर्च", "budget"],
  ["📸", "फोटो गैलरी", "gallery"],
  ["📄", "दस्तावेज", "documents"],
  ["📰", "समाचार", "news"],
  ["📢", "सूचनाएं", "notices"]
];

const CATEGORY_NAMES = Object.fromEntries(
  SERVICES.map(item => [item[2], item[1]])
);

let currentUser = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function toast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 3000);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "कुछ गलत हो गया।");
  }

  return data;
}

function go(path) {
  history.pushState({}, "", path);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const link = event.target.closest("a[href]");

  if (!link) return;

  const url = new URL(link.href, location.origin);

  if (
    url.origin === location.origin &&
    !link.hasAttribute("target") &&
    !link.hasAttribute("download")
  ) {
    event.preventDefault();
    go(url.pathname + url.search);
  }
});

window.addEventListener("popstate", render);

function pageTitle(title, description = "") {
  return `
    <div class="page-title">
      <h2>${esc(title)}</h2>
      ${description ? `<p class="muted">${esc(description)}</p>` : ""}
    </div>
  `;
}

function serviceCards() {
  return SERVICES.map(([icon, title, path]) => `
    <a class="card service-card" href="/${path}">
      <div class="service-icon">${icon}</div>
      <h3>${esc(title)}</h3>
      <p>जानकारी और उपलब्ध अपडेट देखें</p>
    </a>
  `).join("");
}

function homePage() {
  return `
    <section class="hero">
      <h2>ग्राम पंचायत पंडुवा में आपका स्वागत है 🏡</h2>
      <p>
        बारा, प्रयागराज, उत्तर प्रदेश की ग्राम पंचायत की जानकारी,
        विकास कार्य, सरकारी योजनाएं, समाचार और शिकायत सेवाएं अब ऑनलाइन।
      </p>
      <div class="hero-actions">
        <a class="btn btn-orange" href="/vikas-karya">विकास कार्य देखें</a>
        <a class="btn btn-light" href="/complaint">शिकायत दर्ज करें</a>
        <a class="btn btn-light" href="/track-complaint">शिकायत ट्रैक करें</a>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>पंचायत की प्रमुख सेवाएं</h2>
        <a href="/services">सभी सेवाएं देखें →</a>
      </div>
      <div class="grid">${serviceCards()}</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>नवीनतम समाचार</h2>
        <a href="/news">सभी समाचार →</a>
      </div>
      <div id="home-news" class="grid">
        <div class="empty">समाचार लोड हो रहे हैं...</div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>नई सूचनाएं</h2>
        <a href="/notices">सभी सूचनाएं →</a>
      </div>
      <div id="home-notices" class="grid">
        <div class="empty">सूचनाएं लोड हो रही हैं...</div>
      </div>
    </section>
  `;
}

function aboutPage() {
  return `
    ${pageTitle("हमारे बारे में")}
    <div class="card">
      <h3>ग्राम पंचायत पंडुवा</h3>
      <p>
        ग्राम पंचायत पंडुवा, विकास क्षेत्र बारा, जनपद प्रयागराज,
        उत्तर प्रदेश में स्थित है।
      </p>
      <p style="margin-top:12px">
        <strong>प्रधान:</strong> राजू प्रसाद प्रधान
      </p>
      <p style="margin-top:12px">
        इस वेबसाइट का उद्देश्य पंचायत की सूचनाएं, विकास कार्य,
        योजनाओं और जन शिकायतों की जानकारी ऑनलाइन उपलब्ध कराना है।
      </p>
    </div>
  `;
}

function servicesPage() {
  return `
    ${pageTitle("पंचायत सेवाएं", "अपनी जरूरत की सेवा चुनें।")}
    <div class="grid">${serviceCards()}</div>
  `;
}

function contactPage() {
  return `
    ${pageTitle("संपर्क करें")}
    <div class="card">
      <h3>ग्राम पंचायत पंडुवा</h3>
      <p>बारा, प्रयागराज, उत्तर प्रदेश</p>
      <p>प्रधान: राजू प्रसाद प्रधान</p>
      <p class="form-note">
        फोन नंबर और ईमेल की पुष्टि होने पर यहां जोड़े जा सकते हैं।
      </p>
      <a class="btn btn-primary" href="/complaint">शिकायत दर्ज करें</a>
    </div>
  `;
}

function loginPage() {
  return `
    ${pageTitle("लॉगिन", "अपने पंचायत खाते में प्रवेश करें।")}
    <form id="login-form" class="card form-card">
      <div class="form-group">
        <label>ईमेल</label>
        <input name="email" type="email" required autocomplete="email">
      </div>
      <div class="form-group">
        <label>पासवर्ड</label>
        <input name="password" type="password" required autocomplete="current-password">
      </div>
      <button class="btn btn-primary" type="submit">लॉगिन करें</button>
      <p class="form-note">खाता नहीं है? <a href="/register">रजिस्टर करें</a></p>
      <div id="login-message"></div>
    </form>
  `;
}

function registerPage() {
  return `
    ${pageTitle("नया खाता बनाएं")}
    <form id="register-form" class="card form-card">
      <div class="form-group">
        <label>पूरा नाम</label>
        <input name="name" required maxlength="100">
      </div>
      <div class="form-group">
        <label>ईमेल</label>
        <input name="email" type="email" required>
      </div>
      <div class="form-group">
        <label>पासवर्ड</label>
        <input name="password" type="password" minlength="8" required>
        <p class="form-note">कम से कम 8 अक्षर रखें।</p>
      </div>
      <button class="btn btn-primary" type="submit">रजिस्टर करें</button>
      <p class="form-note">पहले से खाता है? <a href="/login">लॉगिन करें</a></p>
      <div id="register-message"></div>
    </form>
  `;
}

function complaintPage() {
  return `
    ${pageTitle("ऑनलाइन शिकायत", "अपनी समस्या पंचायत तक पहुंचाएं।")}
    <form id="complaint-form" class="card form-card">
      <div class="form-group">
        <label>आपका नाम</label>
        <input name="name" required maxlength="100">
      </div>
      <div class="form-group">
        <label>मोबाइल नंबर</label>
        <input name="mobile" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required>
      </div>
      <div class="form-group">
        <label>शिकायत का विषय</label>
        <input name="subject" required maxlength="200" placeholder="जैसे सड़क, नाली, पानी">
      </div>
      <div class="form-group">
        <label>पूरी समस्या लिखें</label>
        <textarea name="details" required maxlength="3000"></textarea>
      </div>
      <button class="btn btn-primary" type="submit">शिकायत भेजें</button>
      <div id="complaint-message"></div>
    </form>
  `;
}

function trackPage() {
  return `
    ${pageTitle("शिकायत ट्रैक करें", "अपना शिकायत ट्रैकिंग नंबर डालें।")}
    <form id="track-form" class="card form-card">
      <div class="form-group">
        <label>ट्रैकिंग नंबर</label>
        <input name="code" required placeholder="अपना ट्रैकिंग नंबर डालें">
      </div>
      <button class="btn btn-primary" type="submit">स्थिति देखें</button>
      <div id="track-result"></div>
    </form>
  `;
}

function profilePage() {
  if (!currentUser) return loginPage();

  return `
    ${pageTitle("आपकी प्रोफाइल")}
    <div class="card">
      <h3>${esc(currentUser.name)}</h3>
      <p>${esc(currentUser.email)}</p>
      <p>खाता प्रकार: ${currentUser.role === "admin" ? "एडमिन" : "सामान्य उपयोगकर्ता"}</p>
      <div class="hero-actions">
        ${currentUser.role === "admin" ? '<a class="btn btn-primary" href="/admin">एडमिन पैनल</a>' : ""}
        <button class="btn btn-danger" id="logout-button">लॉगआउट</button>
      </div>
    </div>
  `;
}

function statusLabel(status) {
  const names = {
    pending: "लंबित",
    in_progress: "कार्य जारी",
    resolved: "समाधान हो गया",
    ongoing: "कार्य जारी",
    completed: "पूरा हो गया"
  };
  return names[status] || status || "जानकारी उपलब्ध नहीं";
}

function postCard(post) {
  const category = CATEGORY_NAMES[post.category] || post.category || "जानकारी";
  const image = post.image_url
    ? `<img class="post-image" src="${esc(post.image_url)}" alt="${esc(post.title)}" loading="lazy">`
    : "";

  return `
    <article class="card post-card">
      ${image}
      <div class="post-content">
        <span class="tag">${esc(category)}</span>
        <h3>${esc(post.title)}</h3>
        <p>${esc(post.description)}</p>
        ${post.video_url ? `<p><a href="${esc(post.video_url)}" target="_blank" rel="noopener">▶ वीडियो देखें</a></p>` : ""}
        ${post.amount != null ? `<p><strong>राशि:</strong> ₹${esc(post.amount)}</p>` : ""}
        <div class="post-meta">${post.created_at ? new Date(post.created_at).toLocaleDateString("hi-IN") : ""}</div>
      </div>
    </article>
  `;
}

async function loadPosts(category, target, limit = 30) {
  const box = document.getElementById(target);
  if (!box) return;

  try {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    const data = await api("/api/posts" + query);
    const posts = Array.isArray(data) ? data : (data.posts || []);

    box.innerHTML = posts.length
      ? posts.slice(0, limit).map(postCard).join("")
      : '<div class="empty">अभी कोई जानकारी प्रकाशित नहीं हुई है।</div>';
  } catch (error) {
    box.innerHTML = `<div class="empty">${esc(error.message)}</div>`;
  }
}

async function categoryPage(category) {
  const title = CATEGORY_NAMES[category] || "पंचायत जानकारी";

  app.innerHTML = `
    ${pageTitle(title, "इस विषय से जुड़ी प्रकाशित जानकारी।")}
    <div class="section">
      <div id="category-posts" class="grid">
        <div class="empty">जानकारी लोड हो रही है...</div>
      </div>
    </div>
  `;

  await loadPosts(category, "category-posts");
}

function adminPage() {
  return `
    ${pageTitle("एडमिन पैनल", "पंचायत की पोस्ट और शिकायतों का प्रबंधन।")}

    <section class="card">
      <h3>नई जानकारी प्रकाशित करें</h3>
      <form id="post-form">
        <div class="form-group">
          <label>शीर्षक</label>
          <input name="title" required maxlength="200">
        </div>
        <div class="form-group">
          <label>श्रेणी</label>
          <select name="category" required>
            ${SERVICES.map(item => `<option value="${esc(item[2])}">${esc(item[1])}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>विवरण</label>
          <textarea name="description" required maxlength="5000"></textarea>
        </div>
        <div class="form-group">
          <label>फोटो का ऑनलाइन URL (वैकल्पिक)</label>
          <input name="image_url" type="url" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>वीडियो का ऑनलाइन URL (वैकल्पिक)</label>
          <input name="video_url" type="url" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>राशि (वैकल्पिक)</label>
          <input name="amount" type="number" min="0" step="0.01">
        </div>
        <button class="btn btn-primary" type="submit">प्रकाशित करें</button>
        <div id="post-message"></div>
      </form>
    </section>

    <section class="section">
      <h3>प्रकाशित पोस्ट</h3>
      <div id="admin-posts" class="grid">लोड हो रहा है...</div>
    </section>

    <section class="section">
      <h3>जन शिकायतें</h3>
      <div id="admin-complaints">लोड हो रहा है...</div>
    </section>
  `;
}

async function loadAdminPosts() {
  const box = document.getElementById("admin-posts");
  if (!box) return;

  try {
    const data = await api("/api/posts?category=all");
    const posts = Array.isArray(data) ? data : (data.posts || []);

    box.innerHTML = posts.length ? posts.map(post => `
      <div class="card">
        <span class="tag">${esc(CATEGORY_NAMES[post.category] || post.category)}</span>
        <h3>${esc(post.title)}</h3>
        <p>${esc(post.description)}</p>
        <button class="btn btn-danger" data-delete-post="${esc(post.id)}">डिलीट</button>
      </div>
    `).join("") : '<div class="empty">अभी कोई पोस्ट नहीं है।</div>';
  } catch (error) {
    box.innerHTML = `<div class="error-box">${esc(error.message)}</div>`;
  }
}

async function loadAdminComplaints() {
  const box = document.getElementById("admin-complaints");
  if (!box) return;

  try {
    const data = await api("/api/admin/complaints");
    const complaints = Array.isArray(data) ? data : (data.complaints || []);

    if (!complaints.length) {
      box.innerHTML = '<div class="empty">अभी कोई शिकायत नहीं मिली।</div>';
      return;
    }

    box.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ट्रैकिंग नंबर</th>
              <th>नाम</th>
              <th>मोबाइल</th>
              <th>विषय</th>
              <th>स्थिति</th>
              <th>बदलें</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(item => `
              <tr>
                <td>${esc(item.tracking_code)}</td>
                <td>${esc(item.name)}</td>
                <td>${esc(item.mobile)}</td>
                <td>${esc(item.subject)}</td>
                <td>${esc(statusLabel(item.status))}</td>
                <td>
                  <select data-complaint-status="${esc(item.id)}">
                    <option value="pending" ${item.status === "pending" ? "selected" : ""}>लंबित</option>
                    <option value="in_progress" ${item.status === "in_progress" ? "selected" : ""}>कार्य जारी</option>
                    <option value="resolved" ${item.status === "resolved" ? "selected" : ""}>समाधान</option>
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    box.innerHTML = `<div class="error-box">${esc(error.message)}</div>`;
  }
}

async function render() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const routes = {
    "/": homePage,
    "/about": aboutPage,
    "/services": servicesPage,
    "/contact": contactPage,
    "/login": loginPage,
    "/register": registerPage,
    "/complaint": complaintPage,
    "/track-complaint": trackPage,
    "/profile": profilePage,
    "/admin": adminPage
  };

  if (routes[path]) {
    app.innerHTML = routes[path]();

    if (path === "/") {
      loadPosts("news", "home-news", 3);
      loadPosts("notices", "home-notices", 3);
    }

    if (path === "/admin") {
      if (!currentUser || currentUser.role !== "admin") {
        app.innerHTML = `
          ${pageTitle("एडमिन लॉगिन जरूरी है")}
          <div class="card">
            <p>इस पेज को देखने के लिए एडमिन खाते से लॉगिन करें।</p>
            <a class="btn btn-primary" href="/login">लॉगिन करें</a>
          </div>
        `;
      } else {
        loadAdminPosts();
        loadAdminComplaints();
      }
    }

    updateNav(path);
    return;
  }

  const category = path.slice(1);
  if (CATEGORY_NAMES[category]) {
    await categoryPage(category);
    updateNav(path);
    return;
  }

  app.innerHTML = `
    ${pageTitle("पेज नहीं मिला")}
    <div class="card">
      <p>माफ कीजिए, यह पेज उपलब्ध नहीं है।</p>
      <a class="btn btn-primary" href="/">होम पेज पर जाएं</a>
    </div>
  `;

  updateNav(path);
}

function updateNav(path) {
  document.querySelectorAll(".main-nav a").forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === path);
  });
}

document.addEventListener("submit", async event => {
  const form = event.target;
  const values = Object.fromEntries(new FormData(form).entries());

  if (form.id === "login-form") {
    event.preventDefault();

    try {
      await api("/api/login", {
        method: "POST",
        body: JSON.stringify(values)
      });

      await loadCurrentUser();
      toast("लॉगिन सफल हुआ।");
      go(currentUser?.role === "admin" ? "/admin" : "/profile");
    } catch (error) {
      document.getElementById("login-message").innerHTML =
        `<div class="error-box">${esc(error.message)}</div>`;
    }
  }

  if (form.id === "register-form") {
    event.preventDefault();

    try {
      await api("/api/register", {
        method: "POST",
        body: JSON.stringify(values)
      });

      toast("रजिस्ट्रेशन सफल हुआ। अब लॉगिन करें।");
      go("/login");
    } catch (error) {
      document.getElementById("register-message").innerHTML =
        `<div class="error-box">${esc(error.message)}</div>`;
    }
  }

  if (form.id === "complaint-form") {
    event.preventDefault();

    try {
      const result = await api("/api/complaints", {
        method: "POST",
        body: JSON.stringify(values)
      });

      const code = result.tracking_code || result.code || "";
      document.getElementById("complaint-message").innerHTML = `
        <div class="result-box">
          <h3>आपकी शिकायत भेज दी गई है।</h3>
          <p>अपना ट्रैकिंग नंबर सुरक्षित रखें:</p>
          <strong>${esc(code)}</strong>
          <p style="margin-top:10px">
            <a href="/track-complaint">शिकायत की स्थिति देखें</a>
          </p>
        </div>
      `;

      form.reset();
    } catch (error) {
      document.getElementById("complaint-message").innerHTML =
        `<div class="error-box">${esc(error.message)}</div>`;
    }
  }

  if (form.id === "track-form") {
    event.preventDefault();

    try {
      const result = await api(
        "/api/complaints/track/" + encodeURIComponent(values.code.trim())
      );

      const item = result.complaint || result;

      document.getElementById("track-result").innerHTML = `
        <div class="result-box">
          <h3>शिकायत की जानकारी</h3>
          <p><strong>ट्रैकिंग नंबर:</strong> ${esc(item.tracking_code || values.code)}</p>
          <p><strong>विषय:</strong> ${esc(item.subject)}</p>
          <p><strong>स्थिति:</strong> ${esc(statusLabel(item.status))}</p>
        </div>
      `;
    } catch (error) {
      document.getElementById("track-result").innerHTML =
        `<div class="error-box">${esc(error.message)}</div>`;
    }
  }

  if (form.id === "post-form") {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "admin") {
      toast("एडमिन लॉगिन जरूरी है।");
      return;
    }

    try {
      await api("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          amount: values.amount ? Number(values.amount) : null
        })
      });

      form.reset();
      document.getElementById("post-message").innerHTML =
        '<div class="result-box">पोस्ट प्रकाशित हो गई।</div>';

      await loadAdminPosts();
    } catch (error) {
      document.getElementById("post-message").innerHTML =
        `<div class="error-box">${esc(error.message)}</div>`;
    }
  }
});

document.addEventListener("click", async event => {
  if (event.target.id === "logout-button") {
    try {
      await api("/api/logout", { method: "POST" });
      currentUser = null;
      toast("लॉगआउट हो गया।");
      go("/");
    } catch (error) {
      toast(error.message);
    }
  }

  const deleteButton = event.target.closest("[data-delete-post]");
  if (deleteButton) {
    if (!confirm("क्या आप इस पोस्ट को डिलीट करना चाहते हैं?")) return;

    try {
      await api("/api/posts/" + encodeURIComponent(deleteButton.dataset.deletePost), {
        method: "DELETE"
      });

      toast("पोस्ट डिलीट हो गई।");
      await loadAdminPosts();
    } catch (error) {
      toast(error.message);
    }
  }
});

document.addEventListener("change", async event => {
  const select = event.target.closest("[data-complaint-status]");
  if (!select) return;

  try {
    await api("/api/admin/complaints/" + encodeURIComponent(select.dataset.complaintStatus), {
      method: "PATCH",
      body: JSON.stringify({ status: select.value })
    });

    toast("शिकायत की स्थिति अपडेट हो गई।");
    await loadAdminComplaints();
  } catch (error) {
    toast(error.message);
  }
});

async function loadCurrentUser() {
  try {
    const data = await api("/api/me");
    currentUser = data.user || data;
    if (!currentUser || !currentUser.id) currentUser = null;
  } catch {
    currentUser = null;
  }
}

async function startApp() {
  await loadCurrentUser();
  await render();
}

startApp();
