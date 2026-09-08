const normalizeTitle = (value) => String(value ?? '').trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const unavailableError = () => {
  throw new Error('The in-memory inventory fallback has been disabled. Configure MONGO_URI and connect to MongoDB Atlas.');
};

module.exports = {
  getBookStore: unavailableError,
  saveBookStore: unavailableError,
  normalizeTitle,
  escapeRegExp,
  findBookById: unavailableError,
  findBookByTitle: unavailableError,
  createBookRecord: unavailableError,
  updateBookRecord: unavailableError,
};
