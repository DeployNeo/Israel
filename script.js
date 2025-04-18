
const scannerContainer = document.getElementById("scanner-container");
const resultBox = document.getElementById("product-info");
const scanAgainBtn = document.getElementById("scan-again");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");

function fetchProductDetails(code) {
  fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
    .then(res => res.json())
    .then(data => {
      const product = data.product || {};
      const brand = product.brands || "Unknown";
      const name = product.product_name || "Unknown Product";
      const origin = product.countries_tags ? product.countries_tags.join(', ') : "Unknown";

      const isIsraeli = code.startsWith("729") || origin.toLowerCase().includes("israel");

      resultBox.classList.remove("hidden");
      resultBox.innerHTML = `
        <h3>${name}</h3>
        <p><strong>Brand:</strong> ${brand}</p>
        <p><strong>Origin:</strong> ${origin}</p>
        <p><strong>Barcode:</strong> ${code}</p>
        <p>${isIsraeli ? '✅ <b>This is likely an Israeli brand.</b>' : '❌ <b>This is NOT an Israeli brand.</b>'}</p>
      `;

      saveHistory({ code, name, brand, origin, isIsraeli });
      scanAgainBtn.classList.remove("hidden");
    })
    .catch(err => {
      resultBox.innerHTML = "<p>⚠️ Product not found or API error.</p>";
      scanAgainBtn.classList.remove("hidden");
    });
}

function saveHistory(data) {
  const history = JSON.parse(localStorage.getItem("scanHistory")) || [];
  history.unshift({ ...data, time: new Date().toLocaleString() });
  localStorage.setItem("scanHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("scanHistory")) || [];
  historyList.innerHTML = history.map(item => `
    <div class="history-card">
      <p><strong>${item.name}</strong> (${item.code})</p>
      <p>Brand: ${item.brand}</p>
      <p>Origin: ${item.origin}</p>
      <p>${item.isIsraeli ? "✅ Israeli Brand" : "❌ Not Israeli"}</p>
      <p><small>${item.time}</small></p>
    </div>
  `).join("");
}

function startScanner() {
  resultBox.classList.add("hidden");
  scanAgainBtn.classList.add("hidden");

  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: scannerContainer,
      constraints: {
        width: 640,
        height: 480,
        facingMode: "environment"
      }
    },
    decoder: {
      readers: ["ean_reader", "upc_reader", "code_128_reader"]
    },
    locate: true,
  }, err => {
    if (err) {
      console.error(err);
      resultBox.innerHTML = "❌ Error starting scanner.";
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(data => {
    const code = data.codeResult.code;
    if (code) {
      Quagga.stop();
      fetchProductDetails(code);
    }
  });
}

scanAgainBtn.addEventListener("click", () => {
  startScanner();
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("scanHistory");
  renderHistory();
});

window.onload = () => {
  startScanner();
  renderHistory();
};
