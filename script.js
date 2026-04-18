/* =========================
   DOM REFERENCES
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
   INITIAL UI STATE
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
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* =========================
   RENDER PRODUCTS
========================= */
function displayProducts(products) {
  filteredProducts = products;

  productsContainer.innerHTML = products
    .map((product, index) => {
      const isSelected = selectedProducts.some(p => p.name === product.name);

      return `
        <div class="product-card ${isSelected ? "selected" : ""}"
             onclick="toggleProduct(${index})">

          <img src="${product.image}" alt="${product.name}">

          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <p class="desc">${product.description || ""}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

/* =========================
   SELECT / UNSELECT PRODUCT
========================= */
function toggleProduct(index) {
  const product = filteredProducts[index];

  const exists = selectedProducts.find(p => p.name === product.name);

  if (exists) {
    selectedProducts = selectedProducts.filter(p => p.name !== product.name);
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

  selectedProducts.forEach(product => {
    const item = document.createElement("div");
    item.className = "selected-item";

    item.innerHTML = `
      <span>${product.name}</span>
      <button onclick="removeProduct('${product.name}')">Remove</button>
    `;

    selectedProductsList.appendChild(item);
  });
}

/* Remove product */
function removeProduct(name) {
  selectedProducts = selectedProducts.filter(p => p.name !== name);

  saveSelections();
  updateSelectedUI();
  displayProducts(filteredProducts);
}

/* =========================
   LOCAL STORAGE
========================= */
function saveSelections() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

function loadSelections() {
  const saved = localStorage.getItem("selectedProducts");

  if (saved) {
    selectedProducts = JSON.parse(saved);
    updateSelectedUI();
  }
}

/* =========================
   CATEGORY FILTER
========================= */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filtered = products.filter(
    product => product.category === selectedCategory
  );

  displayProducts(filtered);
});

/* =========================
   CLOUDFARE WORKER CALL
========================= */
async function callWorker(products, message = "") {
  const response = await fetch("YOUR_WORKER_URL_HERE", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      products,
      message,
      history: chatHistory
    })
  });

  return await response.json();
}

/* =========================
   GENERATE ROUTINE (AI)
========================= */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<p><strong>Select products first.</strong></p>`;
    return;
  }

  chatWindow.innerHTML += `<p><em>Generating your personalized routine...</em></p>`;

  const data = await callWorker(selectedProducts, "Generate routine");

  chatWindow.innerHTML += `
    <p><strong>AI Routine:</strong><br>${data.response}</p>
  `;
});

/* =========================
   CHAT (FOLLOW-UP MEMORY)
========================= */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value;

  chatHistory.push({ role: "user", content: message });

  chatWindow.innerHTML += `<p><strong>You:</strong> ${message}</p>`;

  const data = await callWorker(selectedProducts, message);

  chatHistory.push({ role: "assistant", content: data.response });

  chatWindow.innerHTML += `
    <p><strong>Advisor:</strong> ${data.response}</p>
  `;

  userInput.value = "";
});

/* =========================
   INIT
========================= */
(async function init() {
  await loadProducts();
  loadSelections();
})();