"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null)

      if (rejectedFiles.length > 0) {
        setError("Por favor, sube solo archivos Excel (.xlsx)")
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        onFileUpload(file)
      }
    },
    [onFileUpload],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    multiple: false,
  })

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-colors hover:bg-muted/50",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          error && "border-destructive",
        )}
      >
        <div className="p-8 text-center">
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                "rounded-full p-4",
                isDragActive && !isDragReject && "bg-primary/10",
                isDragReject && "bg-destructive/10",
                !isDragActive && "bg-muted",
              )}
            >
              {isDragReject ? (
                <AlertCircle className="h-8 w-8 text-destructive" />
              ) : (
                <FileSpreadsheet className={cn("h-8 w-8", isDragActive ? "text-primary" : "text-muted-foreground")} />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">
                {isDragActive
                  ? isDragReject
                    ? "Archivo no válido"
                    : "Suelta el archivo aquí"
                  : "Arrastra tu archivo Excel aquí"}
              </h3>
              <p className="text-sm text-muted-foreground">o haz clic para seleccionar un archivo</p>
              <p className="text-xs text-muted-foreground">Solo archivos .xlsx (máximo 10MB)</p>
            </div>

            <Button variant="outline" type="button">
              <Upload className="h-4 w-4 mr-2" />
              Seleccionar Archivo
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">Formato requerido del Excel:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Columna "Nombre": Nombre completo del estudiante</li>
          <li>Columna "Cedula": Número de cédula del estudiante</li>
        </ul>
      </div>
    </div>
  )
}
