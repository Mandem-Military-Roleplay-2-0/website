"use client"

import { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

const galleryImages = [
  {
    id: 1,
    src: "/placeholder.svg?height=400&width=600",
    alt: "Vojenský vrtulník při přistání",
    title: "Vojenská operace",
    author: "Hráč123",
  },
  {
    id: 2,
    src: "/placeholder.svg?height=400&width=600",
    alt: "Vojáci v sestavě",
    title: "Vojenská formace",
    author: "MilitaryPro",
  },
  {
    id: 3,
    src: "/placeholder.svg?height=400&width=600",
    alt: "Vojenský konvoj",
    title: "Konvoj na misi",
    author: "TankCommander",
  },
  {
    id: 4,
    src: "/placeholder.svg?height=400&width=600",
    alt: "Vojenská základna v noci",
    title: "Základna v noci",
    author: "NightOps",
  },
  {
    id: 5,
    src: "/placeholder.svg?height=400&width=600",
    alt: "Vojenský výcvik",
    title: "Výcvikové cvičení",
    author: "Sergeant",
  },
  {
    id: 6,
    src: "/placeholder.svg?height=400&width=600",
    alt: "Vojenský ceremoniál",
    title: "Vojenský ceremoniál",
    author: "Colonel",
  },
]

export function GalleryGrid() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return

    const currentIndex = galleryImages.findIndex((img) => img.id === selectedImage)
    let newIndex

    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : galleryImages.length - 1
    } else {
      newIndex = currentIndex < galleryImages.length - 1 ? currentIndex + 1 : 0
    }

    setSelectedImage(galleryImages[newIndex].id)
  }

  const selectedImageData = galleryImages.find((img) => img.id === selectedImage)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryImages.map((image) => (
          <Card
            key={image.id}
            className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
            onClick={() => openLightbox(image.id)}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
            <div className="p-4">
              <h3 className="font-serif font-bold text-foreground mb-1">{image.title}</h3>
              <p className="text-sm text-muted-foreground">Autor: {image.author}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && selectedImageData && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

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

            <div className="relative">
              <Image
                src={selectedImageData.src || "/placeholder.svg"}
                alt={selectedImageData.alt}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white font-serif font-bold text-xl mb-1">{selectedImageData.title}</h3>
                <p className="text-white/80">Autor: {selectedImageData.author}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
