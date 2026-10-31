/**
 * Mock Data Store
 * Matches the API contract specified in PRD Section 7.
 * Provides in-memory state with persistence to localStorage during mock testing.
 */

export const INITIAL_CATEGORIES = [
  { id: 1, name: "Computer Science" },
  { id: 2, name: "Software Architecture" },
  { id: 3, name: "Web Development" },
  { id: 4, name: "Data Science & AI" },
  { id: 5, name: "Design & UX" },
  { id: 6, name: "Product & Management" },
];

export const INITIAL_USERS = [
  {
    id: 1,
    name: "Regular User",
    email: "user@example.com",
    role: "user",
    password: "password123",
    created_at: "2026-01-10T08:00:00Z",
  },
  {
    id: 2,
    name: "System Administrator",
    email: "admin@example.com",
    role: "admin",
    password: "adminpassword",
    created_at: "2026-01-01T08:00:00Z",
  },
  {
    id: 3,
    name: "Alex Dev",
    email: "alex@example.com",
    role: "user",
    password: "password123",
    created_at: "2026-02-01T10:00:00Z",
  }
];

export const INITIAL_BOOKS = [
  {
    id: 1,
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    category: "Software Architecture",
    categoryId: 2,
    cover_image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
    description: "The big ideas behind reliable, scalable, and maintainable systems. Explores storage engines, transactions, distributed consensus, fault tolerance, and stream processing architectures.",
    download_count: 3420,
    created_at: "2026-01-10T10:00:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: false,
    file_size: "4.8 MB",
    pages: 616,
    isbn: "978-1449373320"
  },
  {
    id: 2,
    title: "Clean Architecture: A Craftsman's Guide",
    author: "Robert C. Martin",
    category: "Software Architecture",
    categoryId: 2,
    cover_image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80",
    description: "Practical software architecture solutions from legendary expert Robert C. Martin. Learn universal rules of software structure, boundary separation, and dependency inversion.",
    download_count: 2890,
    created_at: "2026-01-15T12:00:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: true,
    file_size: "3.2 MB",
    pages: 432,
    isbn: "978-0134494166"
  },
  {
    id: 3,
    title: "Learning React: Modern Patterns",
    author: "Alex Banks & Eve Porcello",
    category: "Web Development",
    categoryId: 3,
    cover_image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&auto=format&fit=crop&q=80",
    description: "A comprehensive guide to modern React development, functional components, hooks, asynchronous data fetching, and state management strategies.",
    download_count: 2150,
    created_at: "2026-01-20T09:30:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: false,
    file_size: "2.7 MB",
    pages: 350,
    isbn: "978-1492051725"
  },
  {
    id: 4,
    title: "Refactoring: Improving Code Design",
    author: "Martin Fowler",
    category: "Computer Science",
    categoryId: 1,
    cover_image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=500&auto=format&fit=crop&q=80",
    description: "For more than twenty years, highly experienced programmers have relied on Martin Fowler's Refactoring to improve software design and maintainability.",
    download_count: 1980,
    created_at: "2026-01-25T14:15:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: true,
    file_size: "5.1 MB",
    pages: 448,
    isbn: "978-0134757599"
  },
  {
    id: 5,
    title: "Deep Learning with Python",
    author: "François Chollet",
    category: "Data Science & AI",
    categoryId: 4,
    cover_image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80",
    description: "Written by Keras creator François Chollet, this book introduces deep learning concepts and practical code implementations using Python and neural networks.",
    download_count: 3100,
    created_at: "2026-02-01T11:00:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: false,
    file_size: "6.3 MB",
    pages: 504,
    isbn: "978-1617295218"
  },
  {
    id: 6,
    title: "Don't Make Me Think, Revisited",
    author: "Steve Krug",
    category: "Design & UX",
    categoryId: 5,
    cover_image: "https://images.unsplash.com/photo-1507842229451-7f01be777a26?w=500&auto=format&fit=crop&q=80",
    description: "A common sense approach to Web and mobile usability. The foundational guide for designers, product managers, and developers.",
    download_count: 1650,
    created_at: "2026-02-05T16:45:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: false,
    file_size: "1.9 MB",
    pages: 216,
    isbn: "978-0321965516"
  },
  {
    id: 7,
    title: "The Design of Everyday Things",
    author: "Don Norman",
    category: "Design & UX",
    categoryId: 5,
    cover_image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80",
    description: "Cognitive science and human-centered design principles that make digital and physical products intuitive and enjoyable to use.",
    download_count: 2400,
    created_at: "2026-02-10T10:20:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: false,
    file_size: "3.4 MB",
    pages: 368,
    isbn: "978-0465050659"
  },
  {
    id: 8,
    title: "Database Internals: A Deep Dive",
    author: "Alex Petrov",
    category: "Computer Science",
    categoryId: 1,
    cover_image: "",
    description: "A comprehensive guide on how distributed storage engines, B-Trees, LSM-Trees, and internal algorithms work under high concurrency.",
    download_count: 980,
    created_at: "2026-02-22T14:00:00Z",
    pdf_url: "/sample-files/sample-book.pdf",
    is_favorite: false,
    file_size: "4.1 MB",
    pages: 376,
    isbn: "978-1492040347"
  }
];

