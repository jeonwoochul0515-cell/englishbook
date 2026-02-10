'use client';

import { useEffect, useState, Fragment } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext'; // 사용자 정보 가져오기

export default function ReaderPage({ params }) {
  const { user } = useAuth(); // 현재 로그인된 사용자 정보
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(null);
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [vocabulary, setVocabulary] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showXpMessage, setShowXpMessage] = useState(false); // XP 획득 메시지 상태

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
          console.error('Error fetching book: ', error);
        } finally {
          setLoading(false);
        }
      };
      fetchBook();
    }
  }, [params.id]);

  const handleSentenceClick = async (index, sentence) => {
    if (selectedSentenceIndex === index) {
      setSelectedSentenceIndex(null);
      setSelectedSentence(null);
      setTranslatedText('');
      setVocabulary(null);
    } else {
      setSelectedSentenceIndex(index);
      setSelectedSentence(sentence);
      setTranslatedText('');
      setVocabulary(null);
      await analyzeVocabulary(sentence);
    }
  };

  const analyzeVocabulary = async (sentence) => {
    if (!sentence) return;
    setIsAnalyzing(true);
    setVocabulary(null);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVocabulary(data);

    } catch (error) {
      console.error("Error analyzing vocabulary:", error);
      setVocabulary({ error: "단어 분석에 실패했습니다. 잠시 후 다시 시도해주세요." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranslate = async () => {
    if (!selectedSentence) return;
    setIsTranslating(true);
    setTranslatedText('');

    // This is a placeholder for translation logic.
    setTimeout(() => {
      const mockTranslation = `[${selectedSentence}] 에 대한 번역 결과입니다.`;
      setTranslatedText(mockTranslation);
      setIsTranslating(false);
    }, 1000);
  };

  // "완독" 버튼 클릭 시 실행될 함수
  const handleCompleteReading = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: increment(50) // xp 필드를 50만큼 증가
      });

      // 축하 메시지 표시
      setShowXpMessage(true);
      setTimeout(() => {
        setShowXpMessage(false);
      }, 3000); // 3초 후에 메시지 숨김

    } catch (error) {
      console.error("Error updating user XP:", error);
      alert('XP를 획득하는 데 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!book) {
    return <div className="flex items-center justify-center h-screen">Book not found.</div>;
  }

  const sentences = book.content.match(/[^.!?]+[.!?]*/g) || [];

  return (
    <div className="relative p-6 md:p-12 bg-cream min-h-screen">
      {/* XP 획득 축하 메시지 */}
      {showXpMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <p className="font-bold">🎉 50 XP 획득! 🎉</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">{book.title}</h1>
        <p className="text-lg text-gray-600 mb-8">by {book.author}</p>
        
        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
          {sentences.map((sentence, index) => {
            const isSelected = selectedSentenceIndex === index;
            const sentenceText = sentence.trim();

            return (
              <Fragment key={index}>
                <span 
                  className={`cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleSentenceClick(index, sentenceText)}
                >
                  {sentenceText}{' '}
                </span>
                {isSelected && (
                  <div className="my-4 p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg shadow-md">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="px-4 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all"
                      >
                        {isTranslating ? '번역 중...' : '번역하기'}
                      </button>
                    </div>

                    {isTranslating && <p className="mt-2 text-sm text-gray-500">AI가 번역 중입니다...</p>}
                    {translatedText && <p className="mt-2 p-3 bg-white rounded-md text-gray-700">{translatedText}</p>}
                    
                    <div className="mt-4 pt-4 border-t border-yellow-200">
                      <h3 className="font-bold text-md text-gray-800">AI 단어장</h3>
                      {isAnalyzing && <p className="text-sm text-gray-500 italic mt-1">AI가 단어를 분석 중입니다...</p>}
                      {vocabulary && !vocabulary.error && (
                        <div className="mt-2">
                          <p className="font-semibold text-lg text-indigo-700">{vocabulary.word}</p>
                          <p className="text-md text-gray-600">{vocabulary.meaning}</p>
                        </div>
                      )}
                      {vocabulary && vocabulary.error && <p className="text-sm text-red-500 mt-1">{vocabulary.error}</p>}
                    </div>
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>

        {/* 완독 버튼 추가 */}
        <div className="mt-10 text-center">
            <button 
                onClick={handleCompleteReading}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
                완독! 경험치 얻기
            </button>
        </div>
      </div>
    </div>
  );
}
