/* =========================
   DOM ELEMENTS
========================= */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");

/* =========================
   STATE
========================= */
let allProducts = [];
let filteredProducts = [];
let selectedProducts = [];
let chatHistory = [];

/* =========================
   INIT UI
========================= */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* =========================
   LOAD PRODUCTS
========================= */
async function loadProducts() {
  const res = await fetch("products.json");
  const data = await res.json();
  allProducts = data.products;
  return allProducts;
}

/* =========================
   DISPLAY PRODUCTS
========================= */
function displayProducts(products) {
  filteredProducts = products;

  productsContainer.innerHTML = products
    .map((product, index) => {
      const isSelected = selectedProducts.some(
        (p) => p.name === product.name
      );

      return `
        <div class="product-card ${isSelected ? "selected" : ""}"
             onclick="toggleProduct(${index})">

          <img src="${product.image}" alt="${product.name}">

          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <p>${product.description || ""}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =========================
   TOGGLE PRODUCT
========================= */
function toggleProduct(index) {
  const product = filteredProducts[index];
  if (!product) return;

  const exists = selectedProducts.some(
    (p) => p.name === product.name
  );

  if (exists) {
    selectedProducts = selectedProducts.filter(
      (p) => p.name !== product.name
    );
  } else {
    selectedProducts.push(product);
  }

  saveSelections();
  updateSelectedUI();
  displayProducts(filteredProducts);
}

/* =========================
   SELECTED UI
========================= */
function updateSelectedUI() {
  selectedProductsList.innerHTML = "";

  selectedProducts.forEach((product) => {
    const div = document.createElement("div");
    div.className = "selected-item";

    div.innerHTML = `
      <span>${product.name}</span>
      <button onclick="removeProduct('${product.name}')">Remove</button>
    `;

    selectedProductsList.appendChild(div);
  });
}

function removeProduct(name) {
  selectedProducts = selectedProducts.filter(
    (p) => p.name !== name
  );

  saveSelections();
  updateSelectedUI();
  displayProducts(filteredProducts);
}

/* =========================
   LOCAL STORAGE
========================= */
function saveSelections() {
  localStorage.setItem(
    "selectedProducts",
    JSON.stringify(selectedProducts)
  );
}

function loadSelections() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) selectedProducts = JSON.parse(saved);
}

/* =========================
   CATEGORY FILTER
========================= */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();

  const filtered = products.filter(
    (p) => p.category === e.target.value
  );

  displayProducts(filtered);
});

/* =========================
   CALL WORKER
========================= */
async function callWorker(products, message) {
  const res = await fetch(
    "https://round-darkness-55c6.teklins7.workers.dev/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products,
        message,
        history: chatHistory
      })
    }
  );

  let data;
  try {
    data = await res.json();
  } catch {
    return { response: "Error: Invalid server response." };
  }

  return data;
}

/* =========================
   GENERATE ROUTINE
========================= */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<p><strong>Please select products first.</strong></p>`;
    return;
  }

  chatWindow.innerHTML += `<p><em>Generating your personalized routine...</em></p>`;

  try {
    const data = await callWorker(
      selectedProducts,
      "Generate skincare routine"
    );

    chatWindow.innerHTML += `
      <p><strong>Routine:</strong><br>
      ${data.response || data.error || "No response received."}</p>
    `;
  } catch {
    chatWindow.innerHTML += `
      <p><strong>Error:</strong> Could not generate routine.</p>
    `;
  }
});

/* =========================
   CHAT SYSTEMS for final
========================= */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value;
  userInput.value = "";

  chatHistory.push({ role: "user", content: message });

  chatWindow.innerHTML += `<p><strong>You:</strong> ${message}</p>`;

  try {
    const data = await callWorker(selectedProducts, message);

    chatHistory.push({
      role: "assistant",
      content: data.response
    });

    chatWindow.innerHTML += `
      <p><strong>Advisor:</strong>
      ${data.response || data.error || "No response."}</p>
    `;
  } catch {
    chatWindow.innerHTML += `
      <p><strong>Error:</strong> Chat failed.</p>
    `;
  }
});

/* =========================
   INIT
========================= */
(async function init() {
  const products = await loadProducts();
  loadSelections();
  updateSelectedUI();
  displayProducts(products);
})();