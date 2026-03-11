const baseUrlInput = document.getElementById("baseUrl");
const endpointInput = document.getElementById("booksEndpoint");
const apiKeyInput = document.getElementById("apiKey");
const apiSecretInput = document.getElementById("apiSecret");
const connectBtn = document.getElementById("connectBtn");
const toggleSecretBtn = document.getElementById("toggleSecretBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const statusText = document.getElementById("status");
const booksGrid = document.getElementById("booksGrid");
const bookTemplate = document.getElementById("bookCardTemplate");

let books = [];

const textOf = (value, fallback = "No disponible") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const normalizeBook = (raw) => ({
  title: textOf(raw.title ?? raw.name),
  author: textOf(raw.author ?? raw.writer),
  year: Number(raw.year ?? raw.publishedYear ?? raw.publication_year) || null,
  category: textOf(raw.category ?? raw.genre),
  description: textOf(raw.description ?? raw.summary, "Sin descripción"),
});

const setStatus = (message, isError = false) => {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b00020" : "#55607d";
};

const getVisibleBooks = () => {
  const term = searchInput.value.trim().toLowerCase();
  const sort = sortSelect.value;

  let filtered = books.filter((book) =>
    [book.title, book.author, book.category].some((field) =>
      field.toLowerCase().includes(term),
    ),
  );

  filtered.sort((a, b) => {
    switch (sort) {
      case "title-desc":
        return b.title.localeCompare(a.title);
      case "author-asc":
        return a.author.localeCompare(b.author);
      case "year-desc":
        return (b.year || 0) - (a.year || 0);
      case "year-asc":
        return (a.year || Number.MAX_SAFE_INTEGER) - (b.year || Number.MAX_SAFE_INTEGER);
      default:
        return a.title.localeCompare(b.title);
    }
  });

  return filtered;
};

const renderBooks = () => {
  booksGrid.innerHTML = "";
  const visibleBooks = getVisibleBooks();

  if (!visibleBooks.length) {
    booksGrid.innerHTML = "<p>No hay libros para mostrar con este filtro.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleBooks.forEach((book) => {
    const card = bookTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".book-card__title").textContent = book.title;
    card.querySelector(".book-card__author").textContent = `Autor: ${book.author}`;
    card.querySelector(".book-card__meta").textContent = `Año: ${book.year || "N/D"} • Categoría: ${book.category}`;
    card.querySelector(".book-card__desc").textContent = book.description;
    fragment.appendChild(card);
  });

  booksGrid.appendChild(fragment);
};

const buildUrl = () => {
  const baseUrl = baseUrlInput.value.trim().replace(/\/$/, "");
  const endpoint = endpointInput.value.trim() || "/books";

  if (!baseUrl) {
    throw new Error("Escribe la URL base de tu API antes de conectar.");
  }

  return `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

const fetchBooks = async () => {
  const url = buildUrl();
  const apiKey = apiKeyInput.value.trim();
  const apiSecret = apiSecretInput.value.trim();

  setStatus("Conectando con la API...");

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-api-secret": apiSecret,
    },
  });

  if (!response.ok) {
    throw new Error(`La API respondió con estado ${response.status}.`);
  }

  const data = await response.json();
  const list = Array.isArray(data) ? data : data.books;

  if (!Array.isArray(list)) {
    throw new Error("La API no devolvió un array de libros ni una propiedad 'books'.");
  }

  books = list.map(normalizeBook);
  renderBooks();
  setStatus(`Conexión exitosa. ${books.length} libros cargados.`);
};

connectBtn.addEventListener("click", async () => {
  try {
    await fetchBooks();
  } catch (error) {
    books = [];
    renderBooks();
    setStatus(error.message, true);
  }
});

toggleSecretBtn.addEventListener("click", () => {
  apiSecretInput.type = apiSecretInput.type === "password" ? "text" : "password";
});

clearBtn.addEventListener("click", () => {
  books = [];
  searchInput.value = "";
  renderBooks();
  setStatus("Resultados limpiados.");
});

searchInput.addEventListener("input", renderBooks);
sortSelect.addEventListener("change", renderBooks);

renderBooks();
