const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const {
  normalizeTitle,
  escapeRegExp,
} = require('../data/store');

const router = express.Router();

const isMongoAvailable = () => mongoose.connection.readyState === 1;

const requireMongoConnection = (res) => {
  if (!isMongoAvailable()) {
    return res.status(503).json({
      message: 'Database connection is not available. Set a valid MONGO_URI in your deployment environment.',
    });
  }

  return null;
};

const numberFromInput = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

router.get('/', async (_req, res) => {
  try {
    const mongoUnavailableResponse = requireMongoConnection(res);
    if (mongoUnavailableResponse) {
      return mongoUnavailableResponse;
    }

    const books = await Book.find().sort({ updatedAt: -1 });
    return res.json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load inventory.', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const title = normalizeTitle(req.body.title);
    const quantity = numberFromInput(req.body.quantity);

    if (!title) {
      return res.status(400).json({ message: 'Book title is required.' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a whole number greater than zero.' });
    }

    const mongoUnavailableResponse = requireMongoConnection(res);
    if (mongoUnavailableResponse) {
      return mongoUnavailableResponse;
    }

    const existingBook = await Book.findOne({
      title: { $regex: `^${escapeRegExp(title)}$`, $options: 'i' },
    });

    if (existingBook) {
      return res.status(409).json({
        message: 'A book with this title already exists. Please add stock to the existing book instead.',
        duplicate: true,
        existingBook,
      });
    }

    const book = await Book.create({ title, quantity });
    return res.status(201).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create a new book.', error: error.message });
  }
});

router.patch('/:id/add-stock', async (req, res) => {
  try {
    const quantity = numberFromInput(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a whole number greater than zero.' });
    }

    const mongoUnavailableResponse = requireMongoConnection(res);
    if (mongoUnavailableResponse) {
      return mongoUnavailableResponse;
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    book.quantity += quantity;
    await book.save();
    return res.json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to add stock.', error: error.message });
  }
});

router.patch('/:id/sell', async (req, res) => {
  try {
    const quantity = numberFromInput(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a whole number greater than zero.' });
    }

    const mongoUnavailableResponse = requireMongoConnection(res);
    if (mongoUnavailableResponse) {
      return mongoUnavailableResponse;
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    if (book.quantity < quantity) {
      return res.status(400).json({ message: 'Sale quantity exceeds current stock.' });
    }

    book.quantity -= quantity;
    await book.save();
    return res.json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to record a sale.', error: error.message });
  }
});

module.exports = router;
