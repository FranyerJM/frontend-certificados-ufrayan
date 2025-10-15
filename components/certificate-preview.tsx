"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar, Clock } from "lucide-react"

interface CertificatePreviewProps {
  courseTitle: string
  duration: number
  hasInstructor: boolean
  instructor?: string
}

export function CertificatePreview({ courseTitle, duration, hasInstructor, instructor }: CertificatePreviewProps) {
  const currentDate = new Date()
  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Vista Previa del Certificado
        </CardTitle>
        <CardDescription>Así se verá el certificado generado</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Certificate Preview */}
        <div className="bg-gradient-to-br from-card to-muted border-2 border-border rounded-lg p-8 text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary">CERTIFICADO DE FINALIZACIÓN</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
          </div>

          {/* Student Name Placeholder */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Se certifica que</p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-lg font-semibold text-muted-foreground italic">[Nombre del Estudiante]</p>
            </div>
          </div>

          {/* Course Info */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">ha completado satisfactoriamente el curso de</p>
            <h3 className="text-xl font-bold text-foreground">{courseTitle || "Curso Seleccionado"}</h3>

            {/* Course Details */}
            <div className="flex flex-wrap justify-center gap-2">
              {duration > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration} horas
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {currentMonth} {currentYear}
              </Badge>
            </div>
          </div>

          {/* Instructor */}
          {hasInstructor && (
            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Instructor</p>
              <p className="font-medium">{instructor || "[Nombre del Instructor]"}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-muted-foreground pt-4">
            <p>
              Edo. Carabobo, {currentMonth} {currentYear}
            </p>
          </div>
        </div>

        {/* Certificate Info */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-sm">Información del Certificado:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-muted-foreground">Curso:</span>
              <span className="font-medium">{courseTitle || "No seleccionado"}</span>
            </div>
            {duration > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-muted-foreground">Duración:</span>
                <span className="font-medium">{duration}h</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full" />
              <span className="text-muted-foreground">Instructor:</span>
              <span className="font-medium">{hasInstructor ? instructor || "Por definir" : "Sin instructor"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full" />
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">
                {currentMonth} {currentYear}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
