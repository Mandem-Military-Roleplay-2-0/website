"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  timestamp: string;
  width?: number;
  height?: number;
}

export function GalleryGrid() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})

  // Fetch gallery images
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/gallery')
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setGalleryImages(data.images || [])
        setError(null)
      } catch (err) {
        setError('Nepodařilo se načíst galerii')
        setGalleryImages([
          {
            id: "1",
            src: "/placeholder.svg?height=400&width=600",
            alt: "Vojenský vrtulník při přistání",
            title: "Vojenská operace",
            author: "Hráč123",
            timestamp: new Date().toISOString()
          },
          {
            id: "2",
            src: "/placeholder.svg?height=400&width=600",
            alt: "Vojáci v sestavě",
            title: "Vojenská formace",
            author: "MilitaryPro",
            timestamp: new Date().toISOString()
          },
          {
            id: "3",
            src: "/placeholder.svg?height=400&width=600",
            alt: "Vojenský konvoj",
            title: "Konvoj na misi",
            author: "TankCommander",
            timestamp: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [])

  const openLightbox = (imageIndex: number) => setSelectedImage(imageIndex)
  const closeLightbox = () => setSelectedImage(null)

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return
    let newIndex
    if (direction === "prev") {
      newIndex = selectedImage > 0 ? selectedImage - 1 : galleryImages.length - 1
    } else {
      newIndex = selectedImage < galleryImages.length - 1 ? selectedImage + 1 : 0
    }
    setSelectedImage(newIndex)
  }

  // Keyboard nav
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedImage === null) return
      switch (event.key) {
        case 'Escape': closeLightbox(); break
        case 'ArrowLeft': navigateImage('prev'); break
        case 'ArrowRight': navigateImage('next'); break
      }
    }
    if (selectedImage !== null) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Načítání galerie...</span>
      </div>
    )
  }

  if (error && galleryImages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  const selectedImageData = selectedImage !== null ? galleryImages[selectedImage] : null

  return (
    <>
      {galleryImages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Zatím nejsou k dispozici žádné schválené fotky.</p>
          <p className="text-sm mt-2">Fotky se zobrazí po schválení správci pomocí 👑 reakce.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <Card
              key={image.id}
              className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
              onClick={() => openLightbox(index)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {!loadedImages[image.id] && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                )}
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                    loadedImages[image.id] ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onLoad={() =>
                    setLoadedImages((prev) => ({ ...prev, [image.id]: true }))
                  }
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
              <div className="p-4">
                <h3 className="font-serif font-bold text-foreground mb-1 truncate">
                  {image.title}
                </h3>
                <p className="text-sm text-muted-foreground">Autor: {image.author}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(image.timestamp).toLocaleDateString('cs-CZ')}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage !== null && selectedImageData && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {galleryImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateImage("prev")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateImage("next")}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <div className="relative">
              <Image
                src={selectedImageData.src}
                alt={selectedImageData.alt}
                width={selectedImageData.width || 800}
                height={selectedImageData.height || 600}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white font-serif font-bold text-xl mb-1">
                  {selectedImageData.title}
                </h3>
                <p className="text-white/80">Autor: {selectedImageData.author}</p>
                <p className="text-white/60 text-sm mt-1">
                  {new Date(selectedImageData.timestamp).toLocaleDateString('cs-CZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-3 py-1 text-white text-sm">
                {selectedImage + 1} / {galleryImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
