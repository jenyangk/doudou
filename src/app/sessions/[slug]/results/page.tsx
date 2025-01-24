'use client'

import { useState, useEffect } from "react"
import { Crown, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ImageResult {
  id: number
  url: string
  voteCount: number
}

export default function Leaderboard(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const fetchResults = async () => {
    // First get the session ID from the slug
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id')
      .eq('sessionCode', params.slug)
      .single();

    if (!sessionData) return;
    setSessionId(sessionData.id);

    // Get all images and their vote counts
    const { data: images } = await supabase
      .from('session_images')
      .select(`
        id,
        url,
        votes (
          id
        )
      `)
      .eq('sessionId', sessionData.id);

    if (!images) return;

    // Transform the data to include vote counts
    const imageResults: ImageResult[] = images.map(image => ({
      id: image.id,
      url: image.url,
      voteCount: (image.votes as any[])?.length || 0
    }));

    // Sort by vote count
    const sortedResults = imageResults.sort((a, b) => b.voteCount - a.voteCount);
    setResults(sortedResults);
  };

  useEffect(() => {
    fetchResults();

    // Set up real-time subscriptions
    if (sessionId) {
      // Listen for vote insertions
      const voteInsertChannel = supabase
        .channel('vote-insert')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'votes',
            filter: `sessionId=eq.${sessionId}`
          },
          () => {
            fetchResults();
          }
        )
        .subscribe();

      // Listen for vote deletions
      const voteDeleteChannel = supabase
        .channel('vote-delete')
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'votes',
            filter: `sessionId=eq.${sessionId}`
          },
          () => {
            fetchResults();
          }
        )
        .subscribe();

      // Listen for new images
      const imageChannel = supabase
        .channel('new-images')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'session_images',
            filter: `sessionId=eq.${sessionId}`
          },
          () => {
            fetchResults();
          }
        )
        .subscribe();

      // Cleanup function
      return () => {
        voteInsertChannel.unsubscribe();
        voteDeleteChannel.unsubscribe();
        imageChannel.unsubscribe();
      };
    }
  }, [params.slug, sessionId]);

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/sessions/${params.slug}`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Session
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12">Results 🏆</h1>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end mb-4 sm:mb-16 gap-2 sm:gap-4 h-[300px] sm:h-[400px]">
          {results.length >= 3 && (
            <>
              {/* Second Place - Left */}
              <div className="flex flex-col items-center" style={{ marginTop: '60px' }}>
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-slate-400 animate-pulse" />
                <div className="relative">
                  <Image
                    src={results[1].url}
                    alt="Second Place"
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-4 border-slate-200 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-slate-400 text-white text-xs font-bold rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-white">
                    2
                  </div>
                </div>
                <p className="mt-2 font-semibold text-xs sm:text-sm">{results[1].voteCount} votes</p>
                <div className="w-24 sm:w-32 h-24 sm:h-32 bg-slate-200 mt-4"></div>
              </div>

              {/* First Place - Middle */}
              <div className="flex flex-col items-center">
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-yellow-500 animate-bounce" />
                <div className="relative">
                  <Image
                    src={results[0].url}
                    alt="First Place"
                    width={100}
                    height={100}
                    className="rounded-full object-cover border-4 border-yellow-200 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-white">
                    1
                  </div>
                </div>
                <p className="mt-2 font-semibold text-xs sm:text-sm">{results[0].voteCount} votes</p>
                <div className="w-24 sm:w-32 h-32 sm:h-40 bg-yellow-100 mt-4"></div>
              </div>

              {/* Third Place - Right */}
              <div className="flex flex-col items-center" style={{ marginTop: '100px' }}>
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
              </div>
            </>
          )}
        </div>

        {/* Remaining Images */}
        {results.length > 3 && (
          <div className="rounded-lg shadow-xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Runner Ups</h2>
            <ul className="space-y-3">
              {results.slice(3, 7).map((image, index) => (
                <li
                  key={image.id}
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
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