export const INITIAL_DOWNLOADS = [
  {
    id: "dl-101",
    bookId: 2,
    title: "Clean Architecture: A Craftsman's Guide",
    author: "Robert C. Martin",
    category: "Software Architecture",
    cover_image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80",
    downloaded_at: "2026-02-18T14:22:00Z",
    file_size: "3.2 MB",
    format: "PDF",
  },
  {
    id: "dl-102",
    bookId: 4,
    title: "Refactoring: Improving Code Design",
    author: "Martin Fowler",
    category: "Computer Science",
    cover_image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=500&auto=format&fit=crop&q=80",
    downloaded_at: "2026-02-24T09:15:00Z",
    file_size: "5.1 MB",
    format: "PDF",
  }
];

export const INITIAL_REQUESTS = [
  {
    id: "req-1",
    userId: 1,
    requesterName: "Regular User",
    requesterEmail: "user@example.com",
    bookName: "Site Reliability Engineering",
    author: "Betsy Beyer, Chris Jones et al.",
    category: "Computer Science",
    note: "Would be great for our infrastructure study group.",
    status: "pending", // "pending" | "approved" | "rejected"
    created_at: "2026-02-20T11:30:00Z"
  },
  {
    id: "req-2",
    userId: 1,
    requesterName: "Regular User",
    requesterEmail: "user@example.com",
    bookName: "High Performance Browser Networking",
    author: "Ilya Grigorik",
    category: "Web Development",
    note: "Need this to optimize web page load times and TCP/UDP streams.",
    status: "approved",
    created_at: "2026-02-15T09:00:00Z"
  },
  {
    id: "req-3",
    userId: 3,
    requesterName: "Alex Dev",
    requesterEmail: "alex@example.com",
    bookName: "Kubernetes Up & Running",
    author: "Brendan Burns, Joe Beda, Kelsey Hightower",
    category: "Software Architecture",
    note: "Preparing for CKA certification.",
    status: "pending",
    created_at: "2026-02-22T15:40:00Z"
  }
];

