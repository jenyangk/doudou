import React from "react"
import { Crown } from "lucide-react"

// Mock data for our images
const images = [
  { id: 1, url: "/placeholder.svg?height=100&width=100", votes: 120, title: "Cute Kitten" },
  { id: 2, url: "/placeholder.svg?height=100&width=100", votes: 85, title: "Playful Puppy" },
  { id: 3, url: "/placeholder.svg?height=100&width=100", votes: 72, title: "Baby Elephant" },
  { id: 4, url: "/placeholder.svg?height=100&width=100", votes: 63, title: "Little Duckling" },
  { id: 5, url: "/placeholder.svg?height=100&width=100", votes: 54, title: "Sleepy Sloth" },
  { id: 6, url: "/placeholder.svg?height=100&width=100", votes: 41, title: "Curious Raccoon" },
]

// Sort images by votes
const sortedImages = [...images].sort((a, b) => b.votes - a.votes)

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-purple-600">Cutest Image Leaderboard 🏆</h1>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end mb-16 space-x-4">
          {sortedImages.slice(0, 3).map((image, index) => (
            <div
              key={image.id}
              className={`flex flex-col items-center ${index === 1 ? "mb-8" : index === 2 ? "mb-16" : ""}`}
            >
              <Crown
                className={`w-8 h-8 mb-2 ${
                  index === 0
                    ? "text-yellow-400 animate-bounce"
                    : index === 1
                      ? "text-gray-400 animate-pulse"
                      : "text-yellow-600"
                }`}
              />
              <div className="relative">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={image.title}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white">
                  {index + 1}
                </div>
              </div>
              <p className="mt-2 font-semibold text-purple-700">{image.votes} votes</p>
              <p className="text-sm text-purple-600">{image.title}</p>
            </div>
          ))}
        </div>

        {/* Remaining Images */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">Other Contenders</h2>
          <ul className="space-y-4">
            {sortedImages.slice(3).map((image, index) => (
              <li
                key={image.id}
                className="flex items-center space-x-4 p-2 hover:bg-pink-50 rounded-lg transition-colors duration-200"
              >
                <span className="text-lg font-bold text-purple-500 w-8">{index + 4}.</span>
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={image.title}
                  className="w-12 h-12 rounded-full object-cover border-2 border-pink-200"
                />
                <div>
                  <p className="font-medium text-purple-700">{image.title}</p>
                  <p className="text-sm text-purple-500">{image.votes} votes</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
