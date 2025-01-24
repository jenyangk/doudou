'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { Crown, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import ReactCanvasConfetti from "react-canvas-confetti"
import confetti from "canvas-confetti"

interface ImageResult {
  id: number
  url: string
  voteCount: number
}

export default function Leaderboard(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [fire, setFire] = useState(false);
  const [confettiCount, setConfettiCount] = useState(0);

  // Fireworks configuration
  const canvasStyles = {
    position: 'fixed',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 999
  };

  const getAnimationData = (position: number) => {
    return {
      initial: { scale: 0.8, opacity: 0, y: 20 },
      animate: { 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: {
          type: "spring",
          delay: position * 0.2,
          duration: 0.5
        }
      },
      exit: { 
        scale: 0.8, 
        opacity: 0,
        transition: { duration: 0.3 }
      }
    };
  };

  const makeShot = useCallback((particleRatio: number, opts: any) => {
    confetti({
      ...opts,
      origin: { y: 0.3 },
      particleCount: Math.floor(200 * particleRatio)
    });
  }, []);

  const fireConfetti = useCallback(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    makeShot(0.2, {
      spread: 60,
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [makeShot]);

  const updateVoteCounts = (imageId: number, increment: number) => {
    setResults(currentResults => 
      currentResults.map(image => 
        image.id === imageId 
          ? { ...image, voteCount: image.voteCount + increment }
          : image
      ).sort((a, b) => b.voteCount - a.voteCount)
    );
  };

  useEffect(() => {
    const fetchResults = async () => {
      // Get the session ID from the slug
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id')
        .eq('sessionCode', params.slug)
        .single();

      if (!sessionData) return;
      setSessionId(sessionData.id);

      // Get all images and their vote counts
      const { data: imagesData } = await supabase
        .from('session_images')
        .select(`
          id,
          url,
          votes:votes(count)
        `)
        .eq('sessionId', sessionData.id);

      if (!imagesData) return;

      const formattedResults: ImageResult[] = imagesData.map(image => ({
        id: image.id,
        url: image.url,
        voteCount: image.votes[0]?.count ?? 0
      })).sort((a, b) => b.voteCount - a.voteCount);

      setResults(formattedResults);

      // Subscribe to vote changes
      const voteInsertChannel = supabase
        .channel('vote-insert')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'votes', filter: `sessionId=eq.${sessionData.id}` },
          (payload) => {
            const imageId = payload.new.imageId;
            updateVoteCounts(imageId, 1);
          }
        )
        .subscribe();

      const voteDeleteChannel = supabase
        .channel('vote-delete')
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'votes', filter: `sessionId=eq.${sessionData.id}` },
          (payload) => {
            const imageId = payload.old.imageId;
            updateVoteCounts(imageId, -1);
          }
        )
        .subscribe();

      // Subscribe to new images
      const imageChannel = supabase
        .channel('new-images')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'session_images', filter: `sessionId=eq.${sessionData.id}` },
          (payload) => {
            const newImage = {
              id: payload.new.id,
              url: payload.new.url,
              voteCount: 0
            };
            setResults(current => [...current, newImage].sort((a, b) => b.voteCount - a.voteCount));
          }
        )
        .subscribe();

      return () => {
        voteInsertChannel.unsubscribe();
        voteDeleteChannel.unsubscribe();
        imageChannel.unsubscribe();
      };
    };

    fetchResults();
  }, [params.slug]);

  useEffect(() => {
    if (results.length > 0 && confettiCount < 3) {
      fireConfetti();
      const interval = setInterval(() => {
        setConfettiCount(count => {
          if (count >= 2) {  // Stop at 3 times (0, 1, 2)
            clearInterval(interval);
            return count;
          }
          fireConfetti();
          return count + 1;
        });
      }, 3400);

      return () => clearInterval(interval);
    }
  }, [results, fireConfetti, confettiCount]);

  return (
    <div className="p-4 sm:p-8">
      <ReactCanvasConfetti style={canvasStyles as any} />
      <div className="max-w-md mx-auto">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-2"
        >
          <Link href={`/sessions/${params.slug}`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Session
            </Button>
          </Link>
        </motion.div>
        <motion.h1 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12"
        >
          Results 🏆
        </motion.h1>

        <div className="flex justify-center items-end mb-4 sm:mb-16 gap-2 sm:gap-4 h-[300px] sm:h-[400px]">
          <AnimatePresence mode="wait">
            {results.length >= 3 && (
              <>
                {/* Second Place */}
                <motion.div 
                  {...getAnimationData(1)}
                  className="flex flex-col items-center"
                  style={{ marginTop: '60px' }}
                >
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-slate-400 animate-pulse" />
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <Image
                      src={results[1].url}
                      alt="Second Place"
                      width={80}
                      height={80}
                      className="rounded-full object-cover border-4 border-slate-200 shadow-lg"
                    />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-2 -right-2 bg-slate-400 text-white text-xs font-bold rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-white"
                    >
                      2
                    </motion.div>
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-2 font-semibold text-xs sm:text-sm"
                  >
                    {results[1].voteCount} votes
                  </motion.p>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "8rem" }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-24 sm:w-32 bg-slate-200 mt-4"
                  />
                </motion.div>

                {/* First Place */}
                <motion.div 
                  {...getAnimationData(0)}
                  className="flex flex-col items-center"
                >
                  <Crown className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-yellow-500 animate-bounce" />
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <Image
                      src={results[0].url}
                      alt="First Place"
                      width={100}
                      height={100}
                      className="rounded-full object-cover border-4 border-yellow-200 shadow-lg"
                    />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-2 -right-2 bg-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-white"
                    >
                      1
                    </motion.div>
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-2 font-semibold text-xs sm:text-sm"
                  >
                    {results[0].voteCount} votes
                  </motion.p>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "10rem" }}
                    transition={{ duration: 0.5 }}
                    className="w-24 sm:w-32 bg-yellow-100 mt-4"
                  />
                </motion.div>

                {/* Third Place */}
                <motion.div 
                  {...getAnimationData(2)}
                  className="flex flex-col items-center"
                  style={{ marginTop: '100px' }}
                >
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 mb-2 text-amber-700" />
                  <div className="relative">
                    <Image
                      src={results[2].url}
                      alt="Third Place"
                      width={60}
                      height={60}
                      className="rounded-full object-cover border-4 border-amber-200 shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white text-xs font-bold rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-white">
                      3
                    </div>
                  </div>
                  <p className="mt-2 font-semibold text-xs sm:text-sm">{results[2].voteCount} votes</p>
                  <div className="w-24 sm:w-32 h-16 sm:h-24 bg-amber-100 mt-4"></div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Runner Ups with animations */}
        {results.length > 3 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="rounded-lg shadow-xl p-4 sm:p-6"
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Runner Ups</h2>
            <ul className="space-y-3">
              {results.slice(3, 7).map((image, index) => (
                <motion.li
                  key={image.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 1 }}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <span className="text-base sm:text-lg font-bold w-6 sm:w-8">{index + 4}.</span>
                  <Image
                    src={image.url}
                    alt={`Rank ${index + 4}`}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border-2 border-gray-200"
                  />
                  <div>
                    <p className="text-xs sm:text-sm">{image.voteCount} votes</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