// Persistent state simulation via localStorage
const getInitialData = (key, fallback) => {
  try {
    const item = localStorage.getItem(`mock_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const saveMockData = (key, data) => {
  try {
    localStorage.setItem(`mock_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to persist mock_${key}:`, err);
  }
};

let users = getInitialData('users', INITIAL_USERS);
let categories = getInitialData('categories', INITIAL_CATEGORIES);
let books = getInitialData('books', INITIAL_BOOKS);
let downloads = getInitialData('downloads', INITIAL_DOWNLOADS);
let requests = getInitialData('requests', INITIAL_REQUESTS);

function generateDummyPdfBlob(bookTitle) {
  const content = `%PDF-1.4
1 0 obj
<< /Title (${bookTitle}) /Author (BookVerse E-Library) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
5 0 obj
<< /Length 72 >>
stream
BT
/F1 24 Tf
50 700 Td
(${bookTitle}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000128 00000 n 
0000000188 00000 n 
0000000273 00000 n 
trailer
<< /Size 6 /Root 2 0 R >>
startxref
395
%%EOF`;

  return new Blob([content], { type: 'application/pdf' });
}

export const mockHandlers = {
  // Auth
  login: async ({ email, password }) => {
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser || foundUser.password !== password) {
      throw new Error("Invalid email or password.");
    }
    const token = `mock-jwt-${foundUser.role}-${foundUser.id}-${Date.now()}`;
    return {
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      },
    };
  },

  register: async ({ name, email, password }) => {
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error("An account with this email already exists.");
    }
    const newUser = {
      id: Date.now(),
      name,
      email,
      role: "user",
      password,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    saveMockData('users', users);

    const token = `mock-jwt-user-${newUser.id}-${Date.now()}`;
    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  },

  // Categories
  getCategories: async () => [...categories],

  createCategory: async ({ name }) => {
    if (!name || name.trim() === '') {
      throw new Error("Category name is required.");
    }
    const exists = categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      throw new Error("A category with this name already exists.");
    }
    const newCategory = {
      id: Date.now(),
      name: name.trim(),
    };
    categories.push(newCategory);
    saveMockData('categories', categories);
    return newCategory;
  },

  deleteCategory: async (id) => {
    const catId = Number(id);
    const index = categories.findIndex((c) => c.id === catId);
    if (index === -1) {
      throw new Error(`Category with ID ${id} not found.`);
    }
    const deleted = categories.splice(index, 1)[0];
    saveMockData('categories', categories);
    return { success: true, message: `Category '${deleted.name}' deleted successfully.` };
  },

  // Books
  getBooks: async (params = {}) => {
    const {
      search = '',
      category = '',
      sort = 'newest',
      page = 1,
      limit = 6,
    } = params;

    let filtered = [...books];

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'all' && category !== '') {
      filtered = filtered.filter(
        (b) => b.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === 'downloads') {
      filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    } else if (sort === 'title_asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'title_desc') {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 6;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedBooks = filtered.slice(startIndex, startIndex + limitNum);

    return {
      books: paginatedBooks,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    };
  },

  getBookById: async (id) => {
    const book = books.find((b) => b.id === Number(id));
    if (!book) {
      throw new Error(`Book with ID ${id} not found.`);
    }
    return { ...book };
  },

  createBook: async (bookData) => {
    const { title, author, category, description, cover_image, file_size = "3.5 MB" } = bookData;
    if (!title || !author || !category) {
      throw new Error("Title, author, and category are required.");
    }

    const newBook = {
      id: Date.now(),
      title,
      author,
      category,
      cover_image: cover_image || "",
      description: description || "No description provided.",
      download_count: 0,
      created_at: new Date().toISOString(),
      pdf_url: "/sample-files/sample-book.pdf",
      is_favorite: false,
      file_size,
      pages: Math.floor(Math.random() * 300) + 200,
      isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    };

    books.unshift(newBook);
    saveMockData('books', books);
    return newBook;
  },

  deleteBook: async (id) => {
    const bookId = Number(id);
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) {
      throw new Error(`Book with ID ${id} not found.`);
    }
    const deleted = books.splice(index, 1)[0];
    saveMockData('books', books);
    return { success: true, message: `Book '${deleted.title}' deleted successfully.` };
  },

  toggleFavorite: async (id) => {
    const bookIndex = books.findIndex((b) => b.id === Number(id));
    if (bookIndex === -1) {
      throw new Error(`Book with ID ${id} not found.`);
    }

    const currentStatus = Boolean(books[bookIndex].is_favorite);
    books[bookIndex].is_favorite = !currentStatus;
    saveMockData('books', books);

    return {
      success: true,
      is_favorite: books[bookIndex].is_favorite,
      book: { ...books[bookIndex] },
    };
  },

  getFavorites: async () => {
    return books.filter((b) => b.is_favorite);
  },

  downloadBook: async (id) => {
    const book = books.find((b) => b.id === Number(id));
    if (!book) {
      throw new Error(`Book with ID ${id} not found.`);
    }

    book.download_count = (book.download_count || 0) + 1;
    saveMockData('books', books);

    const downloadRecord = {
      id: `dl-${Date.now()}`,
      bookId: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      cover_image: book.cover_image,
      downloaded_at: new Date().toISOString(),
      file_size: book.file_size || "3.5 MB",
      format: "PDF",
    };
    downloads.unshift(downloadRecord);
    saveMockData('downloads', downloads);

    return generateDummyPdfBlob(book.title);
  },

  getDownloads: async () => [...downloads],

  getRecentBooks: async (limit = 4) => {
    const sorted = [...books].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted.slice(0, limit);
  },

  getPopularBooks: async (limit = 4) => {
    const sorted = [...books].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    return sorted.slice(0, limit);
  },

  // Users (Admin)
  getUsers: async () => {
    // Return users without passwords
    return users.map(({ password, ...u }) => u);
  },

  deleteUser: async (id) => {
    const userId = Number(id);
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }
    const deleted = users.splice(index, 1)[0];
    saveMockData('users', users);
    return { success: true, message: `User '${deleted.email}' deleted.` };
  },

  // Requests (Phase 3)
  createRequest: async (requestData, currentUser) => {
    const { bookName, author, category, note } = requestData;
    if (!bookName || !author || !category) {
      throw new Error("Book name, author, and category are required.");
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser?.id || 1,
      requesterName: currentUser?.name || "Regular User",
      requesterEmail: currentUser?.email || "user@example.com",
      bookName: bookName.trim(),
      author: author.trim(),
      category: category.trim(),
      note: (note || "").trim(),
      status: "pending",
      created_at: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    saveMockData('requests', requests);
    return newRequest;
  },

  getMyRequests: async (currentUser) => {
    const uid = currentUser?.id || 1;
    return requests.filter((r) => r.userId === uid);
  },

  getAllRequests: async () => {
    return [...requests];
  },

  updateRequestStatus: async (id, status) => {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const reqItem = requests.find((r) => r.id === id);
    if (!reqItem) {
      throw new Error(`Request with ID ${id} not found.`);
    }

    reqItem.status = status;
    saveMockData('requests', requests);
    return { ...reqItem };
  },
};
