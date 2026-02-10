'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function ReaderPage({ params }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const fetchBook = async () => {
        try {
          const docRef = doc(db, 'books', params.id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setBook(docSnap.data());
          } else {
            console.log('No such document!');
            setBook(null);
          }
        } catch (error) {
          console.error("Error fetching book: ", error);
        } finally {
          setLoading(false);
        }
      };

      fetchBook();
    }
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!book) {
    return <div className="flex items-center justify-center h-screen">Book not found.</div>;
  }

  return (
    <div className="p-6 md:p-12 bg-cream min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">{book.title}</h1>
        <p className="text-lg text-gray-600 mb-8">by {book.author}</p>
        
        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
          <p>{book.content}</p>
        </div>
      </div>
    </div>
  );
}
