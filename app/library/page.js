"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import Link from 'next/link';

export default function LibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksCollection = collection(db, 'books');
        const bookSnapshot = await getDocs(booksCollection);
        const booksList = bookSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBooks(booksList);
      } catch (error) {
        console.error("Error fetching books: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading books...</div>;
  }

  return (
    <div className="p-6 bg-cream min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Library</h1>
      
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((book) => (
            <Link href={`/reader/${book.id}`} key={book.id} className="block bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <div className="relative h-60">
                <img src={book.coverImage} alt={`${book.title} cover`} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">{book.difficulty}</span>
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 truncate">{book.title}</h2>
                <p className="text-sm text-gray-600">by {book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 mt-10">No books found. Use the admin page to upload some!</p>
      )}
    </div>
  );
}
