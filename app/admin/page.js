'use client';

import { collection, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

const booksToUpload = [
  {
    title: 'The Tortoise and the Hare',
    author: 'Aesop',
    content: 'A Hare was making fun of the Tortoise one day for being so slow. "Do you ever get anywhere?" he asked with a mocking laugh. "Yes," replied the Tortoise, "and I get there sooner than you think. I\'ll run you a race." The Hare was much amused at the idea of running a race with the Tortoise, but for the fun of the thing he agreed. So the Fox, who had consented to act as judge, marked the distance and started the runners off. The Hare was soon far out of sight, and to make the Tortoise feel very deeply how ridiculous it was for him to try a race with a Hare, he lay down beside the course to take a nap until the Tortoise should catch up. The Tortoise meanwhile kept going slowly but steadily, and, after a time, passed the place where the Hare was sleeping, but the Hare slept on very peacefully; and when at last he did wake up, the Tortoise was near the goal. The Hare now ran his swiftest, but he could not overtake the Tortoise in time.',
    difficulty: 'A1',
    coverImage: 'https://images.unsplash.com/photo-1593332152461-c6993172637a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'The Fox and the Grapes',
    author: 'Aesop',
    content: 'A hungry Fox saw some fine bunches of grapes hanging from a vine that was trained along a high trellis. "Just the thing to quench my thirst," said he. Drawing back a few paces, he took a run and a jump, and just missed the bunch. Turning round again with a One, Two, Three, he jumped up, but with no greater success. Again and again he tried after the tempting morsel, but at last had to give it up, and walked away with his nose in the air, saying: "I am sure they are sour." It is easy to despise what you cannot get.',
    difficulty: 'A2',
    coverImage: 'https://images.unsplash.com/photo-1629093721326-a79c936380a0?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'The Lion and the Mouse',
    author: 'Aesop',
    content: 'A Lion was awakened from sleep by a Mouse running over his face. Rising up angrily, he caught him and was about to kill him, when the Mouse piteously entreated, saying: "If you would only spare my life, I would be sure to repay your kindness." The Lion laughed and let him go. It happened shortly after this that the Lion was caught by some hunters, who bound him by strong ropes to the ground. The Mouse, recognizing his roar, came and gnawed the rope with his teeth, and set him free, exclaiming: "You ridiculed the idea of my ever being able to help you, expecting to receive from me no repayment of your favor; but now you know that it is possible for even a Mouse to confer benefits on a Lion."',
    difficulty: 'B1',
    coverImage: 'https://images.unsplash.com/photo-1631894239833-3342b1875b8a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

export default function AdminPage() {
  const handleUpload = async () => {
    const batch = writeBatch(db);
    const booksCollection = collection(db, 'books');

    booksToUpload.forEach((book) => {
      const docRef = doc(booksCollection);
      batch.set(docRef, book);
    });

    try {
      await batch.commit();
      alert('Successfully uploaded 3 books!');
    } catch (error) {
      console.error('Error uploading books: ', error);
      alert('Failed to upload books.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Control</h1>
        <p className="text-gray-600">
          Use this page to perform administrative actions. Be careful, as these
          actions can directly modify the database.
        </p>
        <button
          onClick={handleUpload}
          className="w-full p-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Upload Sample Books
        </button>
        <p className="text-xs text-gray-500 mt-4">
          This will add 3 sample books (Aesop's Fables) to the 'books' collection in Firestore.
        </p>
      </div>
    </div>
  );
}
